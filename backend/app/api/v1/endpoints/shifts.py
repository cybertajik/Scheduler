import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.shift import ShiftTypeCreate, ShiftTypeUpdate, ShiftTypeResponse
from app.services.shift_type_service import ShiftTypeService
from app.api.v1.deps import get_current_user, require_admin
from app.models import User

router = APIRouter()

@router.get("", response_model=List[ShiftTypeResponse])
def get_shift_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ShiftTypeService.get_all_shift_types(db)

@router.post("", response_model=ShiftTypeResponse, status_code=201)
def create_shift_type(
    shift_in: ShiftTypeCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    return ShiftTypeService.create_shift_type(db, shift_in)

@router.get("/{shift_type_id}", response_model=ShiftTypeResponse)
def get_shift_type(
    shift_type_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ShiftTypeService.get_shift_type_by_id(db, shift_type_id)

@router.patch("/{shift_type_id}", response_model=ShiftTypeResponse)
def update_shift_type(
    shift_type_id: uuid.UUID,
    update_in: ShiftTypeUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    update_data = update_in.model_dump(exclude_unset=True)
    return ShiftTypeService.update_shift_type(db, shift_type_id, update_data)

@router.delete("/{shift_type_id}")
def delete_shift_type(
    shift_type_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    ShiftTypeService.delete_shift_type(db, shift_type_id)
    return {"message": "Shift type deleted successfully"}
