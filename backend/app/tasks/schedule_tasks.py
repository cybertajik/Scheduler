import logging
from datetime import datetime, timezone
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import (
    Schedule, ScheduleStatus, Assignment, AssignmentSource,
    Worker, ShiftType, ShiftInstance, WorkerConstraint
)

logger = logging.getLogger(__name__)

@celery_app.task(name="generate_schedule_task", bind=True, max_retries=2)
def generate_schedule_task(self, schedule_id: str):
    """
    Celery background task: loads context from DB, runs OR-Tools solver,
    persists assignments back to PostgreSQL.
    """
    logger.info(f"[Celery] Starting schedule generation for schedule_id={schedule_id}")
    db = SessionLocal()
    try:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            logger.error(f"Schedule {schedule_id} not found")
            return {"status": "FAILED", "reason": "Schedule not found"}

        # Mark as generating
        schedule.status = ScheduleStatus.GENERATED
        db.commit()

        # Load workers
        workers = db.query(Worker).filter(Worker.active == True).all()
        workers_data = [{"id": str(w.id), "name": f"{w.first_name} {w.last_name}"} for w in workers]

        # Load shift types
        shift_types = db.query(ShiftType).all()
        shift_types_data = [{
            "id": str(s.id),
            "name": s.name,
            "is_night_shift": s.is_night_shift
        } for s in shift_types]

        # Load demands for this schedule
        demands = db.query(ShiftInstance).filter(ShiftInstance.schedule_id == schedule_id).all()
        demands_data = [{
            "date": d.date,
            "shift_type_id": str(d.shift_type_id),
            "required_count": d.required_workers
        } for d in demands]

        if not demands_data:
            schedule.status = ScheduleStatus.DRAFT
            db.commit()
            return {"status": "FAILED", "reason": "No shift demands found in schedule"}

        start_date = min(d["date"] for d in demands_data)
        end_date = max(d["date"] for d in demands_data)

        # Load constraints in range
        constraints = db.query(WorkerConstraint).filter(
            WorkerConstraint.enabled == True,
            WorkerConstraint.end_date >= start_date,
            WorkerConstraint.start_date <= end_date
        ).all()
        constraints_data = [{
            "worker_id": str(c.worker_id),
            "constraint_type": c.constraint_type.value,
            "start_date": c.start_date,
            "end_date": c.end_date
        } for c in constraints]

        # Run OR-Tools Solver
        from app.services.solver_service import ORToolsSchedulerSolver
        solver = ORToolsSchedulerSolver(time_limit_seconds=30)
        success, solution_assignments, msg = solver.solve(
            workers=workers_data,
            shift_types=shift_types_data,
            demands=demands_data,
            constraints=constraints_data,
            start_date=start_date,
            end_date=end_date
        )

        if success:
            # Build lookup: (date_str, shift_type_id) -> ShiftInstance
            instance_map = {}
            for inst in demands:
                key = (str(inst.date), str(inst.shift_type_id))
                instance_map[key] = inst

            # Persist assignments to PostgreSQL
            persisted_count = 0
            for sa in solution_assignments:
                inst_key = (sa["date"], sa["shift_type_id"])
                shift_instance = instance_map.get(inst_key)
                if shift_instance:
                    # Check no duplicate
                    existing = db.query(Assignment).filter(
                        Assignment.shift_instance_id == shift_instance.id,
                        Assignment.worker_id == sa["worker_id"]
                    ).first()
                    if not existing:
                        assignment = Assignment(
                            shift_instance_id=shift_instance.id,
                            worker_id=sa["worker_id"],
                            assignment_source=AssignmentSource.SOLVER,
                            locked=False
                        )
                        db.add(assignment)
                        persisted_count += 1

            schedule.status = ScheduleStatus.GENERATED
            schedule.solver_score = msg
            schedule.generated_at = datetime.now(timezone.utc)
            db.commit()

            logger.info(f"[Celery] Schedule {schedule_id} GENERATED: {persisted_count} assignments persisted")
            return {"status": "SUCCESS", "message": msg, "assignments_count": persisted_count}
        else:
            schedule.status = ScheduleStatus.DRAFT
            db.commit()
            logger.warning(f"[Celery] Schedule {schedule_id} infeasible: {msg}")
            return {"status": "INFEASIBLE", "message": msg}

    except Exception as e:
        logger.exception(f"[Celery] Error solving schedule {schedule_id}: {str(e)}")
        try:
            schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
            if schedule:
                schedule.status = ScheduleStatus.DRAFT
                db.commit()
        except Exception:
            pass
        return {"status": "ERROR", "reason": str(e)}
    finally:
        db.close()


@celery_app.task(name="recalculate_coverage_task")
def recalculate_coverage_task(schedule_id: str):
    """Placeholder: recalculates coverage metrics for a schedule."""
    logger.info(f"[Celery] Recalculating coverage for schedule_id={schedule_id}")
    return {"status": "OK", "schedule_id": schedule_id}


@celery_app.task(name="export_schedule_task")
def export_schedule_task(schedule_id: str, format: str = "csv"):
    """Placeholder: exports schedule to CSV/PDF."""
    logger.info(f"[Celery] Exporting schedule {schedule_id} as {format}")
    return {"status": "OK", "schedule_id": schedule_id, "format": format}


@celery_app.task(name="send_notification_task")
def send_notification_task(schedule_id: str, message: str = ""):
    """Placeholder: sends notification about schedule changes."""
    logger.info(f"[Celery] Sending notification for schedule {schedule_id}: {message}")
    return {"status": "OK", "schedule_id": schedule_id}
