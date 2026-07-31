import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.auto_repair import (
    ConflictDiagnosticItem,
    RepairPlanOut,
    RepairApplyRequest,
    RepairApplyResponse,
    RepairHistoryItem
)
from app.services.repair_service import RepairService

router = APIRouter()

@router.post("/{schedule_id}/repair/analyze", response_model=List[ConflictDiagnosticItem])
def analyze_schedule_conflicts(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RepairService.analyze_schedule(db, schedule_id)

@router.post("/{schedule_id}/repair/plans", response_model=List[RepairPlanOut])
def generate_repair_plans(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RepairService.get_repair_plans(db, schedule_id)

@router.post("/{schedule_id}/repair/apply", response_model=RepairApplyResponse)
def apply_repair_plan(
    schedule_id: uuid.UUID,
    data: RepairApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plans = RepairService.get_repair_plans(db, schedule_id)
    target_plan = next((p for p in plans if p.id == data.plan_id), None)
    if not target_plan:
        if plans:
            target_plan = plans[0]
        else:
            raise HTTPException(status_code=404, detail="Requested repair plan not found.")

    return RepairService.apply_repair_plan(db, schedule_id, target_plan, author_id=current_user.id)

@router.post("/{schedule_id}/repair/undo", response_model=RepairApplyResponse)
def undo_last_repair(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RepairService.undo_last_repair(db, schedule_id, author_id=current_user.id)

@router.post("/{schedule_id}/repair/redo", response_model=RepairApplyResponse)
def redo_last_repair(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RepairService.redo_last_repair(db, schedule_id, author_id=current_user.id)

@router.get("/{schedule_id}/repair/history", response_model=List[RepairHistoryItem])
def get_repair_history(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RepairService.get_repair_history(db, schedule_id)
