import React from 'react';
import { Users, Clock, ShieldAlert, X, Mail, Phone, Calendar } from 'lucide-react';
import { Worker } from '../../types';

interface WorkerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  assignedHours: number;
}

export const WorkerDetailDrawer: React.FC<WorkerDetailDrawerProps> = ({
  isOpen,
  onClose,
  worker,
  assignedHours,
}) => {
  if (!isOpen || !worker) return null;

  const targetHours = worker.weekly_contract_hours * 4; // Approx monthly target
  const fulfillmentPercentage = Math.min(Math.round((assignedHours / (targetHours || 1)) * 100), 100);

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-slate-100 text-sm">Worker Profile Drawer</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Worker Summary Card */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
              {worker.first_name?.[0]}{worker.last_name?.[0]}
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">{worker.first_name} {worker.last_name}</h4>
              <p className="font-mono text-[10px] text-slate-400">EMP ID: {worker.employee_number}</p>
            </div>
          </div>

          <div className="pt-2 space-y-1 text-slate-300">
            {worker.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{worker.email}</span>
              </div>
            )}
            {worker.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{worker.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contract Hours Fulfillment Metric */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Monthly Contract Target</span>
            <span className="font-mono font-bold text-slate-200">{assignedHours}h / {targetHours}h</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${fulfillmentPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${fulfillmentPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 text-right font-mono">{fulfillmentPercentage}% Contract Hours Allocated</p>
        </div>

        {/* Notes & Operational Parameters */}
        {worker.notes && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Special Instructions / Notes</span>
            <p className="text-slate-300 text-[11px] italic">{worker.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
