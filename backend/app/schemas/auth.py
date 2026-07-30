import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from app.models.enums import UserRole

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_role: UserRole
    full_name: str
    user_id: uuid.UUID
    preferred_language: str = "en"
    theme_preference: str = "dark"
    organization_id: Optional[uuid.UUID] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[UserRole] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.EMPLOYEE
    organization_id: Optional[uuid.UUID] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None
    must_change_password: Optional[bool] = None

class UserPreferencesUpdate(BaseModel):
    preferred_language: Optional[str] = None
    theme_preference: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    active: bool
    last_login_at: Optional[datetime] = None
    must_change_password: bool = False
    preferred_language: str = "en"
    theme_preference: str = "dark"
    organization_id: Optional[uuid.UUID] = None
