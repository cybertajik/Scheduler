import { authService, organizationService, onboardingService } from '../services/apiServices';

describe('API Services Client Unit Test Suite', () => {
  it('exports authService methods', () => {
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.logout).toBe('function');
    expect(typeof authService.getMe).toBe('function');
  });

  it('exports organizationService methods', () => {
    expect(typeof organizationService.getOrganizations).toBe('function');
    expect(typeof organizationService.createOrganization).toBe('function');
    expect(typeof organizationService.extendGracePeriod).toBe('function');
    expect(typeof organizationService.suspendOrganization).toBe('function');
    expect(typeof organizationService.activateOrganization).toBe('function');
  });

  it('exports onboardingService methods', () => {
    expect(typeof onboardingService.submitApplication).toBe('function');
    expect(typeof onboardingService.listApplications).toBe('function');
    expect(typeof onboardingService.approveApplication).toBe('function');
    expect(typeof onboardingService.rejectApplication).toBe('function');
  });
});
