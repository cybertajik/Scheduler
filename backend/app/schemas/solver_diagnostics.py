from datetime import date, datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SolverStatisticsDTO(BaseModel):
    variables_created: int = 0
    constraints_created: int = 0
    solver_runtime_seconds: float = 0.0
    memory_estimate_mb: float = 0.0
    objective_score: float = 0.0
    branches_explored: int = 0
    conflicts_detected: int = 0
    solver_status: str = "UNKNOWN"  # OPTIMAL, FEASIBLE, INFEASIBLE, MODEL_INVALID, UNKNOWN

class WorkloadDistributionDTO(BaseModel):
    employee_id: str
    employee_name: str
    count: int
    target: Optional[float] = None
    deviation: Optional[float] = None

class SoftConstraintViolationDTO(BaseModel):
    rule_id: str
    rule_name: str
    rule_category: str
    penalty_score: float
    employees_affected: List[str] = Field(default_factory=list)
    dates_affected: List[str] = Field(default_factory=list)
    description: str

class OvertimeSummaryDTO(BaseModel):
    total_overtime_hours: float = 0.0
    employees_with_overtime_count: int = 0
    max_overtime_hours_employee: float = 0.0
    affected_employee_names: List[str] = Field(default_factory=list)

class SkillCoverageDTO(BaseModel):
    skill_tag: str
    required_shifts: int
    assigned_shifts: int
    unmet_shifts: int
    coverage_percentage: float

class SuccessfulDiagnosticsDTO(BaseModel):
    coverage_percentage: float = 100.0
    fairness_score: float = 100.0  # 0 to 100 (100 = perfectly fair)
    total_assigned_shifts: int = 0
    unassigned_shifts: int = 0
    soft_constraint_violations: List[SoftConstraintViolationDTO] = Field(default_factory=list)
    overtime_summary: OvertimeSummaryDTO = Field(default_factory=OvertimeSummaryDTO)
    weekend_distribution: List[WorkloadDistributionDTO] = Field(default_factory=list)
    night_shift_distribution: List[WorkloadDistributionDTO] = Field(default_factory=list)
    skill_coverage_summary: List[SkillCoverageDTO] = Field(default_factory=list)

class SeverityReasonDTO(BaseModel):
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    category: str  # VACATION_CONFLICT, TOO_MANY_UNAVAILABLE, UNAVAILABLE_SKILL, MAX_HOURS_EXCEEDED, MANDATORY_REST_CONFLICT, NIGHT_RECOVERY_CONFLICT, WEEKEND_RESTRICTION_CONFLICT, INSUFFICIENT_QUALIFIED_WORKERS, MUTUALLY_CONFLICTING_RULES
    reason: str
    affected_employees: List[str] = Field(default_factory=list)
    affected_dates: List[str] = Field(default_factory=list)
    suggested_action: str

class FailedDiagnosticsDTO(BaseModel):
    is_infeasible: bool = True
    summary: str
    ranked_reasons: List[SeverityReasonDTO] = Field(default_factory=list)
    affected_employees: List[str] = Field(default_factory=list)
    affected_dates: List[str] = Field(default_factory=list)
    suggested_remediations: List[str] = Field(default_factory=list)

class ConstraintDiagnosticDTO(BaseModel):
    constraint_name: str
    constraint_type: str  # HARD, SOFT
    category: str
    employees_affected: List[str] = Field(default_factory=list)
    dates_affected: List[str] = Field(default_factory=list)
    number_of_conflicts: int = 0
    suggested_corrective_actions: List[str] = Field(default_factory=list)

class SuggestedFixDTO(BaseModel):
    id: str
    title: str
    description: str
    action_type: str  # ADD_WORKER, REMOVE_WEEKEND_RESTRICTION, RELAX_MIN_STAFFING, ALLOW_OVERTIME, CHANGE_VACATION_DATES, INCREASE_WEEKLY_HOURS
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    date: Optional[str] = None
    impact_score: float = 1.0  # Higher = higher priority fix

class ComprehensiveDiagnosticsDTO(BaseModel):
    schedule_id: str
    status: str  # SUCCESS, FEASIBLE, INFEASIBLE, FAILED
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    solver_statistics: SolverStatisticsDTO = Field(default_factory=SolverStatisticsDTO)
    successful_diagnostics: Optional[SuccessfulDiagnosticsDTO] = None
    failed_diagnostics: Optional[FailedDiagnosticsDTO] = None
    constraint_diagnostics: List[ConstraintDiagnosticDTO] = Field(default_factory=list)
    suggested_fixes: List[SuggestedFixDTO] = Field(default_factory=list)
