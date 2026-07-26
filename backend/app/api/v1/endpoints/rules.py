import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.rule import ConstraintUpdate, ConstraintResponse
from app.models import WorkerConstraint, User
from app.api.v1.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ConstraintResponse])
def list_constraints(
    worker_id: Optional[uuid.UUID] = None,
    enabled: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkerConstraint)
    if worker_id:
        query = query.filter(WorkerConstraint.worker_id == worker_id)
    if enabled is not None:
        query = query.filter(WorkerConstraint.enabled == enabled)
    return query.order_by(WorkerConstraint.start_date).all()

@router.get("/{rule_id}", response_model=ConstraintResponse)
def get_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(WorkerConstraint).filter(WorkerConstraint.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.patch("/{rule_id}", response_model=ConstraintResponse)
def update_rule(
    rule_id: uuid.UUID,
    update_in: ConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(WorkerConstraint).filter(WorkerConstraint.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = update_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(rule, key, val)

    # Validate dates after update
    if rule.start_date > rule.end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date")

    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}")
def delete_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(WorkerConstraint).filter(WorkerConstraint.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted successfully"}
