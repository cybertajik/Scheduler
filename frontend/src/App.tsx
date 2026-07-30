import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const UserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, canManageUsers } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
          <BrowserRouter>
            <LanguageSelectModal />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
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
                  <ProtectedRoute>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
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
                  <AdminRoute>
                    <SystemStatusPage />
                  </AdminRoute>
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
                  <ProtectedRoute>
                    <AnalyticsDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizations"
                element={
                  <AdminRoute>
                    <OrganizationsManagementPage />
                  </AdminRoute>
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
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
