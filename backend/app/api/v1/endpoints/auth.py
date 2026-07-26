from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import (
    Token, UserResponse, UserLogin, RefreshTokenRequest, PasswordChangeRequest
)
from app.services.auth_service import AuthService
from app.api.v1.deps import get_current_user
from app.core.security import create_access_token, create_refresh_token, oauth2_scheme
from app.models.user import User

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user = AuthService.authenticate_user(
        db, credentials=UserLogin(email=form_data.username, password=form_data.password),
        ip_address=ip_address
    )
    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_role=user.role,
        full_name=user.full_name,
        user_id=user.id
    )

@router.post("/refresh")
def refresh_token(body: RefreshTokenRequest):
    return AuthService.refresh_access_token(body.refresh_token)

@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuthService.logout(token, current_user, db)
    return {"message": "Successfully logged out and token revoked."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuthService.change_password(db, current_user, pwd_in)
    return {"message": "Password changed successfully."}
