import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.sandbox import (
    SandboxCreate,
    SandboxUpdate,
    SandboxOut,
    SandboxSimulationRequest,
    ScheduleComparisonOut,
    SandboxVersionOut
)
from app.services.sandbox_service import SandboxService
from app.services.scenario_simulation_engine import ScenarioSimulationEngine
from app.services.schedule_comparison_engine import ScheduleComparisonEngine

router = APIRouter()

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_sandbox(
    data: SandboxCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sandbox = SandboxService.create_sandbox(db, data, author_id=current_user.id)
    return {"id": str(sandbox.id), "name": sandbox.name, "status": sandbox.status, "version": sandbox.version}

@router.get("", response_model=List[Dict[str, Any]])
def list_sandboxes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SandboxService.list_sandboxes(db)

@router.get("/{sandbox_id}")
def get_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sandboxes = SandboxService.list_sandboxes(db)
    sb = next((s for s in sandboxes if s["id"] == str(sandbox_id)), None)
    if not sb:
        raise HTTPException(status_code=404, detail="Sandbox not found")
    return sb

@router.patch("/{sandbox_id}")
def update_sandbox(
    sandbox_id: uuid.UUID,
    data: SandboxUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sb = SandboxService.update_sandbox(db, sandbox_id, data)
    return {"id": str(sb.id), "name": sb.name, "status": sb.status, "version": sb.version}

@router.delete("/{sandbox_id}")
def delete_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    SandboxService.delete_sandbox(db, sandbox_id)
    return {"message": "Sandbox deleted successfully"}

@router.post("/{sandbox_id}/clone")
def clone_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cloned = SandboxService.duplicate_sandbox(db, sandbox_id, author_id=current_user.id)
    return {"id": str(cloned.id), "name": cloned.name, "status": cloned.status, "version": cloned.version}

@router.post("/{sandbox_id}/archive")
def archive_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sb = SandboxService.archive_sandbox(db, sandbox_id)
    return {"id": str(sb.id), "status": sb.status}

@router.post("/{sandbox_id}/restore")
def restore_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sb = SandboxService.restore_sandbox(db, sandbox_id)
    return {"id": str(sb.id), "status": sb.status}

@router.post("/{sandbox_id}/simulate")
def run_simulation(
    sandbox_id: uuid.UUID,
    req: SandboxSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ScenarioSimulationEngine.run_simulation(db, sandbox_id, req, author_id=current_user.id)

@router.get("/{sandbox_id}/compare/{target_id}", response_model=ScheduleComparisonOut)
def compare_schedules(
    sandbox_id: uuid.UUID,
    target_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ScheduleComparisonEngine.compare(db, original_schedule_id=target_id, sandbox_id=sandbox_id)

@router.post("/{sandbox_id}/promote")
def promote_sandbox(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    promoted = SandboxService.promote_sandbox(db, sandbox_id, author_id=current_user.id)
    return {
        "message": "Sandbox successfully promoted to published schedule.",
        "parent_schedule_id": str(promoted.id),
        "status": promoted.status.value
    }

@router.get("/{sandbox_id}/versions", response_model=List[SandboxVersionOut])
def get_version_history(
    sandbox_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SandboxService.get_version_history(db, sandbox_id)
