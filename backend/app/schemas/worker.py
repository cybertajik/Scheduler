import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import date
from app.models.enums import ContractType

class WorkerCreate(BaseModel):
    employee_number: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    hire_date: Optional[date] = None
    weekly_contract_hours: float = 40.0
    contract_type: ContractType = ContractType.HOURLY
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None
    organization_id: Optional[uuid.UUID] = None

class WorkerUpdate(BaseModel):
    employee_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[uuid.UUID] = None
    weekly_contract_hours: Optional[float] = None
    contract_type: Optional[ContractType] = None
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None
    active: Optional[bool] = None
    notes: Optional[str] = None

class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_number: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    hire_date: Optional[date] = None
    weekly_contract_hours: float = 40.0
    contract_type: ContractType = ContractType.HOURLY
    hourly_rate: Optional[float] = None
    monthly_salary: Optional[float] = None
    active: bool = True
    notes: Optional[str] = None
    organization_id: Optional[uuid.UUID] = None
