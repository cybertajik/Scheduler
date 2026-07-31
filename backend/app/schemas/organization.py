import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=150)
    slug: str = Field(..., max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    require_employee_id: bool = True
    active: bool = True
    country_code: Optional[str] = Field(None, max_length=5)
    extra_country_code: Optional[str] = Field(None, max_length=5)
    billing_cycle: str = "MONTHLY"
    subscription_status: str = "ACTIVE"
    grace_period_until: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_tel: Optional[str] = None
    address: Optional[str] = None
    admin_notes: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    top_manager_email: Optional[str] = None
    top_manager_password: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    require_employee_id: Optional[bool] = None
    active: Optional[bool] = None
    country_code: Optional[str] = Field(None, max_length=5)
    extra_country_code: Optional[str] = Field(None, max_length=5)
    billing_cycle: Optional[str] = None
    subscription_status: Optional[str] = None
    grace_period_until: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_tel: Optional[str] = None
    address: Optional[str] = None
    admin_notes: Optional[str] = None

class OrganizationExtendGrace(BaseModel):
    days: int = Field(14, ge=1, le=365)

class OrganizationResponse(OrganizationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
