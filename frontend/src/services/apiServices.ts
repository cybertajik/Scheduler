import { apiClient } from '../api/client';
import {
  User, Worker, WorkerCreate, ShiftType, ShiftTypeCreate,
  WorkerConstraint, ConstraintCreate, Schedule, ShiftInstance,
  Assignment, CoverageSummary, ConflictReport, AuditLog, Department,
  ComprehensiveDiagnostics, SandboxSchedule, ScheduleComparison, SandboxSimulationRequest, SandboxVersionItem,
  OperationalOverview, SystemHealth, EmployeeAnalyticsItem, DepartmentAnalyticsItem, HistoricalTrends, OperationalAlertItem,
  ConflictDiagnosticItem, RepairPlanOut, RepairHistoryItem
} from '../types';

export const authService = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  createUser: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },
  deactivateUser: async (id: string) => {
    const response = await apiClient.post(`/users/${id}/deactivate`);
    return response.data;
  },
  activateUser: async (id: string) => {
    const response = await apiClient.post(`/users/${id}/activate`);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export const workerService = {
  getWorkers: async (activeOnly = true): Promise<Worker[]> => {
    const response = await apiClient.get(`/workers?active_only=${activeOnly}`);
    return response.data;
  },
  getWorker: async (id: string): Promise<Worker> => {
    const response = await apiClient.get(`/workers/${id}`);
    return response.data;
  },
  createWorker: async (data: WorkerCreate): Promise<Worker> => {
    const response = await apiClient.post('/workers', data);
    return response.data;
  },
  updateWorker: async (id: string, data: Partial<Worker>): Promise<Worker> => {
    const response = await apiClient.patch(`/workers/${id}`, data);
    return response.data;
  },
  deleteWorker: async (id: string) => {
    const response = await apiClient.delete(`/workers/${id}`);
    return response.data;
  },
  getWorkerRules: async (workerId: string): Promise<WorkerConstraint[]> => {
    const response = await apiClient.get(`/workers/${workerId}/rules`);
    return response.data;
  },
  createWorkerRule: async (workerId: string, rule: ConstraintCreate): Promise<WorkerConstraint> => {
    const response = await apiClient.post(`/workers/${workerId}/rules`, rule);
    return response.data;
  },
  deleteWorkerRule: async (workerId: string, ruleId: string) => {
    const response = await apiClient.delete(`/workers/${workerId}/rules/${ruleId}`);
    return response.data;
  },
};

export const shiftTypeService = {
  getShiftTypes: async (): Promise<ShiftType[]> => {
    const response = await apiClient.get('/shift-types');
    return response.data;
  },
  createShiftType: async (data: ShiftTypeCreate): Promise<ShiftType> => {
    const response = await apiClient.post('/shift-types', data);
    return response.data;
  },
  updateShiftType: async (id: string, data: Partial<ShiftType>): Promise<ShiftType> => {
    const response = await apiClient.patch(`/shift-types/${id}`, data);
    return response.data;
  },
  deleteShiftType: async (id: string) => {
    const response = await apiClient.delete(`/shift-types/${id}`);
    return response.data;
  },
};

export const ruleService = {
  getRules: async (workerId?: string, enabled?: boolean): Promise<WorkerConstraint[]> => {
    let url = '/rules?';
    if (workerId) url += `worker_id=${workerId}&`;
    if (enabled !== undefined) url += `enabled=${enabled}&`;
    const response = await apiClient.get(url);
    return response.data;
  },
  updateRule: async (id: string, data: Partial<WorkerConstraint>): Promise<WorkerConstraint> => {
    const response = await apiClient.patch(`/rules/${id}`, data);
    return response.data;
  },
  deleteRule: async (id: string) => {
    const response = await apiClient.delete(`/rules/${id}`);
    return response.data;
  },
};

export const scheduleService = {
  getSchedules: async (): Promise<Schedule[]> => {
    const response = await apiClient.get('/schedules');
    return response.data;
  },
  createSchedule: async (data: { month: number; year: number; shift_instances?: any[] }): Promise<Schedule> => {
    const response = await apiClient.post('/schedules', data);
    return response.data;
  },
  getScheduleDetail: async (id: string): Promise<Schedule> => {
    const response = await apiClient.get(`/schedules/${id}`);
    return response.data;
  },
  updateSchedule: async (id: string, data: { status?: string }): Promise<Schedule> => {
    const response = await apiClient.patch(`/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id: string) => {
    const response = await apiClient.delete(`/schedules/${id}`);
    return response.data;
  },
  triggerSolver: async (scheduleId: string) => {
    const response = await apiClient.post(`/schedules/${scheduleId}/generate`);
    return response.data;
  },
  getSolverStatus: async (scheduleId: string) => {
    const response = await apiClient.get(`/schedules/${scheduleId}/solver-status`);
    return response.data;
  },
  getScheduleDiagnostics: async (scheduleId: string): Promise<ComprehensiveDiagnostics> => {
    const response = await apiClient.get(`/schedules/${scheduleId}/diagnostics`);
    return response.data;
  },
  downloadDiagnosticsExport: async (scheduleId: string) => {
    const response = await apiClient.get(`/schedules/${scheduleId}/diagnostics/export`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solver_diagnostics_${scheduleId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  getCoverage: async (scheduleId: string): Promise<CoverageSummary> => {
    const response = await apiClient.get(`/schedules/${scheduleId}/coverage`);
    return response.data;
  },
  getConflicts: async (scheduleId: string): Promise<ConflictReport> => {
    const response = await apiClient.get(`/schedules/${scheduleId}/conflicts`);
    return response.data;
  },
  getAuditLogs: async (scheduleId: string): Promise<AuditLog[]> => {
    const response = await apiClient.get(`/schedules/${scheduleId}/audit-log`);
    return response.data;
  },
};

export const assignmentService = {
  createAssignment: async (scheduleId: string, data: { shift_instance_id: string; worker_id: string; notes?: string; locked?: boolean }): Promise<Assignment> => {
    const response = await apiClient.post(`/schedules/${scheduleId}/assignments`, data);
    return response.data;
  },
  updateAssignment: async (id: string, data: { shift_instance_id?: string; worker_id?: string; locked?: boolean; notes?: string }): Promise<Assignment> => {
    const response = await apiClient.patch(`/assignments/${id}`, data);
    return response.data;
  },
  deleteAssignment: async (id: string) => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  },
};

export const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get('/departments');
    return response.data;
  },
  createDepartment: async (data: { name: string; description?: string }): Promise<Department> => {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },
};

export const systemStatusService = {
  getHealthStatus: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
  getDatabaseStats: async () => {
    const response = await apiClient.get('/health/database');
    return response.data;
  },
  getRedisStats: async () => {
    const response = await apiClient.get('/health/redis');
    return response.data;
  },
  getCeleryStats: async () => {
    const response = await apiClient.get('/health/celery');
    return response.data;
  },
  getSystemMetrics: async () => {
    const response = await apiClient.get('/health/metrics');
    return response.data;
  },
};

export const importExportService = {
  downloadScheduleExportUrl: (scheduleId: string, format: string) => {
    return `/api/v1/export/schedule/${scheduleId}?format=${format}`;
  },
  downloadWorkersExportUrl: () => '/api/v1/export/workers',
  downloadAuditLogExportUrl: () => '/api/v1/export/audit-log',
  validateWorkersImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/import/validate-workers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  commitWorkersImport: async (validRecords: any[]) => {
    const response = await apiClient.post('/import/commit-workers', { valid_records: validRecords });
    return response.data;
  }
};

export const analyticsService = {
  getOverview: async () => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },
  getSchedulesSummary: async () => {
    const response = await apiClient.get('/analytics/schedules-summary');
    return response.data;
  },
  getDailyCoverage: async (scheduleId: string) => {
    const response = await apiClient.get(`/analytics/${scheduleId}/coverage`);
    return response.data;
  },
  getWorkerLoad: async (scheduleId: string) => {
    const response = await apiClient.get(`/analytics/${scheduleId}/worker-load`);
    return response.data;
  },
  getDepartmentLoad: async (scheduleId: string) => {
    const response = await apiClient.get(`/analytics/${scheduleId}/department-load`);
    return response.data;
  },
  getShiftDistribution: async (scheduleId: string) => {
    const response = await apiClient.get(`/analytics/${scheduleId}/shift-distribution`);
    return response.data;
  },
  getOperationalDashboard: async (forceRefresh: boolean = false): Promise<OperationalOverview> => {
    const response = await apiClient.get(`/analytics/operational-dashboard?force_refresh=${forceRefresh}`);
    return response.data;
  },
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get('/analytics/system-health');
    return response.data;
  },
  getEmployeeAnalytics: async (departmentId?: string): Promise<EmployeeAnalyticsItem[]> => {
    const url = departmentId ? `/analytics/employee-analytics?department_id=${departmentId}` : '/analytics/employee-analytics';
    const response = await apiClient.get(url);
    return response.data;
  },
  getDepartmentAnalytics: async (): Promise<DepartmentAnalyticsItem[]> => {
    const response = await apiClient.get('/analytics/department-analytics');
    return response.data;
  },
  getHistoricalTrends: async (granularity: string = 'MONTHLY'): Promise<HistoricalTrends> => {
    const response = await apiClient.get(`/analytics/historical-trends?granularity=${granularity}`);
    return response.data;
  },
  getAlerts: async (): Promise<OperationalAlertItem[]> => {
    const response = await apiClient.get('/analytics/alerts');
    return response.data;
  },
  downloadReport: async (format: string = 'CSV') => {
    const response = await apiClient.get(`/analytics/export?format=${format}`, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workforce_analytics_report.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export const organizationService = {
  getOrganizations: async () => {
    const response = await apiClient.get('/organizations');
    return response.data;
  },
  createOrganization: async (data: any) => {
    const response = await apiClient.post('/organizations', data);
    return response.data;
  },
  getCurrentOrganization: async () => {
    const response = await apiClient.get('/organizations/current');
    return response.data;
  },
  updateCurrentOrganization: async (data: any) => {
    const response = await apiClient.patch('/organizations/current', data);
    return response.data;
  },
  updateOrganizationById: async (orgId: string, data: any) => {
    const response = await apiClient.patch(`/organizations/${orgId}`, data);
    return response.data;
  },
  updateUserPreferences: async (data: { preferred_language?: string; theme_preference?: string }) => {
    const response = await apiClient.patch('/auth/me/preferences', data);
    return response.data;
  },
  extendGracePeriod: async (orgId: string, days: number = 14) => {
    const response = await apiClient.post(`/organizations/${orgId}/extend-grace?days=${days}`);
    return response.data;
  },
  suspendOrganization: async (orgId: string) => {
    const response = await apiClient.post(`/organizations/${orgId}/suspend`);
    return response.data;
  },
  activateOrganization: async (orgId: string) => {
    const response = await apiClient.post(`/organizations/${orgId}/activate`);
    return response.data;
  },
  deleteOrganization: async (orgId: string) => {
    const response = await apiClient.delete(`/organizations/${orgId}`);
    return response.data;
  },
};

export const onboardingService = {
  submitApplication: async (data: any) => {
    const response = await apiClient.post('/onboarding/apply', data);
    return response.data;
  },
  getApplications: async () => {
    const response = await apiClient.get('/onboarding/applications');
    return response.data;
  },
  approveApplication: async (id: string) => {
    const response = await apiClient.post(`/onboarding/applications/${id}/approve`);
    return response.data;
  },
  rejectApplication: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/onboarding/applications/${id}/reject`, { reason });
    return response.data;
  },
};

export const holidayService = {
  getSupportedCountries: async (): Promise<{ code: string; name: string }[]> => {
    const response = await apiClient.get('/holidays/countries');
    return response.data;
  },
  getOrgHolidays: async (year: number): Promise<{ date: string; name: string; country: string }[]> => {
    const response = await apiClient.get(`/holidays/org-holidays?year=${year}`);
    return response.data;
  },
  getCountryDateFormat: async (countryCode: string): Promise<{ country_code: string; date_format: string }> => {
    const response = await apiClient.get(`/holidays/date-format?country_code=${countryCode}`);
    return response.data;
  },
};

export const sandboxService = {
  createSandbox: async (data: { parent_schedule_id?: string; name: string; description?: string; year?: number; month?: number; scenario_type?: string }) => {
    const response = await apiClient.post('/sandboxes', data);
    return response.data;
  },
  getSandboxes: async (): Promise<SandboxSchedule[]> => {
    const response = await apiClient.get('/sandboxes');
    return response.data;
  },
  getSandboxDetail: async (id: string): Promise<SandboxSchedule> => {
    const response = await apiClient.get(`/sandboxes/${id}`);
    return response.data;
  },
  updateSandbox: async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const response = await apiClient.patch(`/sandboxes/${id}`, data);
    return response.data;
  },
  deleteSandbox: async (id: string) => {
    const response = await apiClient.delete(`/sandboxes/${id}`);
    return response.data;
  },
  cloneSandbox: async (id: string) => {
    const response = await apiClient.post(`/sandboxes/${id}/clone`);
    return response.data;
  },
  archiveSandbox: async (id: string) => {
    const response = await apiClient.post(`/sandboxes/${id}/archive`);
    return response.data;
  },
  restoreSandbox: async (id: string) => {
    const response = await apiClient.post(`/sandboxes/${id}/restore`);
    return response.data;
  },
  runSimulation: async (id: string, req: SandboxSimulationRequest) => {
    const response = await apiClient.post(`/sandboxes/${id}/simulate`, req);
    return response.data;
  },
  compareSchedules: async (sandboxId: string, targetId: string): Promise<ScheduleComparison> => {
    const response = await apiClient.get(`/sandboxes/${sandboxId}/compare/${targetId}`);
    return response.data;
  },
  promoteSandbox: async (id: string) => {
    const response = await apiClient.post(`/sandboxes/${id}/promote`);
    return response.data;
  },
  getVersionHistory: async (id: string): Promise<SandboxVersionItem[]> => {
    const response = await apiClient.get(`/sandboxes/${id}/versions`);
    return response.data;
  },
};

export const repairService = {
  analyzeConflicts: async (scheduleId: string): Promise<ConflictDiagnosticItem[]> => {
    const response = await apiClient.post(`/schedules/${scheduleId}/repair/analyze`);
    return response.data;
  },
  generateRepairPlans: async (scheduleId: string): Promise<RepairPlanOut[]> => {
    const response = await apiClient.post(`/schedules/${scheduleId}/repair/plans`);
    return response.data;
  },
  applyRepairPlan: async (scheduleId: string, planId: string) => {
    const response = await apiClient.post(`/schedules/${scheduleId}/repair/apply`, { plan_id: planId });
    return response.data;
  },
  undoRepair: async (scheduleId: string) => {
    const response = await apiClient.post(`/schedules/${scheduleId}/repair/undo`);
    return response.data;
  },
  redoRepair: async (scheduleId: string) => {
    const response = await apiClient.post(`/schedules/${scheduleId}/repair/redo`);
    return response.data;
  },
  getRepairHistory: async (scheduleId: string): Promise<RepairHistoryItem[]> => {
    const response = await apiClient.get(`/schedules/${scheduleId}/repair/history`);
    return response.data;
  },
};


