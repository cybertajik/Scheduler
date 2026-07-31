from datetime import date, datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class MyScheduleShiftOut(BaseModel):
    assignment_id: str
    shift_instance_id: str
    date: str
    shift_type_id: str
    shift_name: str
    color: str = "#3B82F6"
    start_time: str = "08:00"
    end_time: str = "16:00"
    duration: float = 8.0
    is_night_shift: bool = False
    locked: bool = False
    notes: Optional[str] = None

class EmployeeDashboardOut(BaseModel):
    worker_id: str
    worker_name: str
    employee_number: str
    department_name: str
    weekly_contract_hours: float
    worked_hours_this_month: float = 0.0
    overtime_hours_this_month: float = 0.0
    night_shifts_this_month: int = 0
    weekend_shifts_this_month: int = 0
    remaining_vacation_days: int = 20
    upcoming_shifts: List[MyScheduleShiftOut] = Field(default_factory=list)
    recent_notifications: List[Dict[str, Any]] = Field(default_factory=list)

class VacationRequestCreate(BaseModel):
    start_date: str
    end_date: str
    reason: Optional[str] = None

class VacationRequestOut(BaseModel):
    id: str
    worker_id: str
    worker_name: str
    start_date: str
    end_date: str
    total_days: int
    reason: Optional[str] = None
    status: str  # PENDING, APPROVED, REJECTED, CANCELLED
    admin_notes: Optional[str] = None
    created_at: str

class ShiftSwapCreate(BaseModel):
    target_worker_id: str
    requestor_assignment_id: str
    target_assignment_id: Optional[str] = None
    notes: Optional[str] = None

class ShiftSwapOut(BaseModel):
    id: str
    requestor_worker_id: str
    requestor_worker_name: str
    target_worker_id: str
    target_worker_name: str
    requestor_assignment_id: str
    requestor_shift_date: str
    requestor_shift_name: str
    target_assignment_id: Optional[str] = None
    target_shift_date: Optional[str] = None
    target_shift_name: Optional[str] = None
    status: str  # PROPOSED, ACCEPTED, DECLINED, APPROVED, REJECTED, CANCELLED
    notes: Optional[str] = None
    created_at: str

class AvailabilitySubmissionCreate(BaseModel):
    date: str
    availability_type: str  # UNAVAILABLE, PREFERRED_OFF, PREFERRED_SHIFT
    shift_type_id: Optional[str] = None
    notes: Optional[str] = None

class AvailabilitySubmissionOut(BaseModel):
    id: str
    worker_id: str
    date: str
    availability_type: str
    shift_name: Optional[str] = None
    notes: Optional[str] = None

class EmployeeProfileUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    new_password: Optional[str] = None

class EmployeeProfileOut(BaseModel):
    user_id: str
    worker_id: str
    first_name: str
    last_name: str
    employee_number: str
    email: str
    phone: Optional[str] = None
    department_name: str
    hire_date: Optional[str] = None
    weekly_contract_hours: float

class UserNotificationOut(BaseModel):
    id: str
    title: str
    message: str
    category: str
    is_read: bool
    created_at: str
