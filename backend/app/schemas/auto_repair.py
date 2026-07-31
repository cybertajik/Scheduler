from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ConflictDiagnosticItem(BaseModel):
    id: str
    category: str  # VACATION, UNAVAILABLE, MAX_HOURS, REST_PERIOD, NIGHT_RECOVERY, WEEKEND, SKILL_MISMATCH, DOUBLE_BOOKING, OVERTIME
    severity: str  # HARD, SOFT
    worker_id: Optional[str] = None
    worker_name: Optional[str] = None
    date: str
    shift_type_id: Optional[str] = None
    shift_name: Optional[str] = None
    details: str

class RepairActionItem(BaseModel):
    action_type: str  # SWAP, REASSIGN, REPLACE, OVERTIME, RULE_RELAX, LOCAL_SOLVER
    date: str
    shift_instance_id: str
    shift_name: str
    original_worker_id: Optional[str] = None
    original_worker_name: Optional[str] = None
    target_worker_id: Optional[str] = None
    target_worker_name: Optional[str] = None
    notes: str

class ExplainabilityReport(BaseModel):
    conflict_detected: str
    root_cause: str
    repair_performed: str
    employees_affected: List[str] = Field(default_factory=list)
    reason_chosen: str
    alternatives_considered: List[str] = Field(default_factory=list)
    expected_impact: str

class RepairPlanOut(BaseModel):
    id: str
    plan_name: str
    rank: int
    tier: str  # TIER_1_SWAP, TIER_2_REASSIGN, TIER_3_REPLACE, TIER_4_OVERTIME, TIER_5_RELAX, TIER_6_LOCAL_SOLVE
    disruption_score: float
    conflicts_resolved_count: int
    assignments_changed_count: int
    fairness_score: float = 95.0
    overtime_delta_hours: float = 0.0
    coverage_improvement_pct: float = 0.0
    actions: List[RepairActionItem] = Field(default_factory=list)
    explainability: ExplainabilityReport

class RepairApplyRequest(BaseModel):
    plan_id: str

class RepairApplyResponse(BaseModel):
    message: str
    repair_id: str
    schedule_id: str
    applied_actions_count: int
    undo_available: bool = True

class RepairHistoryItem(BaseModel):
    id: str
    schedule_id: str
    plan_name: str
    author_name: Optional[str] = None
    disruption_score: float
    conflicts_resolved_count: int
    assignments_changed_count: int
    status: str
    applied_at: Optional[str] = None
