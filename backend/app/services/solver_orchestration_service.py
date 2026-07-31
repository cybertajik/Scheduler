import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Schedule, ScheduleStatus
from app.tasks.schedule_tasks import generate_schedule_task
from app.rules.services.schedule_rule_service import ScheduleRuleService
from app.rules.services.conflict_service import RuleConflictService
from app.solver.services.schedule_solver_service import ScheduleSolverService

class SolverOrchestrationService:
    """
    Handles scheduling job submissions, status tracking, and solver diagnostics.
    """

    @staticmethod
    def enqueue_solver_job(db: Session, schedule_id: uuid.UUID) -> Dict[str, Any]:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        # Mark schedule status as GENERATED / OPTIMIZING
        schedule.status = ScheduleStatus.GENERATED
        db.commit()

        # Enqueue background job to Celery worker
        task = generate_schedule_task.delay(str(schedule_id))

        return {
            "schedule_id": str(schedule_id),
            "task_id": task.id,
            "status": "QUEUED",
            "message": "Schedule generation task dispatched to Celery worker"
        }

    @staticmethod
    def get_job_status(db: Session, schedule_id: uuid.UUID) -> Dict[str, Any]:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        return {
            "schedule_id": str(schedule_id),
            "status": schedule.status.value,
            "generated_at": schedule.generated_at.isoformat() if schedule.generated_at else None,
            "solver_score": schedule.solver_score
        }

    @staticmethod
    def get_schedule_conflicts(db: Session, schedule_id: uuid.UUID) -> Dict[str, Any]:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        # Determine date range from shift instances
        if not schedule.shift_instances:
            return {"schedule_id": str(schedule_id), "is_feasible": True, "conflicts": []}

        start_date = min(i.date for i in schedule.shift_instances)
        end_date = max(i.date for i in schedule.shift_instances)

        context = ScheduleRuleService.build_context_from_db(db, start_date, end_date, str(schedule_id))
        conflict_service = RuleConflictService()
        report = conflict_service.detect_schedule_conflicts(context)

        return report.model_dump()

    @staticmethod
    def get_schedule_diagnostics(db: Session, schedule_id: uuid.UUID) -> Dict[str, Any]:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        from app.models import Worker, ShiftType, ShiftInstance, WorkerConstraint
        from app.rules.dtos import WorkerDTO, ShiftTypeDTO, ConstraintDTO
        from app.solver.dtos import SolverInputDTO, ShiftInstanceRequirementDTO
        from app.solver.services.schedule_solver_service import ScheduleSolverService
        from app.solver.diagnostics.decision_diagnostics_engine import DecisionDiagnosticsEngine

        # Build solver input
        workers = db.query(Worker).filter(Worker.active == True).all()
        worker_map = {
            str(w.id): WorkerDTO(
                id=str(w.id),
                first_name=w.first_name,
                last_name=w.last_name,
                name=f"{w.first_name} {w.last_name}",
                weekly_contract_hours=float(w.target_weekly_hours or 40.0)
            )
            for w in workers
        }

        shift_types = db.query(ShiftType).all()
        shift_type_map = {
            str(s.id): ShiftTypeDTO(
                id=str(s.id),
                name=s.name,
                code=s.name[:3].upper(),
                is_night_shift=s.is_night_shift
            )
            for s in shift_types
        }

        instances = schedule.shift_instances
        if not instances:
            start_d = __import__('datetime').date.today()
            end_d = start_d
            reqs = []
        else:
            start_d = min(i.date for i in instances)
            end_d = max(i.date for i in instances)
            reqs = [
                ShiftInstanceRequirementDTO(
                    id=str(i.id),
                    date=i.date,
                    shift_type_id=str(i.shift_type_id),
                    required_workers=i.required_workers
                )
                for i in instances
            ]

        constraints = db.query(WorkerConstraint).filter(
            WorkerConstraint.enabled == True,
            WorkerConstraint.end_date >= start_d,
            WorkerConstraint.start_date <= end_d
        ).all()

        constraint_dtos = [
            ConstraintDTO(
                id=str(c.id),
                worker_id=str(c.worker_id),
                rule_type=c.constraint_type.value,
                category="HARD",
                start_date=c.start_date,
                end_date=c.end_date,
                enabled=c.enabled
            )
            for c in constraints
        ]

        input_data = SolverInputDTO(
            schedule_id=str(schedule_id),
            start_date=start_d,
            end_date=end_d,
            workers=worker_map,
            shift_types=shift_type_map,
            shift_requirements=reqs,
            worker_constraints=constraint_dtos
        )

        solver_service = ScheduleSolverService()
        result = solver_service.solve(input_data)
        return result.comprehensive_diagnostics if result.comprehensive_diagnostics else DecisionDiagnosticsEngine.evaluate(input_data, result).model_dump()

    @staticmethod
    def export_schedule_diagnostics(db: Session, schedule_id: uuid.UUID) -> str:
        diag = SolverOrchestrationService.get_schedule_diagnostics(db, schedule_id)
        import json
        return json.dumps(diag, indent=2, default=str)
