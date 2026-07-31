from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class StaffingWidgetOut(BaseModel):
    total_workers: int = 0
    active_workers: int = 0
    scheduled_workers_today: int = 0
    required_workers_today: int = 0
    open_shifts_today: int = 0
    unfilled_shifts_today: int = 0
    coverage_percentage_today: float = 0.0

class OperationalOverviewOut(BaseModel):
    staffing_status: StaffingWidgetOut
    current_coverage_percentage: float = 0.0
    total_schedules: int = 0
    published_schedules: int = 0
    draft_schedules: int = 0
    pending_approvals: int = 0
    pending_imports: int = 0
    pending_exports: int = 0
    active_users_count: int = 0
    recent_solver_runs: List[Dict[str, Any]] = Field(default_factory=list)
    recent_audit_events: List[Dict[str, Any]] = Field(default_factory=list)

class EmployeeAnalyticsItem(BaseModel):
    worker_id: str
    employee_number: str
    worker_name: str
    department_name: str
    assigned_shifts_count: int = 0
    total_worked_hours: float = 0.0
    night_shifts_count: int = 0
    weekend_shifts_count: int = 0
    vacation_days_count: int = 0
    overtime_hours: float = 0.0
    fairness_score: float = 100.0
    rule_conflicts_count: int = 0
    skill_utilization_pct: float = 100.0
    availability_status: str = "AVAILABLE"

class DepartmentAnalyticsItem(BaseModel):
    department_id: str
    department_name: str
    active_staff_count: int = 0
    coverage_percentage: float = 0.0
    total_assigned_shifts: int = 0
    open_positions_count: int = 0
    skill_shortages_count: int = 0
    total_overtime_hours: float = 0.0
    night_shift_balance_score: float = 100.0
    vacation_impact_score: float = 0.0

class TrendPoint(BaseModel):
    period_label: str
    coverage_pct: float = 0.0
    overtime_hours: float = 0.0
    night_shifts_count: int = 0
    weekend_shifts_count: int = 0
    solver_runtime_seconds: float = 0.0
    fairness_score: float = 100.0
    rule_violations_count: int = 0
    staff_utilization_pct: float = 0.0

class HistoricalTrendsOut(BaseModel):
    granularity: str  # WEEKLY, MONTHLY, YEARLY
    trends: List[TrendPoint] = Field(default_factory=list)

class ServiceHealthItem(BaseModel):
    name: str
    status: str  # HEALTHY, DEGRADED, DOWN, UNKNOWN
    response_time_ms: float = 0.0
    details: Optional[str] = None

class SystemHealthOut(BaseModel):
    overall_status: str  # HEALTHY, WARNING, CRITICAL
    database: ServiceHealthItem
    redis_cache: ServiceHealthItem
    celery_queue: ServiceHealthItem
    api_gateway: ServiceHealthItem
    cpu_usage_pct: float = 0.0
    memory_usage_pct: float = 0.0
    disk_usage_pct: float = 0.0
    container_status: str = "RUNNING"
    backup_status: str = "HEALTHY"
    last_successful_backup_at: Optional[str] = None
    queue_depth: int = 0

class OperationalAlertItem(BaseModel):
    id: str
    severity: str  # CRITICAL, WARNING, INFO
    category: str  # STAFFING, OVERTIME, SYSTEM, BACKUP, SOLVER
    title: str
    message: str
    timestamp: str
    suggested_action: Optional[str] = None
