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
