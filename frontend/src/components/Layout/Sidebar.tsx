import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ShieldAlert, Clock,
  FileText, UserCog, LogOut, CalendarCheck, Activity, FileSpreadsheet, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../Common/StatusBadge';

export const Sidebar: React.FC = () => {
  const { user, logout, canManageUsers, canManageWorkers, canManageSchedules } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { label: 'Analytics', path: '/analytics', icon: BarChart2, show: true },
    { label: 'Schedules', path: '/schedules', icon: Calendar, show: canManageSchedules || true },
    { label: 'Workers', path: '/workers', icon: Users, show: canManageWorkers || true },
    { label: 'Shift Definitions', path: '/shift-types', icon: Clock, show: canManageWorkers || true },
    { label: 'Rules & Constraints', path: '/rules', icon: ShieldAlert, show: canManageWorkers || true },
    { label: 'Audit Log', path: '/audit-log', icon: FileText, show: true },
    { label: 'Import / Export', path: '/import-export', icon: FileSpreadsheet, show: canManageUsers },
    { label: 'System Status', path: '/system-status', icon: Activity, show: canManageUsers },
    { label: 'User Accounts', path: '/users', icon: UserCog, show: canManageUsers },
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
            <h1 className="font-bold text-slate-100 text-base leading-tight">Staff Scheduler</h1>
            <p className="text-[10px] text-slate-400 font-mono">Enterprise CP-SAT v1.0</p>
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

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
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
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
