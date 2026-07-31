import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class OnboardingCreate(BaseModel):
    org_name: str = Field(..., max_length=150)
    contact_name: str = Field(..., max_length=100)
    contact_email: EmailStr
    contact_tel: str = Field(..., max_length=50)
    address: Optional[str] = None
    requested_domain: Optional[str] = Field(None, max_length=255)
    estimated_employees: int = Field(10, ge=1, le=10000)

class OnboardingReject(BaseModel):
    reason: Optional[str] = None

class OnboardingResponse(BaseModel):
    id: uuid.UUID
    org_name: str
    contact_name: str
    contact_email: str
    contact_tel: str
    address: Optional[str] = None
    requested_domain: Optional[str] = None
    estimated_employees: int
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
