from datetime import date, time
from typing import List, Dict, Optional, Any, Set
from pydantic import BaseModel, Field
from app.rules.enums import RuleCategory, RuleType, ConflictSeverity

class WorkerDTO(BaseModel):
    id: str
    employee_number: str
    first_name: str
    last_name: str
    department_id: str
    skill_ids: Set[str] = Field(default_factory=set)
    weekly_contract_hours: float = 40.0
    active: bool = True

class ShiftTypeDTO(BaseModel):
    id: str
    name: str
    color: str = "#3B82F6"
    start_time: time
    end_time: time
    duration: float
    is_night_shift: bool = False
    requires_rest_day: bool = False

class AssignmentDTO(BaseModel):
    id: Optional[str] = None
    shift_instance_id: Optional[str] = None
    worker_id: str
    date: date
    shift_type_id: str
    locked: bool = False

class ConstraintDTO(BaseModel):
    id: Optional[str] = None
    worker_id: str
    rule_type: RuleType
    category: RuleCategory = RuleCategory.HARD
    start_date: date
    end_date: date
    priority: int = 1
    enabled: bool = True
    metadata_json: Optional[Dict[str, Any]] = None

class SchedulingContext(BaseModel):
    start_date: date
    end_date: date
    workers: Dict[str, WorkerDTO] = Field(default_factory=dict)
    shift_types: Dict[str, ShiftTypeDTO] = Field(default_factory=dict)
    existing_assignments: List[AssignmentDTO] = Field(default_factory=list)
    worker_constraints: List[ConstraintDTO] = Field(default_factory=list)
    holidays: Set[date] = Field(default_factory=set)
    department_limits: Dict[str, int] = Field(default_factory=dict)

class RuleViolation(BaseModel):
    rule_type: RuleType
    category: RuleCategory
    severity: ConflictSeverity
    worker_id: Optional[str] = None
    worker_name: Optional[str] = None
    affected_date: Optional[date] = None
    affected_shift_type_id: Optional[str] = None
    code: str
    reason: str
    penalty_score: int = 0

class EvaluationResult(BaseModel):
    is_eligible: bool = True
    has_hard_violations: bool = False
    total_penalty_score: int = 0
    violations: List[RuleViolation] = Field(default_factory=list)

class ConflictReport(BaseModel):
    schedule_id: Optional[str] = None
    is_feasible: bool = True
    hard_conflicts_count: int = 0
    soft_violations_count: int = 0
    total_penalty_score: int = 0
    conflicts: List[RuleViolation] = Field(default_factory=list)
    summary_message: str = "No conflicts detected"

class RuleTemplateDTO(BaseModel):
    template_key: str
    name: str
    description: str
    rule_type: RuleType
    default_category: RuleCategory
    default_priority: int
    required_metadata_fields: List[str] = Field(default_factory=list)
