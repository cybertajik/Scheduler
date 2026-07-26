import uuid
from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional, Any, Dict
from app.models.enums import ConstraintType

class ConstraintCreate(BaseModel):
    constraint_type: ConstraintType
    start_date: date
    end_date: date
    priority: int = 1
    enabled: bool = True
    metadata_json: Optional[Dict[str, Any]] = None

class ConstraintUpdate(BaseModel):
    constraint_type: Optional[ConstraintType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: Optional[int] = None
    enabled: Optional[bool] = None
    metadata_json: Optional[Dict[str, Any]] = None

class ConstraintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    worker_id: uuid.UUID
    constraint_type: ConstraintType
    start_date: date
    end_date: date
    priority: int
    enabled: bool
    metadata_json: Optional[Dict[str, Any]] = None
