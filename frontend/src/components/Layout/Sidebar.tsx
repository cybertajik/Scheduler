import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ShieldAlert, Clock,
  FileText, UserCog, LogOut, CalendarCheck, Activity, FileSpreadsheet, BarChart2,
  Building2, Sliders, Sun, Moon, Globe, Boxes, UserCheck, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../Common/StatusBadge';

export const Sidebar: React.FC = () => {
  const { user, logout, canManageUsers, canManageWorkers, canManageSchedules } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN';

  const navItems = isSuperAdmin
    ? [
        { label: t('organizations'), path: '/organizations', icon: Building2, show: true },
        { label: t('analytics'), path: '/analytics', icon: BarChart2, show: true },
        { label: t('system_status'), path: '/system-status', icon: Activity, show: true },
        { label: t('audit_log'), path: '/audit-log', icon: FileText, show: true },
      ]
    : [
        { label: t('dashboard'), path: '/', icon: LayoutDashboard, show: true },
        { label: 'My Self-Service Portal', path: '/my-portal', icon: UserCheck, show: true },
        { label: t('analytics'), path: '/analytics', icon: BarChart2, show: true },
        { label: t('schedules'), path: '/schedules', icon: Calendar, show: canManageSchedules },
        { label: 'Scenario Sandbox', path: '/sandbox', icon: Boxes, show: canManageSchedules },
        { label: t('workers'), path: '/workers', icon: Users, show: canManageWorkers },
        { label: t('shift_definitions'), path: '/shift-types', icon: Clock, show: canManageWorkers },
        { label: t('rules_constraints'), path: '/rules', icon: ShieldAlert, show: canManageWorkers },
        { label: t('audit_log'), path: '/audit-log', icon: FileText, show: true },
        { label: t('import_export'), path: '/import-export', icon: FileSpreadsheet, show: canManageUsers },
        { label: t('user_accounts'), path: '/users', icon: UserCog, show: canManageUsers },
        { label: t('organization_settings'), path: '/organization-settings', icon: Sliders, show: isOrgAdmin },
      ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between min-h-screen select-none transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-slate-800`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-bold text-slate-100 text-sm leading-tight truncate">{t('app_title')}</h1>
                <p className="text-[9px] text-slate-400 font-mono">Multi-Tenant SaaS v2.1</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems
            .filter(item => item.show)
            .map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
              {user?.first_name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.full_name || user?.username}
                </p>
                <StatusBadge status={user?.role} type="role" />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && <span>{t('sign_out')}</span>}
        </button>
      </div>
    </aside>
  );
};
