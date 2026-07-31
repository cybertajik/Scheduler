import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Schedule, Assignment, ShiftInstance, Worker, User, AuditLog
from app.models.repair import ScheduleRepair
from app.schemas.auto_repair import (
    ConflictDiagnosticItem,
    RepairPlanOut,
    RepairApplyResponse,
    RepairHistoryItem
)
from app.services.auto_repair_engine import AutoRepairEngine
from app.services.audit_service import AuditService

class RepairService:
    """
    Service for applying, previewing, undoing, redoing, and logging schedule repair plans.
    """

    @staticmethod
    def analyze_schedule(db: Session, schedule_id: uuid.UUID) -> List[ConflictDiagnosticItem]:
        sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not sched:
            raise HTTPException(status_code=404, detail="Schedule not found.")
        return AutoRepairEngine.analyze_conflicts(db, sched)

    @staticmethod
    def get_repair_plans(db: Session, schedule_id: uuid.UUID) -> List[RepairPlanOut]:
        sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not sched:
            raise HTTPException(status_code=404, detail="Schedule not found.")
        return AutoRepairEngine.generate_repair_plans(db, sched)

    @staticmethod
    def apply_repair_plan(
        db: Session,
        schedule_id: uuid.UUID,
        plan: RepairPlanOut,
        author_id: Optional[uuid.UUID] = None
    ) -> RepairApplyResponse:
        sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not sched:
            raise HTTPException(status_code=404, detail="Schedule not found.")

        # 1. Capture snapshot_before
        snapshot_before = RepairService._capture_assignments_snapshot(sched)

        # 2. Apply Actions
        applied_count = 0
        for action in plan.actions:
            if action.action_type in ["SWAP", "REASSIGN", "REPLACE"] and action.target_worker_id:
                # Find assignment or create assignment
                if action.original_worker_id:
                    asgns = db.query(Assignment).filter(
                        Assignment.worker_id == uuid.UUID(action.original_worker_id)
                    ).all()
                    for a in asgns:
                        a.worker_id = uuid.UUID(action.target_worker_id)
                        a.notes = f"Auto-Repaired via {plan.plan_name}"
                        applied_count += 1
                else:
                    # Create new assignment for unassigned shift instance if exists
                    inst = sched.shift_instances[0] if sched.shift_instances else None
                    if inst:
                        new_a = Assignment(
                            id=uuid.uuid4(),
                            shift_instance_id=inst.id,
                            worker_id=uuid.UUID(action.target_worker_id),
                            assignment_source="MANUAL",
                            notes=f"Auto-Repaired via {plan.plan_name}"
                        )
                        db.add(new_a)
                        applied_count += 1

        db.flush()

        # 3. Capture snapshot_after
        snapshot_after = RepairService._capture_assignments_snapshot(sched)

        # 4. Save ScheduleRepair audit record
        repair_record = ScheduleRepair(
            id=uuid.uuid4(),
            schedule_id=sched.id,
            author_id=author_id,
            plan_name=plan.plan_name,
            disruption_score=plan.disruption_score,
            conflicts_resolved_count=plan.conflicts_resolved_count,
            assignments_changed_count=len(plan.actions),
            status="APPLIED",
            explainability_report=plan.explainability.model_dump(),
            snapshot_before=snapshot_before,
            snapshot_after=snapshot_after,
            applied_at=datetime.now(timezone.utc)
        )
        db.add(repair_record)
        db.commit()

        # Log Audit
        AuditService.log_action(
            db=db,
            action="APPLY_REPAIR",
            entity_type="Schedule",
            entity_id=str(sched.id),
            user_id=str(author_id) if author_id else None,
            new_value={"plan_name": plan.plan_name, "actions_count": len(plan.actions)}
        )

        return RepairApplyResponse(
            message=f"Successfully applied repair plan '{plan.plan_name}'.",
            repair_id=str(repair_record.id),
            schedule_id=str(sched.id),
            applied_actions_count=len(plan.actions),
            undo_available=True
        )

    @staticmethod
    def undo_last_repair(db: Session, schedule_id: uuid.UUID, author_id: Optional[uuid.UUID] = None) -> RepairApplyResponse:
        repair = (
            db.query(ScheduleRepair)
            .filter(ScheduleRepair.schedule_id == schedule_id, ScheduleRepair.status == "APPLIED")
            .order_by(ScheduleRepair.applied_at.desc())
            .first()
        )
        if not repair or not repair.snapshot_before:
            raise HTTPException(status_code=400, detail="No applicable repair record found to undo.")

        RepairService._restore_assignments_snapshot(db, schedule_id, repair.snapshot_before)

        repair.status = "REVERTED"
        repair.reverted_at = datetime.now(timezone.utc)
        db.commit()

        AuditService.log_action(
            db=db,
            action="UNDO_REPAIR",
            entity_type="Schedule",
            entity_id=str(schedule_id),
            user_id=str(author_id) if author_id else None,
            new_value={"repair_id": str(repair.id), "plan_name": repair.plan_name}
        )

        return RepairApplyResponse(
            message=f"Reverted repair plan '{repair.plan_name}' to previous schedule state.",
            repair_id=str(repair.id),
            schedule_id=str(schedule_id),
            applied_actions_count=repair.assignments_changed_count,
            undo_available=False
        )

    @staticmethod
    def redo_last_repair(db: Session, schedule_id: uuid.UUID, author_id: Optional[uuid.UUID] = None) -> RepairApplyResponse:
        repair = (
            db.query(ScheduleRepair)
            .filter(ScheduleRepair.schedule_id == schedule_id, ScheduleRepair.status == "REVERTED")
            .order_by(ScheduleRepair.reverted_at.desc())
            .first()
        )
        if not repair or not repair.snapshot_after:
            raise HTTPException(status_code=400, detail="No reverted repair record found to redo.")

        RepairService._restore_assignments_snapshot(db, schedule_id, repair.snapshot_after)

        repair.status = "APPLIED"
        repair.applied_at = datetime.now(timezone.utc)
        db.commit()

        return RepairApplyResponse(
            message=f"Re-applied repair plan '{repair.plan_name}'.",
            repair_id=str(repair.id),
            schedule_id=str(schedule_id),
            applied_actions_count=repair.assignments_changed_count,
            undo_available=True
        )

    @staticmethod
    def get_repair_history(db: Session, schedule_id: uuid.UUID) -> List[RepairHistoryItem]:
        repairs = (
            db.query(ScheduleRepair)
            .filter(ScheduleRepair.schedule_id == schedule_id)
            .order_by(ScheduleRepair.created_at.desc())
            .all()
        )
        users = {str(u.id): f"{u.first_name} {u.last_name}" for u in db.query(User).all()}

        return [
            RepairHistoryItem(
                id=str(r.id),
                schedule_id=str(r.schedule_id),
                plan_name=r.plan_name,
                author_name=users.get(str(r.author_id), "System"),
                disruption_score=r.disruption_score,
                conflicts_resolved_count=r.conflicts_resolved_count,
                assignments_changed_count=r.assignments_changed_count,
                status=r.status,
                applied_at=r.applied_at.isoformat() if r.applied_at else None
            )
            for r in repairs
        ]

    @staticmethod
    def _capture_assignments_snapshot(sched: Schedule) -> Dict[str, Any]:
        snapshot = []
        for inst in sched.shift_instances:
            for asgn in inst.assignments:
                snapshot.append({
                    "id": str(asgn.id),
                    "shift_instance_id": str(asgn.shift_instance_id),
                    "worker_id": str(asgn.worker_id),
                    "locked": asgn.locked,
                    "notes": asgn.notes
                })
        return {"assignments": snapshot}

    @staticmethod
    def _restore_assignments_snapshot(db: Session, schedule_id: uuid.UUID, snapshot: Dict[str, Any]):
        sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not sched:
            return

        for inst in sched.shift_instances:
            db.query(Assignment).filter(Assignment.shift_instance_id == inst.id).delete(synchronize_session=False)

        for a_data in snapshot.get("assignments", []):
            new_a = Assignment(
                id=uuid.UUID(a_data["id"]),
                shift_instance_id=uuid.UUID(a_data["shift_instance_id"]),
                worker_id=uuid.UUID(a_data["worker_id"]),
                assignment_source="MANUAL",
                locked=a_data.get("locked", False),
                notes=a_data.get("notes")
            )
            db.add(new_a)

        db.flush()
