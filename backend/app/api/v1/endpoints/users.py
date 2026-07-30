import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import AuthService
from app.api.v1.deps import manager_or_admin, get_current_user
from app.models import User

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    return AuthService.get_all_users(db, current_user=current_user)

@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    return AuthService.create_user(db, user_in, creator=current_user)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    return AuthService.get_user_by_id(db, user_id)

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    return AuthService.update_user(db, user_id, update_in, admin=current_user)

@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    AuthService.deactivate_user(db, user_id, admin=current_user)
    return {"message": "User account deactivated successfully"}

@router.post("/{user_id}/activate")
def activate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    AuthService.activate_user(db, user_id, admin=current_user)
    return {"message": "User account activated successfully"}

@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    AuthService.delete_user(db, user_id, admin=current_user)
    return {"message": "User account permanently deleted successfully"}

