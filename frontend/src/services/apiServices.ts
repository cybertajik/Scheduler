import { apiClient } from '../api/client';
import {
  User, Worker, WorkerCreate, ShiftType, ShiftTypeCreate,
  WorkerConstraint, ConstraintCreate, Schedule, ShiftInstance,
  Assignment, CoverageSummary, ConflictReport, AuditLog, Department
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
