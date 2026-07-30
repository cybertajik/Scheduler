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

class OrganizationCreate(OrganizationBase):
    top_manager_email: Optional[str] = None
    top_manager_password: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    require_employee_id: Optional[bool] = None
    active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
