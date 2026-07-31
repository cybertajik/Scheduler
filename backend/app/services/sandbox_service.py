import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Schedule, ScheduleStatus, Assignment, ShiftInstance, Worker, User, AuditLog
from app.models.sandbox import SandboxSchedule, SandboxShiftInstance, SandboxAssignment, SandboxVersion
from app.schemas.sandbox import SandboxCreate, SandboxUpdate, SandboxOut, SandboxVersionOut
from app.services.audit_service import AuditService

class SandboxService:
    """
    Service for managing Sandbox schedule lifecycle, data cloning, versioning, and promotion.
    """

    @staticmethod
    def create_sandbox(db: Session, data: SandboxCreate, author_id: Optional[uuid.UUID] = None) -> SandboxSchedule:
        parent_id = uuid.UUID(data.parent_schedule_id) if data.parent_schedule_id else None
        parent_sched = None

        if parent_id:
            parent_sched = db.query(Schedule).filter(Schedule.id == parent_id).first()
            if not parent_sched:
                raise HTTPException(status_code=404, detail="Parent schedule not found.")

        year = data.year or (parent_sched.year if parent_sched else datetime.now().year)
        month = data.month or (parent_sched.month if parent_sched else datetime.now().month)

        sandbox = SandboxSchedule(
            id=uuid.uuid4(),
            parent_schedule_id=parent_id,
            name=data.name,
            description=data.description,
            status="DRAFT",
            version=1,
            author_id=author_id,
            year=year,
            month=month,
            scenario_type=data.scenario_type or "CUSTOM",
            scenario_params=data.scenario_params or {}
        )
        db.add(sandbox)
        db.flush()

        # Clone shift instances and assignments if parent schedule exists
        if parent_sched and parent_sched.shift_instances:
            for inst in parent_sched.shift_instances:
                sb_inst = SandboxShiftInstance(
                    id=uuid.uuid4(),
                    sandbox_id=sandbox.id,
                    date=inst.date,
                    shift_type_id=inst.shift_type_id,
                    required_workers=inst.required_workers
                )
                db.add(sb_inst)
                db.flush()

                for asgn in inst.assignments:
                    sb_asgn = SandboxAssignment(
                        id=uuid.uuid4(),
                        sandbox_shift_instance_id=sb_inst.id,
                        worker_id=asgn.worker_id,
                        assignment_source=asgn.assignment_source.value if hasattr(asgn.assignment_source, 'value') else str(asgn.assignment_source),
                        locked=asgn.locked,
                        notes=asgn.notes
                    )
                    db.add(sb_asgn)

        # Create initial version log
        version_log = SandboxVersion(
            sandbox_id=sandbox.id,
            version_number=1,
            change_description="Initial sandbox creation & data clone.",
            author_id=author_id
        )
        db.add(version_log)

        db.commit()
        db.refresh(sandbox)

        # Audit Log
        AuditService.log_action(
            db=db,
            action="CREATE_SANDBOX",
            entity_type="SandboxSchedule",
            entity_id=str(sandbox.id),
            user_id=str(author_id) if author_id else None,
            new_value={"name": sandbox.name, "parent_schedule_id": str(parent_id) if parent_id else None}
        )

        return sandbox

    @staticmethod
    def duplicate_sandbox(db: Session, sandbox_id: uuid.UUID, author_id: Optional[uuid.UUID] = None) -> SandboxSchedule:
        orig = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not orig:
            raise HTTPException(status_code=404, detail="Source sandbox not found.")

        new_sandbox = SandboxSchedule(
            id=uuid.uuid4(),
            parent_schedule_id=orig.parent_schedule_id,
            name=f"{orig.name} (Copy)",
            description=orig.description,
            status="DRAFT",
            version=1,
            author_id=author_id,
            year=orig.year,
            month=orig.month,
            scenario_type=orig.scenario_type,
            scenario_params=orig.scenario_params
        )
        db.add(new_sandbox)
        db.flush()

        for inst in orig.shift_instances:
            sb_inst = SandboxShiftInstance(
                id=uuid.uuid4(),
                sandbox_id=new_sandbox.id,
                date=inst.date,
                shift_type_id=inst.shift_type_id,
                required_workers=inst.required_workers
            )
            db.add(sb_inst)
            db.flush()

            for asgn in inst.assignments:
                sb_asgn = SandboxAssignment(
                    id=uuid.uuid4(),
                    sandbox_shift_instance_id=sb_inst.id,
                    worker_id=asgn.worker_id,
                    assignment_source=asgn.assignment_source,
                    locked=asgn.locked,
                    notes=asgn.notes
                )
                db.add(sb_asgn)

        version_log = SandboxVersion(
            sandbox_id=new_sandbox.id,
            version_number=1,
            change_description=f"Cloned from sandbox '{orig.name}'",
            author_id=author_id
        )
        db.add(version_log)

        db.commit()
        db.refresh(new_sandbox)
        return new_sandbox

    @staticmethod
    def update_sandbox(db: Session, sandbox_id: uuid.UUID, data: SandboxUpdate) -> SandboxSchedule:
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox:
            raise HTTPException(status_code=404, detail="Sandbox not found.")

        if data.name is not None:
            sandbox.name = data.name
        if data.description is not None:
            sandbox.description = data.description
        if data.status is not None:
            sandbox.status = data.status
        if data.scenario_type is not None:
            sandbox.scenario_type = data.scenario_type
        if data.scenario_params is not None:
            sandbox.scenario_params = data.scenario_params

        db.commit()
        db.refresh(sandbox)
        return sandbox

    @staticmethod
    def delete_sandbox(db: Session, sandbox_id: uuid.UUID):
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox:
            raise HTTPException(status_code=404, detail="Sandbox not found.")

        db.delete(sandbox)
        db.commit()

    @staticmethod
    def archive_sandbox(db: Session, sandbox_id: uuid.UUID) -> SandboxSchedule:
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox:
            raise HTTPException(status_code=404, detail="Sandbox not found.")
        sandbox.status = "ARCHIVED"
        db.commit()
        db.refresh(sandbox)
        return sandbox

    @staticmethod
    def restore_sandbox(db: Session, sandbox_id: uuid.UUID) -> SandboxSchedule:
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox:
            raise HTTPException(status_code=404, detail="Sandbox not found.")
        sandbox.status = "DRAFT"
        db.commit()
        db.refresh(sandbox)
        return sandbox

    @staticmethod
    def promote_sandbox(db: Session, sandbox_id: uuid.UUID, author_id: Optional[uuid.UUID] = None) -> Schedule:
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox or not sandbox.parent_schedule_id:
            raise HTTPException(status_code=400, detail="Sandbox schedule has no linked parent schedule to promote into.")

        parent_sched = db.query(Schedule).filter(Schedule.id == sandbox.parent_schedule_id).first()
        if not parent_sched:
            raise HTTPException(status_code=404, detail="Parent production schedule not found.")

        # Map parent shift instances: (date_str, shift_type_id) -> ShiftInstance
        parent_inst_map = {(str(inst.date).split(' ')[0], str(inst.shift_type_id)): inst for inst in parent_sched.shift_instances}

        # Clear existing assignments in parent schedule
        for inst in parent_sched.shift_instances:
            db.query(Assignment).filter(Assignment.shift_instance_id == inst.id).delete(synchronize_session=False)

        promoted_count = 0
        for sb_inst in sandbox.shift_instances:
            key = (str(sb_inst.date).split(' ')[0], str(sb_inst.shift_type_id))
            target_inst = parent_inst_map.get(key)
            if target_inst:
                for sb_asgn in sb_inst.assignments:
                    new_asgn = Assignment(
                        id=uuid.uuid4(),
                        shift_instance_id=target_inst.id,
                        worker_id=sb_asgn.worker_id,
                        assignment_source="MANUAL",
                        locked=sb_asgn.locked,
                        notes=f"Promoted from Sandbox '{sandbox.name}' (v{sandbox.version})"
                    )
                    db.add(new_asgn)
                    promoted_count += 1

        sandbox.status = "PROMOTED"
        parent_sched.status = ScheduleStatus.PUBLISHED
        parent_sched.generated_at = datetime.now(timezone.utc)
        parent_sched.generated_by = author_id

        db.commit()
        db.refresh(parent_sched)

        # Audit Log
        AuditService.log_action(
            db=db,
            action="PROMOTE_SANDBOX",
            entity_type="Schedule",
            entity_id=str(parent_sched.id),
            user_id=str(author_id) if author_id else None,
            new_value={"sandbox_id": str(sandbox.id), "promoted_assignments_count": promoted_count}
        )

        return parent_sched

    @staticmethod
    def list_sandboxes(db: Session) -> List[Dict[str, Any]]:
        sandboxes = db.query(SandboxSchedule).order_by(SandboxSchedule.created_at.desc()).all()
        results = []
        users = {str(u.id): f"{u.first_name} {u.last_name}" for u in db.query(User).all()}

        for s in sandboxes:
            tot_instances = len(s.shift_instances)
            tot_req = sum(i.required_workers for i in s.shift_instances)
            tot_asgns = sum(len(i.assignments) for i in s.shift_instances)
            cov_pct = round((tot_asgns / tot_req * 100), 2) if tot_req > 0 else 0.0

            results.append({
                "id": str(s.id),
                "parent_schedule_id": str(s.parent_schedule_id) if s.parent_schedule_id else None,
                "name": s.name,
                "description": s.description,
                "status": s.status,
                "version": s.version,
                "author_id": str(s.author_id) if s.author_id else None,
                "author_name": users.get(str(s.author_id), "System"),
                "year": s.year,
                "month": s.month,
                "scenario_type": s.scenario_type,
                "scenario_params": s.scenario_params,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                "total_instances": tot_instances,
                "total_assignments": tot_asgns,
                "coverage_percentage": cov_pct
            })

        return results

    @staticmethod
    def get_version_history(db: Session, sandbox_id: uuid.UUID) -> List[SandboxVersionOut]:
        versions = db.query(SandboxVersion).filter(SandboxVersion.sandbox_id == sandbox_id).order_by(SandboxVersion.version_number.desc()).all()
        users = {str(u.id): f"{u.first_name} {u.last_name}" for u in db.query(User).all()}

        return [
            SandboxVersionOut(
                id=str(v.id),
                sandbox_id=str(v.sandbox_id),
                version_number=v.version_number,
                change_description=v.change_description,
                author_name=users.get(str(v.author_id), "System"),
                created_at=v.created_at.isoformat() if v.created_at else ""
            )
            for v in versions
        ]
