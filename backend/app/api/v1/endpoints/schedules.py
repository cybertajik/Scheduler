import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleDetailResponse,
    AssignmentCreate, AssignmentResponse,
    SolverStatusResponse, CoverageResponse, ConflictResponse
)
from app.services.schedule_service import ScheduleService
from app.services.assignment_service import AssignmentService
from app.services.solver_orchestration_service import SolverOrchestrationService
from app.services.audit_service import AuditService
from app.api.v1.deps import get_current_user, require_admin
from app.models import User, Schedule

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Schedule CRUD ──

@router.get("", response_model=List[ScheduleResponse])
def get_schedules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ScheduleService.get_all_schedules(db)

@router.post("", response_model=ScheduleResponse, status_code=201)
def create_schedule(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    schedule = ScheduleService.create_schedule(db, schedule_in, current_admin.id)
    AuditService.log_action(
        db, action="CREATE", entity_type="Schedule", entity_id=str(schedule.id),
        user_id=current_admin.id, who=f"{current_admin.first_name} {current_admin.last_name}"
    )
    return schedule

@router.get("/{schedule_id}", response_model=ScheduleDetailResponse)
def get_schedule_details(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ScheduleService.get_schedule_by_id(db, schedule_id)

@router.patch("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: uuid.UUID,
    update_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    update_data = update_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(schedule, key, val)
    db.commit()
    db.refresh(schedule)
    AuditService.log_action(
        db, action="UPDATE", entity_type="Schedule", entity_id=str(schedule_id),
        user_id=current_admin.id, who=f"{current_admin.first_name} {current_admin.last_name}",
        new_value=update_data
    )
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    AuditService.log_action(
        db, action="DELETE", entity_type="Schedule", entity_id=str(schedule_id),
        user_id=current_admin.id, who=f"{current_admin.first_name} {current_admin.last_name}"
    )
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}

# ── Solver Orchestration ──

@router.post("/{schedule_id}/generate")
def trigger_schedule_generation(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    logger.info(f"User {current_admin.username} triggered generation for schedule {schedule_id}")
    result = SolverOrchestrationService.enqueue_solver_job(db, schedule_id)
    AuditService.log_action(
        db, action="GENERATE", entity_type="Schedule", entity_id=str(schedule_id),
        user_id=current_admin.id, who=f"{current_admin.first_name} {current_admin.last_name}"
    )
    return result

@router.get("/{schedule_id}/solver-status", response_model=SolverStatusResponse)
def get_solver_status(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SolverOrchestrationService.get_job_status(db, schedule_id)

@router.get("/{schedule_id}/solver-result")
def get_solver_result(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    return {
        "schedule_id": str(schedule_id),
        "status": schedule.status.value,
        "solver_score": schedule.solver_score,
        "generated_at": schedule.generated_at.isoformat() if schedule.generated_at else None
    }

# ── Assignment Management ──

@router.post("/{schedule_id}/assignments", response_model=AssignmentResponse, status_code=201)
def create_manual_assignment(
    schedule_id: uuid.UUID,
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    # Verify the shift instance belongs to this schedule
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    instance_ids = {str(si.id) for si in schedule.shift_instances}
    if str(assignment_in.shift_instance_id) not in instance_ids:
        raise HTTPException(status_code=400, detail="Shift instance does not belong to this schedule")

    assignment = AssignmentService.create_assignment(
        db=db,
        shift_instance_id=assignment_in.shift_instance_id,
        worker_id=assignment_in.worker_id,
        assigned_by=current_admin.id,
        notes=assignment_in.notes,
        locked=assignment_in.locked
    )
    AuditService.log_action(
        db, action="ASSIGN", entity_type="Assignment", entity_id=str(assignment.id),
        user_id=current_admin.id, who=f"{current_admin.first_name} {current_admin.last_name}",
        new_value={"worker_id": str(assignment_in.worker_id), "shift_instance_id": str(assignment_in.shift_instance_id)}
    )
    return assignment

# ── Diagnostics ──

@router.get("/{schedule_id}/conflicts", response_model=ConflictResponse)
def get_schedule_conflicts(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SolverOrchestrationService.get_schedule_conflicts(db, schedule_id)

@router.get("/{schedule_id}/coverage", response_model=CoverageResponse)
def get_schedule_coverage(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    total_instances = len(schedule.shift_instances)
    total_required = sum(i.required_workers for i in schedule.shift_instances)
    total_assigned = sum(len(i.assignments) for i in schedule.shift_instances)

    return CoverageResponse(
        schedule_id=str(schedule_id),
        total_shift_instances=total_instances,
        total_required_workers=total_required,
        total_assigned_workers=total_assigned,
        coverage_percentage=round((total_assigned / total_required * 100), 2) if total_required > 0 else 100.0
    )

@router.get("/{schedule_id}/audit-log")
def get_schedule_audit_logs(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AuditService.get_logs_by_entity(db, entity_type="Schedule", entity_id=str(schedule_id))
