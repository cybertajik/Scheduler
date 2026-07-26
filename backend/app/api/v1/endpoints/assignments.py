import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schedule import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.services.assignment_service import AssignmentService
from app.api.v1.deps import get_current_user, require_admin
from app.models import User

router = APIRouter()

@router.patch("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: uuid.UUID,
    update_in: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    return AssignmentService.update_assignment(
        db=db,
        assignment_id=assignment_id,
        worker_id=update_in.worker_id,
        locked=update_in.locked,
        notes=update_in.notes
    )

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    AssignmentService.delete_assignment(db, assignment_id)
    return {"message": "Assignment deleted successfully"}
