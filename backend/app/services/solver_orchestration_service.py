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
