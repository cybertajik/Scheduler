import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import AuthService
from app.api.v1.deps import admin_only, get_current_user
from app.models import User

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only)
):
    return AuthService.get_all_users(db, current_user=current_admin)

@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only)
):
    return AuthService.create_user(db, user_in, creator=current_admin)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only)
):
    return AuthService.get_user_by_id(db, user_id)

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only)
):
    return AuthService.update_user(db, user_id, update_in, admin=current_admin)

@router.delete("/{user_id}")
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only)
):
    AuthService.deactivate_user(db, user_id, admin=current_admin)
    return {"message": "User account deactivated successfully"}
