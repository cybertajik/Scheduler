import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  Activity,
  ShieldCheck,
  Building2,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Generate dynamic breadcrumb segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const routeNames: Record<string, string> = {
    schedules: 'Schedule Rosters',
    sandbox: 'Scenario Sandbox',
    workers: 'Employees',
    'shift-types': 'Shift Types',
    rules: 'Rules Engine',
    analytics: 'Analytics & Health',
    'audit-log': 'Audit Trail',
    'import-export': 'Import / Export',
    users: 'User Accounts',
    organizations: 'Organizations',
    'organization-settings': 'Organization Settings',
    'system-status': 'System Status',
    'my-portal': 'My Self-Service Portal'
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between shadow-md select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        {pathSegments.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
        {pathSegments.map((segment, idx) => {
          const isLast = idx === pathSegments.length - 1;
          const label = routeNames[segment] || segment;
          const path = `/${pathSegments.slice(0, idx + 1).join('/')}`;

          return (
            <React.Fragment key={path}>
              {isLast ? (
                <span className="text-white font-bold tracking-wide capitalize">{label}</span>
              ) : (
                <>
                  <Link to={path} className="hover:text-white transition-colors capitalize">
                    {label}
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Command Search Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs text-slate-400 transition-all shadow-inner group"
          title="Search or execute command (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Search or type command...</span>
          <kbd className="ml-2 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-500">
            Ctrl K
          </kbd>
        </button>

        {/* System Health Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span>Operational</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.first_name ? user.first_name[0] : 'U'}
            </div>
            <span className="hidden md:inline font-bold">{user?.first_name}</span>
            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[9px] uppercase font-mono font-bold">
              {user?.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-xs">
              <div className="p-2.5 border-b border-slate-800/80 space-y-0.5">
                <p className="font-bold text-white">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                to="/my-portal"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                My Self-Service Portal
              </Link>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
