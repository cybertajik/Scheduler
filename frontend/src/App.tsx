import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { HolidayProvider } from './context/HolidayContext';
import { LanguageSelectModal } from './components/Common/LanguageSelectModal';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkersPage } from './pages/WorkersPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { ShiftTypesPage } from './pages/ShiftTypesPage';
import { RulesPage } from './pages/RulesPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ScheduleDetailPage } from './pages/ScheduleDetailPage';
import { ConflictReviewPage } from './pages/ConflictReviewPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { OrganizationsManagementPage } from './pages/OrganizationsManagementPage';
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SandboxPage } from './pages/SandboxPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/organizations" replace />;
  }
  return <Layout>{children}</Layout>;
};

const CommonProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/organizations" replace />;
  }
  return <Layout>{children}</Layout>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const UserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, canManageUsers, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/organizations" replace />;
  }
  if (!canManageUsers) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <HolidayProvider>
          <BrowserRouter>
            <LanguageSelectModal />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedules"
                element={
                  <ProtectedRoute>
                    <SchedulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedules/:id"
                element={
                  <ProtectedRoute>
                    <ScheduleDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sandbox"
                element={
                  <ProtectedRoute>
                    <SandboxPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedules/:id/conflicts"
                element={
                  <ProtectedRoute>
                    <ConflictReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers"
                element={
                  <ProtectedRoute>
                    <WorkersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers/:id"
                element={
                  <ProtectedRoute>
                    <WorkerDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shift-types"
                element={
                  <ProtectedRoute>
                    <ShiftTypesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules"
                element={
                  <ProtectedRoute>
                    <RulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <CommonProtectedRoute>
                    <AuditLogPage />
                  </CommonProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <CommonProtectedRoute>
                    <ProfilePage />
                  </CommonProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <UserManagementRoute>
                    <UsersManagementPage />
                  </UserManagementRoute>
                }
              />
              <Route
                path="/system-status"
                element={
                  <SuperAdminRoute>
                    <SystemStatusPage />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="/import-export"
                element={
                  <AdminRoute>
                    <ImportExportPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <CommonProtectedRoute>
                    <AnalyticsDashboardPage />
                  </CommonProtectedRoute>
                }
              />
              <Route
                path="/my-portal"
                element={
                  <CommonProtectedRoute>
                    <EmployeePortalPage />
                  </CommonProtectedRoute>
                }
              />
              <Route
                path="/organizations"
                element={
                  <SuperAdminRoute>
                    <OrganizationsManagementPage />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="/organization-settings"
                element={
                  <AdminRoute>
                    <OrganizationSettingsPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </HolidayProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
