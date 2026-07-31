from datetime import date, datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SandboxCreate(BaseModel):
    parent_schedule_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    year: Optional[int] = None
    month: Optional[int] = None
    scenario_type: Optional[str] = "CUSTOM"  # SICK_CALL, VACATION_REQUEST, STAFF_SHORTAGE, EXTRA_STAFF, RULE_MODIFICATION, CUSTOM
    scenario_params: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SandboxUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # DRAFT, SIMULATED, APPROVED, REJECTED, PROMOTED, ARCHIVED
    scenario_type: Optional[str] = None
    scenario_params: Optional[Dict[str, Any]] = None

class SandboxAssignmentOut(BaseModel):
    id: str
    sandbox_shift_instance_id: str
    worker_id: str
    worker_name: str
    date: str
    shift_type_id: str
    shift_name: str
    locked: bool = False
    assignment_source: str = "SOLVER"
    notes: Optional[str] = None

class SandboxOut(BaseModel):
    id: str
    parent_schedule_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: str
    version: int
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    year: int
    month: int
    scenario_type: Optional[str] = None
    scenario_params: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str
    total_instances: int = 0
    total_assignments: int = 0
    coverage_percentage: float = 0.0

class AssignmentDiffItem(BaseModel):
    change_type: str  # ADDED, REMOVED, CHANGED_WORKER, UNCHANGED
    date: str
    shift_type_id: str
    shift_name: str
    original_worker_id: Optional[str] = None
    original_worker_name: Optional[str] = None
    sandbox_worker_id: Optional[str] = None
    sandbox_worker_name: Optional[str] = None
    notes: Optional[str] = None

class MetricDiffSummary(BaseModel):
    original_coverage_pct: float
    sandbox_coverage_pct: float
    coverage_delta: float
    original_fairness_score: float
    sandbox_fairness_score: float
    fairness_delta: float
    original_overtime_hours: float
    sandbox_overtime_hours: float
    overtime_delta: float
    original_unfilled_shifts: int
    sandbox_unfilled_shifts: int
    unfilled_delta: int

class ScheduleComparisonOut(BaseModel):
    original_schedule_id: str
    sandbox_id: str
    total_changes_count: int
    added_assignments_count: int
    removed_assignments_count: int
    modified_assignments_count: int
    metrics_summary: MetricDiffSummary
    assignment_diffs: List[AssignmentDiffItem] = Field(default_factory=list)
    constraint_diffs: List[Dict[str, Any]] = Field(default_factory=list)

class SandboxSimulationRequest(BaseModel):
    scenario_type: str  # SICK_CALL, VACATION_REQUEST, STAFF_SHORTAGE, EXTRA_STAFF, RULE_MODIFICATION
    employee_id: Optional[str] = None
    dates: List[str] = Field(default_factory=list)
    rule_type: Optional[str] = None
    rule_params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    notes: Optional[str] = None

class SandboxVersionOut(BaseModel):
    id: str
    sandbox_id: str
    version_number: int
    change_description: str
    author_name: Optional[str] = None
    created_at: str
