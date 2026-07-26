import React from 'react';
import { ScheduleStatus, ConstraintType, UserRole } from '../../types';

interface StatusBadgeProps {
  status?: ScheduleStatus | string | boolean;
  type?: 'schedule' | 'constraint' | 'role' | 'boolean';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'schedule' }) => {
  if (!status) return null;

  let colorClasses = 'bg-slate-700 text-slate-200 border-slate-600';

  if (type === 'schedule') {
    switch (status) {
      case 'DRAFT':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        break;
      case 'GENERATED':
        colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        break;
      case 'PUBLISHED':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        break;
      case 'ARCHIVED':
        colorClasses = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        break;
    }
  } else if (type === 'role') {
    switch (status) {
      case 'ADMIN':
        colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        break;
      case 'SCHEDULER':
        colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
        break;
      case 'MANAGER':
        colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
        break;
      case 'EMPLOYEE':
        colorClasses = 'bg-slate-500/10 text-slate-300 border-slate-500/30';
        break;
    }
  } else if (type === 'boolean') {
    colorClasses = status === 'Active' || status === 'True' || status === true
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (type === 'constraint') {
    switch (status) {
      case 'VACATION':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        break;
      case 'UNAVAILABLE_DATE':
      case 'UNAVAILABLE_RANGE':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        break;
      case 'NO_WEEKENDS':
      case 'NO_NIGHTS':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        break;
      default:
        colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        break;
    }
  }

  const label = typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {label}
    </span>
  );
};
