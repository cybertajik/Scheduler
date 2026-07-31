import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { createMockUser } from './factories';

const AuthTestComponent = () => {
  const { user, isAuthenticated, isSuperAdmin, isOrgAdmin, canManageSchedules, canManageWorkers } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-role">{user ? user.role : 'none'}</span>
      <span data-testid="is-superadmin">{isSuperAdmin ? 'yes' : 'no'}</span>
      <span data-testid="is-orgadmin">{isOrgAdmin ? 'yes' : 'no'}</span>
      <span data-testid="can-schedules">{canManageSchedules ? 'yes' : 'no'}</span>
      <span data-testid="can-workers">{canManageWorkers ? 'yes' : 'no'}</span>
    </div>
  );
};

describe('AuthContext Component Unit Tests', () => {
  it('provides default logged-out state when no token is present', () => {
    localStorage.clear();
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('logged-out');
    expect(screen.getByTestId('user-role').textContent).toBe('none');
    expect(screen.getByTestId('is-superadmin').textContent).toBe('no');
  });

  it('correctly identifies SUPER_ADMIN user roles and restricts operational tenant permissions', () => {
    const superAdmin = createMockUser({ role: 'SUPER_ADMIN', email: 'admin@admin.com' });
    localStorage.setItem('auth_user', JSON.stringify(superAdmin));
    localStorage.setItem('auth_token', 'mock-access-token');

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('logged-in');
    expect(screen.getByTestId('user-role').textContent).toBe('SUPER_ADMIN');
    expect(screen.getByTestId('is-superadmin').textContent).toBe('yes');
    expect(screen.getByTestId('is-orgadmin').textContent).toBe('no');
    expect(screen.getByTestId('can-schedules').textContent).toBe('no');
    expect(screen.getByTestId('can-workers').textContent).toBe('no');
  });

  it('correctly grants operational permissions for ORG_ADMIN user roles', () => {
    const orgAdmin = createMockUser({ role: 'ORG_ADMIN', email: 'testorg1@org.com' });
    localStorage.setItem('auth_user', JSON.stringify(orgAdmin));
    localStorage.setItem('auth_token', 'mock-access-token');

    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('logged-in');
    expect(screen.getByTestId('user-role').textContent).toBe('ORG_ADMIN');
    expect(screen.getByTestId('is-superadmin').textContent).toBe('no');
    expect(screen.getByTestId('is-orgadmin').textContent).toBe('yes');
    expect(screen.getByTestId('can-schedules').textContent).toBe('yes');
    expect(screen.getByTestId('can-workers').textContent).toBe('yes');
  });
});
