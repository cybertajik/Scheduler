import React, { useEffect, useState } from 'react';
import { Users, Clock, ShieldAlert, X, Mail, Phone, Calendar, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Worker, WorkerConstraint } from '../../types';
import { workerService } from '../../services/apiServices';

interface WorkerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  assignedHours: number;
  onConstraintUpdated?: () => void;
}

export const WorkerDetailDrawer: React.FC<WorkerDetailDrawerProps> = ({
  isOpen,
  onClose,
  worker,
  assignedHours,
  onConstraintUpdated,
}) => {
  const [rules, setRules] = useState<WorkerConstraint[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Constraint Form State
  const [constraintType, setConstraintType] = useState<string>('UNAVAILABILITY');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<number>(10); // 10 = Hard Constraint

  const fetchRules = async () => {
    if (!worker) return;
    try {
      setLoadingRules(true);
      const data = await workerService.getWorkerRules(worker.id);
      setRules(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load worker availability rules');
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    if (isOpen && worker) {
      fetchRules();
    }
  }, [isOpen, worker]);

  if (!isOpen || !worker) return null;

  const targetHours = worker.weekly_contract_hours * 4; // Approx monthly target
  const fulfillmentPercentage = Math.min(Math.round((assignedHours / (targetHours || 1)) * 100), 100);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    try {
      setError('');
      await workerService.createWorkerRule(worker.id, {
        constraint_type: constraintType as any,
        start_date: startDate,
        end_date: endDate,
        priority: priority,
        enabled: true,
      });
      setShowAddForm(false);
      fetchRules();
      if (onConstraintUpdated) onConstraintUpdated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add worker constraint');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!worker) return;
    try {
      setError('');
      await workerService.deleteWorkerRule(worker.id, ruleId);
      fetchRules();
      if (onConstraintUpdated) onConstraintUpdated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete worker constraint');
    }
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 shadow-2xl overflow-hidden print:hidden">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-slate-100 text-sm">Employee Profile & Settings</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

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

        {/* ── WORKER CONSTRAINTS & AVAILABILITY SETTINGS ── */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200 uppercase text-[11px]">Availability & Restrictions</span>
            </div>
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add Rule</span>
            </button>
          </div>

          {/* Add Constraint Form */}
          {showAddForm && (
            <form onSubmit={handleAddRule} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Restriction Type</label>
                <select
                  value={constraintType}
                  onChange={(e) => setConstraintType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs"
                >
                  <option value="UNAVAILABILITY">Unavailability (Cannot Work)</option>
                  <option value="VACATION">Vacation / Approved Leave</option>
                  <option value="PREFERRED_SHIFT">Preferred Shift Type</option>
                  <option value="MAX_SHIFTS">Max Shift Limit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Enforcement Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs"
                >
                  <option value={10}>Strict Hard Constraint (Must Obey)</option>
                  <option value={5}>Soft Preference (Solver Optimization)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow"
                >
                  <Check className="w-3 h-3" />
                  Save Rule
                </button>
              </div>
            </form>
          )}

          {/* Active Constraints List */}
          {loadingRules ? (
            <p className="text-[10px] text-slate-500 italic">Loading availability rules...</p>
          ) : rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        r.constraint_type === 'VACATION' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {r.constraint_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {r.priority >= 10 ? 'Hard' : 'Soft'}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-300">
                      {r.start_date} to {r.end_date}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete restriction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 italic">No custom restrictions defined for this employee.</p>
          )}
        </div>

        {/* Notes */}
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
