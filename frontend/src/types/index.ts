export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ADMIN' | 'SCHEDULER' | 'MANAGER' | 'EMPLOYEE';

export type ScheduleStatus = 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'ARCHIVED';

export type ConstraintType =
  | 'VACATION'
  | 'UNAVAILABLE_DATE'
  | 'UNAVAILABLE_RANGE'
  | 'NO_WEEKENDS'
  | 'NO_NIGHTS'
  | 'NO_SHIFT_TYPE'
  | 'MAX_CONSECUTIVE_DAYS'
  | 'MIN_REST_HOURS'
  | 'PREFERRED_DAYS_OFF';

export type AssignmentSource = 'SOLVER' | 'MANUAL';

export type ContractType = 'HOURLY' | 'SALARY';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: UserRole;
  active: boolean;
  last_login_at?: string;
  must_change_password: boolean;
  preferred_language?: string;
  theme_preference?: string;
  organization_id?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
}

export interface Worker {
  id: string;
  employee_number?: string;
  department_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  hire_date?: string;
  weekly_contract_hours: number;
  contract_type?: ContractType;
  hourly_rate?: number;
  monthly_salary?: number;
  active: boolean;
  notes?: string;
  organization_id?: string;
}

export interface WorkerCreate {
  employee_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department_id?: string;
  weekly_contract_hours?: number;
  contract_type?: ContractType;
  hourly_rate?: number;
  monthly_salary?: number;
  organization_id?: string;
}

export interface ShiftType {
  id: string;
  name: string;
  color: string;
  start_time: string;
  end_time: string;
  duration: number;
  is_night_shift: boolean;
  requires_rest_day: boolean;
}

export interface ShiftTypeCreate {
  name: string;
  color: string;
  start_time: string;
  end_time: string;
  duration: number;
  is_night_shift?: boolean;
  requires_rest_day?: boolean;
}

export interface WorkerConstraint {
  id: string;
  worker_id: string;
  constraint_type: ConstraintType;
  start_date: string;
  end_date: string;
  priority: number;
  enabled: boolean;
  metadata_json?: Record<string, any>;
}

export interface ConstraintCreate {
  constraint_type: ConstraintType;
  start_date: string;
  end_date: string;
  priority?: number;
  enabled?: boolean;
  metadata_json?: Record<string, any>;
}

export interface Assignment {
  id: string;
  shift_instance_id: string;
  worker_id: string;
  assigned_by?: string;
  assignment_source: AssignmentSource;
  locked: boolean;
  notes?: string;
  worker?: Worker;
}

export interface ShiftInstance {
  id: string;
  schedule_id: string;
  date: string;
  shift_type_id: string;
  required_workers: number;
  shift_type: ShiftType;
  assignments?: Assignment[];
}

export interface Schedule {
  id: string;
  month: number;
  year: number;
  status: ScheduleStatus;
  generated_at?: string;
  generated_by?: string;
  solver_score?: string;
  shift_instances?: ShiftInstance[];
}

export interface CoverageSummary {
  schedule_id: string;
  total_shift_instances: number;
  total_required_workers: number;
  total_assigned_workers: number;
  coverage_percentage: number;
}

export interface ConflictItem {
  type: string;
  description: string;
  severity: 'HARD' | 'SOFT';
  worker_id?: string;
  date?: string;
}

export interface ConflictReport {
  schedule_id?: string;
  is_feasible: boolean;
  hard_conflicts_count: number;
  soft_violations_count: number;
  total_penalty_score: number;
  conflicts: ConflictItem[];
  summary_message: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  who?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  require_employee_id: boolean;
  active: boolean;
  country_code?: string;
  extra_country_code?: string;
  billing_cycle?: 'MONTHLY' | 'ANNUAL' | string;
  subscription_status?: 'ACTIVE' | 'SUSPENDED' | 'GRACE_PERIOD' | string;
  grace_period_until?: string;
  contact_email?: string;
  contact_tel?: string;
  address?: string;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingApplication {
  id: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_tel: string;
  address?: string;
  requested_domain?: string;
  estimated_employees: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SolverStatistics {
  variables_created: number;
  constraints_created: number;
  solver_runtime_seconds: number;
  memory_estimate_mb: number;
  objective_score: number;
  branches_explored: number;
  conflicts_detected: number;
  solver_status: string;
}

export interface WorkloadDistribution {
  employee_id: string;
  employee_name: string;
  count: number;
  target?: number;
  deviation?: number;
}

export interface SoftConstraintViolation {
  rule_id: string;
  rule_name: string;
  rule_category: string;
  penalty_score: number;
  employees_affected: string[];
  dates_affected: string[];
  description: string;
}

export interface OvertimeSummary {
  total_overtime_hours: number;
  employees_with_overtime_count: number;
  max_overtime_hours_employee: number;
  affected_employee_names: string[];
}

export interface SkillCoverage {
  skill_tag: string;
  required_shifts: number;
  assigned_shifts: number;
  unmet_shifts: number;
  coverage_percentage: number;
}

export interface SuccessfulDiagnostics {
  coverage_percentage: number;
  fairness_score: number;
  total_assigned_shifts: number;
  unassigned_shifts: number;
  soft_constraint_violations: SoftConstraintViolation[];
  overtime_summary: OvertimeSummary;
  weekend_distribution: WorkloadDistribution[];
  night_shift_distribution: WorkloadDistribution[];
  skill_coverage_summary: SkillCoverage[];
}

export interface SeverityReason {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  category: string;
  reason: string;
  affected_employees: string[];
  affected_dates: string[];
  suggested_action: string;
}

export interface FailedDiagnostics {
  is_infeasible: boolean;
  summary: string;
  ranked_reasons: SeverityReason[];
  affected_employees: string[];
  affected_dates: string[];
  suggested_remediations: string[];
}

export interface ConstraintDiagnostic {
  constraint_name: string;
  constraint_type: 'HARD' | 'SOFT' | string;
  category: string;
  employees_affected: string[];
  dates_affected: string[];
  number_of_conflicts: number;
  suggested_corrective_actions: string[];
}

export interface SuggestedFix {
  id: string;
  title: string;
  description: string;
  action_type: string;
  employee_id?: string;
  employee_name?: string;
  date?: string;
  impact_score: number;
}

export interface ComprehensiveDiagnostics {
  schedule_id: string;
  status: string;
  timestamp: string;
  solver_statistics: SolverStatistics;
  successful_diagnostics?: SuccessfulDiagnostics;
  failed_diagnostics?: FailedDiagnostics;
  constraint_diagnostics: ConstraintDiagnostic[];
  suggested_fixes: SuggestedFix[];
}

export interface SandboxSchedule {
  id: string;
  parent_schedule_id?: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'SIMULATED' | 'APPROVED' | 'REJECTED' | 'PROMOTED' | 'ARCHIVED' | string;
  version: number;
  author_id?: string;
  author_name?: string;
  year: number;
  month: number;
  scenario_type?: string;
  scenario_params?: any;
  created_at: string;
  updated_at: string;
  total_instances: number;
  total_assignments: number;
  coverage_percentage: number;
}

export interface AssignmentDiffItem {
  change_type: 'ADDED' | 'REMOVED' | 'CHANGED_WORKER' | 'UNCHANGED';
  date: string;
  shift_type_id: string;
  shift_name: string;
  original_worker_id?: string;
  original_worker_name?: string;
  sandbox_worker_id?: string;
  sandbox_worker_name?: string;
  notes?: string;
}

export interface MetricDiffSummary {
  original_coverage_pct: number;
  sandbox_coverage_pct: number;
  coverage_delta: number;
  original_fairness_score: number;
  sandbox_fairness_score: number;
  fairness_delta: number;
  original_overtime_hours: number;
  sandbox_overtime_hours: number;
  overtime_delta: number;
  original_unfilled_shifts: number;
  sandbox_unfilled_shifts: number;
  unfilled_delta: number;
}

export interface ScheduleComparison {
  original_schedule_id: string;
  sandbox_id: string;
  total_changes_count: number;
  added_assignments_count: number;
  removed_assignments_count: number;
  modified_assignments_count: number;
  metrics_summary: MetricDiffSummary;
  assignment_diffs: AssignmentDiffItem[];
  constraint_diffs: any[];
}

export interface SandboxSimulationRequest {
  scenario_type: 'SICK_CALL' | 'VACATION_REQUEST' | 'STAFF_SHORTAGE' | 'EXTRA_STAFF' | 'RULE_MODIFICATION' | string;
  employee_id?: string;
  dates?: string[];
  rule_type?: string;
  rule_params?: any;
  notes?: string;
}

export interface SandboxVersionItem {
  id: string;
  sandbox_id: string;
  version_number: number;
  change_description: string;
  author_name?: string;
  created_at: string;
}

export interface StaffingWidget {
  total_workers: number;
  active_workers: number;
  scheduled_workers_today: number;
  required_workers_today: number;
  open_shifts_today: number;
  unfilled_shifts_today: number;
  coverage_percentage_today: number;
}

export interface OperationalOverview {
  staffing_status: StaffingWidget;
  current_coverage_percentage: number;
  total_schedules: number;
  published_schedules: number;
  draft_schedules: number;
  pending_approvals: number;
  pending_imports: number;
  pending_exports: number;
  active_users_count: number;
  recent_solver_runs: any[];
  recent_audit_events: any[];
}

export interface EmployeeAnalyticsItem {
  worker_id: string;
  employee_number: string;
  worker_name: string;
  department_name: string;
  assigned_shifts_count: number;
  total_worked_hours: number;
  night_shifts_count: number;
  weekend_shifts_count: number;
  vacation_days_count: number;
  overtime_hours: number;
  fairness_score: number;
  rule_conflicts_count: number;
  skill_utilization_pct: number;
  availability_status: string;
}

export interface DepartmentAnalyticsItem {
  department_id: string;
  department_name: string;
  active_staff_count: number;
  coverage_percentage: number;
  total_assigned_shifts: number;
  open_positions_count: number;
  skill_shortages_count: number;
  total_overtime_hours: number;
  night_shift_balance_score: number;
  vacation_impact_score: number;
}

export interface TrendPoint {
  period_label: string;
  coverage_pct: number;
  overtime_hours: number;
  night_shifts_count: number;
  weekend_shifts_count: number;
  solver_runtime_seconds: number;
  fairness_score: number;
  rule_violations_count: number;
  staff_utilization_pct: number;
}

export interface HistoricalTrends {
  granularity: string;
  trends: TrendPoint[];
}

export interface ServiceHealthItem {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN' | string;
  response_time_ms: number;
  details?: string;
}

export interface SystemHealth {
  overall_status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | string;
  database: ServiceHealthItem;
  redis_cache: ServiceHealthItem;
  celery_queue: ServiceHealthItem;
  api_gateway: ServiceHealthItem;
  cpu_usage_pct: number;
  memory_usage_pct: number;
  disk_usage_pct: number;
  container_status: string;
  backup_status: string;
  last_successful_backup_at?: string;
  queue_depth: number;
}

export interface OperationalAlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | string;
  category: string;
  title: string;
  message: string;
  timestamp: string;
  suggested_action?: string;
}

export interface ConflictDiagnosticItem {
  id: string;
  category: string;
  severity: 'HARD' | 'SOFT' | string;
  worker_id?: string;
  worker_name?: string;
  date: string;
  shift_type_id?: string;
  shift_name?: string;
  details: string;
}

export interface RepairActionItem {
  action_type: 'SWAP' | 'REASSIGN' | 'REPLACE' | 'OVERTIME' | 'RULE_RELAX' | 'LOCAL_SOLVER' | string;
  date: string;
  shift_instance_id: string;
  shift_name: string;
  original_worker_id?: string;
  original_worker_name?: string;
  target_worker_id?: string;
  target_worker_name?: string;
  notes: string;
}

export interface ExplainabilityReport {
  conflict_detected: string;
  root_cause: string;
  repair_performed: string;
  employees_affected: string[];
  reason_chosen: string;
  alternatives_considered: string[];
  expected_impact: string;
}

export interface RepairPlanOut {
  id: string;
  plan_name: string;
  rank: number;
  tier: string;
  disruption_score: number;
  conflicts_resolved_count: number;
  assignments_changed_count: number;
  fairness_score: number;
  overtime_delta_hours: number;
  coverage_improvement_pct: number;
  actions: RepairActionItem[];
  explainability: ExplainabilityReport;
}

export interface RepairHistoryItem {
  id: string;
  schedule_id: string;
  plan_name: string;
  author_name?: string;
  disruption_score: number;
  conflicts_resolved_count: number;
  assignments_changed_count: number;
  status: string;
  applied_at?: string;
}
