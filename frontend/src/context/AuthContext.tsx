import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiServices';
import { User, UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isScheduler: boolean;
  isManager: boolean;
  canManageSchedules: boolean;
  canManageWorkers: boolean;
  canManageUsers: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem('user_info', JSON.stringify(userData));
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    const { access_token, refresh_token } = data;
    
    setToken(access_token);
    localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    
    await fetchCurrentUser();
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  };

  const role = user?.role || null;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOrgAdmin = role === 'ORG_ADMIN' || role === 'ADMIN';
  const isAdmin = isSuperAdmin || isOrgAdmin;
  const isScheduler = role === 'SCHEDULER';
  const isManager = role === 'MANAGER';

  const canManageSchedules = (isOrgAdmin || isScheduler) && !isSuperAdmin;
  const canManageWorkers = (isOrgAdmin || isScheduler) && !isSuperAdmin;
  const canManageUsers = isOrgAdmin && !isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        role,
        isAdmin,
        isSuperAdmin,
        isOrgAdmin,
        isScheduler,
        isManager,
        canManageSchedules,
        canManageWorkers,
        canManageUsers,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
