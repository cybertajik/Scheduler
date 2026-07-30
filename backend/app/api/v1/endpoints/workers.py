import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse
from app.schemas.rule import ConstraintCreate, ConstraintResponse
from app.services.worker_service import WorkerService
from app.api.v1.deps import get_current_user, require_admin
from app.models import User, Worker, WorkerConstraint

router = APIRouter()

@router.get("", response_model=List[WorkerResponse])
def list_workers(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if active_only:
        return WorkerService.get_all_workers(db)
    return db.query(Worker).all()

@router.post("", response_model=WorkerResponse, status_code=201)
def create_worker(
    worker_in: WorkerCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    return WorkerService.create_worker(db, worker_in)

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(
    worker_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker

@router.patch("/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: uuid.UUID,
    update_in: WorkerUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    return WorkerService.update_worker(db, str(worker_id), update_in)

@router.delete("/{worker_id}")
def delete_worker(
    worker_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker.active = False
    db.commit()
    return {"message": "Worker deactivated successfully"}

# ── Worker Constraints Sub-routes ──

@router.get("/{worker_id}/rules", response_model=List[ConstraintResponse])
def get_worker_rules(
    worker_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify worker exists
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db.query(WorkerConstraint).filter(WorkerConstraint.worker_id == worker_id).all()

@router.post("/{worker_id}/rules", response_model=ConstraintResponse, status_code=201)
def create_worker_rule(
    worker_id: uuid.UUID,
    rule_in: ConstraintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if rule_in.start_date > rule_in.end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date")

    constraint = WorkerConstraint(
        worker_id=worker_id,
        constraint_type=rule_in.constraint_type,
        start_date=rule_in.start_date,
        end_date=rule_in.end_date,
        priority=rule_in.priority,
        enabled=rule_in.enabled,
        metadata_json=rule_in.metadata_json
    )
    db.add(constraint)
    db.commit()
    db.refresh(constraint)
    return constraint

@router.delete("/{worker_id}/rules/{rule_id}")
def delete_worker_rule(
    worker_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(WorkerConstraint).filter(
        WorkerConstraint.id == rule_id,
        WorkerConstraint.worker_id == worker_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Constraint rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Constraint rule deleted successfully"}
