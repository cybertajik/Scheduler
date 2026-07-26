import uuid
from datetime import date, time
from typing import List, Dict, Optional, Any, Set
from pydantic import BaseModel, Field
from app.rules.dtos import WorkerDTO, ShiftTypeDTO, ConstraintDTO, RuleViolation

class SolverConfigDTO(BaseModel):
    time_limit_seconds: int = 30
    num_search_workers: int = 4
    allow_partial_solutions: bool = True
    hard_violation_penalty: int = 10000
    unfilled_shift_penalty: int = 5000
    soft_penalty_weight: int = 10
    workload_fairness_weight: int = 50
    night_fairness_weight: int = 40
    weekend_fairness_weight: int = 30

class ShiftInstanceRequirementDTO(BaseModel):
    id: str
    date: date
    shift_type_id: str
    required_workers: int = 1

class LockedAssignmentDTO(BaseModel):
    shift_instance_id: str
    worker_id: str
    date: date
    shift_type_id: str

class SolverInputDTO(BaseModel):
    schedule_id: Optional[str] = None
    start_date: date
    end_date: date
    workers: Dict[str, WorkerDTO] = Field(default_factory=dict)
    shift_types: Dict[str, ShiftTypeDTO] = Field(default_factory=dict)
    shift_requirements: List[ShiftInstanceRequirementDTO] = Field(default_factory=list)
    worker_constraints: List[ConstraintDTO] = Field(default_factory=list)
    locked_assignments: List[LockedAssignmentDTO] = Field(default_factory=list)
    holidays: Set[date] = Field(default_factory=set)
    config: SolverConfigDTO = Field(default_factory=SolverConfigDTO)

class SolverAssignmentDTO(BaseModel):
    shift_instance_id: str
    worker_id: str
    worker_name: str
    date: date
    shift_type_id: str
    shift_name: str
    is_locked: bool = False

class UnfilledShiftDTO(BaseModel):
    shift_instance_id: str
    date: date
    shift_type_id: str
    shift_name: str
    shortage_count: int

class InfeasibilityDiagnosticDTO(BaseModel):
    is_infeasible: bool
    summary: str
    root_causes: List[str] = Field(default_factory=list)
    affected_workers: List[str] = Field(default_factory=list)
    affected_dates: List[date] = Field(default_factory=list)
    suggested_remediations: List[str] = Field(default_factory=list)

class SolverResultDTO(BaseModel):
    schedule_id: Optional[str] = None
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, UNKNOWN
    is_solved: bool
    is_partial: bool = False
    objective_score: float = 0.0
    solver_runtime_seconds: float = 0.0
    total_shifts_required: int = 0
    total_shifts_assigned: int = 0
    total_unfilled_shifts: int = 0
    hard_violations_count: int = 0
    soft_penalty_total: float = 0.0
    assignments: List[SolverAssignmentDTO] = Field(default_factory=list)
    unfilled_shifts: List[UnfilledShiftDTO] = Field(default_factory=list)
    diagnostics: Optional[InfeasibilityDiagnosticDTO] = None
    solver_metadata: Dict[str, Any] = Field(default_factory=dict)
