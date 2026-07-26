import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import date

class WorkerCreate(BaseModel):
    employee_number: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    hire_date: Optional[date] = None
    weekly_contract_hours: float = 40.0

class WorkerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[uuid.UUID] = None
    weekly_contract_hours: Optional[float] = None
    active: Optional[bool] = None
    notes: Optional[str] = None

class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_number: str
    department_id: uuid.UUID
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    hire_date: Optional[date] = None
    weekly_contract_hours: float
    active: bool
    notes: Optional[str] = None
