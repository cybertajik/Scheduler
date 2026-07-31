import { User, Worker, Organization, OnboardingApplication } from '../types';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'usr-123456',
  username: 'testuser',
  email: 'testuser@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'ORG_ADMIN',
  active: true,
  must_change_password: false,
  preferred_language: 'en',
  theme_preference: 'dark',
  organization_id: 'org-123456',
  ...overrides,
});

export const createMockWorker = (overrides?: Partial<Worker>): Worker => ({
  id: 'wrk-123456',
  employee_number: 'EMP-001',
  department_id: 'dept-123456',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0199',
  weekly_contract_hours: 40,
  contract_type: 'HOURLY',
  active: true,
  organization_id: 'org-123456',
  ...overrides,
});

export const createMockOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: 'org-123456',
  name: 'Acme Care Center',
  slug: 'acmecare',
  domain: 'acmecare.scheduler.local',
  billing_cycle: 'MONTHLY',
  subscription_status: 'ACTIVE',
  require_employee_id: true,
  active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockOnboardingApp = (overrides?: Partial<OnboardingApplication>): OnboardingApplication => ({
  id: 'app-123456',
  org_name: 'St. Jude Hospital',
  contact_name: 'Dr. Helen Vance',
  contact_email: 'helen@stjude.org',
  contact_tel: '+1-555-0999',
  estimated_employees: 25,
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
