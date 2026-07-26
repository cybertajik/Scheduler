import uuid
from pydantic import BaseModel, ConfigDict
from datetime import time, date
from typing import Optional

class ShiftTypeCreate(BaseModel):
    name: str
    color: str = "#3B82F6"
    start_time: time
    end_time: time
    duration: float
    is_night_shift: bool = False
    requires_rest_day: bool = False

class ShiftTypeUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration: Optional[float] = None
    is_night_shift: Optional[bool] = None
    requires_rest_day: Optional[bool] = None

class ShiftTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str
    start_time: time
    end_time: time
    duration: float
    is_night_shift: bool
    requires_rest_day: bool

class ShiftInstanceCreate(BaseModel):
    schedule_id: Optional[uuid.UUID] = None
    date: date
    shift_type_id: uuid.UUID
    required_workers: int = 1

ShiftDemandCreate = ShiftInstanceCreate

class ShiftInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    schedule_id: uuid.UUID
    date: date
    shift_type_id: uuid.UUID
    required_workers: int
    shift_type: ShiftTypeResponse
