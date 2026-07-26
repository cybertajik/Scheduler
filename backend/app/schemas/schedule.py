import uuid
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Optional, Any, Dict
from app.models.enums import ScheduleStatus, AssignmentSource
from app.schemas.shift import ShiftTypeResponse, ShiftInstanceCreate, ShiftInstanceResponse
from app.schemas.worker import WorkerResponse

class ScheduleCreate(BaseModel):
    month: int
    year: int
    shift_instances: List[ShiftInstanceCreate] = []

class ScheduleUpdate(BaseModel):
    status: Optional[ScheduleStatus] = None

class AssignmentCreate(BaseModel):
    shift_instance_id: uuid.UUID
    worker_id: uuid.UUID
    notes: Optional[str] = None
    locked: bool = False

class AssignmentUpdate(BaseModel):
    worker_id: Optional[uuid.UUID] = None
    locked: Optional[bool] = None
    notes: Optional[str] = None

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    shift_instance_id: uuid.UUID
    worker_id: uuid.UUID
    assigned_by: Optional[uuid.UUID] = None
    assignment_source: AssignmentSource
    locked: bool
    notes: Optional[str] = None

class AssignmentDetailResponse(AssignmentResponse):
    worker: WorkerResponse

class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    month: int
    year: int
    status: ScheduleStatus
    generated_at: Optional[datetime] = None
    generated_by: Optional[uuid.UUID] = None
    solver_score: Optional[str] = None

class ShiftInstanceDetailResponse(ShiftInstanceResponse):
    assignments: List[AssignmentDetailResponse] = []

class ScheduleDetailResponse(ScheduleResponse):
    shift_instances: List[ShiftInstanceDetailResponse] = []

class SolverStatusResponse(BaseModel):
    schedule_id: str
    status: str
    generated_at: Optional[str] = None
    solver_score: Optional[str] = None

class CoverageResponse(BaseModel):
    schedule_id: str
    total_shift_instances: int
    total_required_workers: int
    total_assigned_workers: int
    coverage_percentage: float

class ConflictResponse(BaseModel):
    schedule_id: Optional[str] = None
    is_feasible: bool = True
    hard_conflicts_count: int = 0
    soft_violations_count: int = 0
    total_penalty_score: int = 0
    conflicts: List[Dict[str, Any]] = []
    summary_message: str = "No conflicts detected"

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
