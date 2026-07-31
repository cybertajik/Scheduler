import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, ShieldAlert, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-3 text-cyan-400 font-extrabold text-xl">
          <Calendar className="w-7 h-7" />
          <span>StaffScheduler</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive('/') ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/schedules"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive('/schedules') ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedules</span>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/workers"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/workers') ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Employees</span>
              </Link>

              <Link
                to="/rules"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/rules') ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Constraints</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          <div className="text-xs text-left">
            <div className="font-semibold text-white">
              {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
            </div>
            <div className="text-slate-400">{user?.role}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};
