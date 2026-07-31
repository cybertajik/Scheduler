import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ShieldAlert, Clock,
  FileText, UserCog, LogOut, CalendarCheck, Activity, FileSpreadsheet, BarChart2,
  Building2, Sliders, Sun, Moon, Globe, Boxes
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../Common/StatusBadge';

export const Sidebar: React.FC = () => {
  const { user, logout, canManageUsers, canManageWorkers, canManageSchedules } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();

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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight">{t('app_title')}</h1>
            <p className="text-[10px] text-slate-400 font-mono">Multi-Tenant SaaS v2.1</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Footer & Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        {/* Theme & Language Quick Switcher */}
        <div className="flex items-center justify-between space-x-2 pt-1">
          {/* Light/Dark Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('light_mode')}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('dark_mode')}</span>
              </>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
            <Globe className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
              </p>
              <StatusBadge status={user?.role} type="role" />
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </aside>
  );
};
