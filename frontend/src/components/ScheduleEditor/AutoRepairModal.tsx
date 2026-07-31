import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { RepairPlanOut } from '../../types';
import { repairService } from '../../services/apiServices';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface AutoRepairModalProps {
  scheduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onRepairApplied: () => void;
}

export const AutoRepairModal: React.FC<AutoRepairModalProps> = ({
  scheduleId,
  isOpen,
  onClose,
  onRepairApplied
}) => {
  const [plans, setPlans] = useState<RepairPlanOut[]>([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && scheduleId) {
      loadPlans();
    }
  }, [isOpen, scheduleId]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const generated = await repairService.generateRepairPlans(scheduleId);
      setPlans(generated);
      setSelectedPlanIndex(0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate repair plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    const currentPlan = plans[selectedPlanIndex];
    if (!currentPlan) return;
    setApplying(true);
    try {
      await repairService.applyRepairPlan(scheduleId, currentPlan.id);
      onRepairApplied();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to apply repair plan.');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  const currentPlan = plans[selectedPlanIndex];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Intelligent Auto-Repair Engine
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[10px] uppercase font-mono font-bold">
                  Minimal Change Optimization
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically resolves schedule conflicts with minimum disruption to published assignments.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <LoadingSpinner />
            <p className="text-xs text-slate-400">Analyzing conflicts & generating 5-tiered repair plans...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex justify-between items-center">
            <span>{error}</span>
            <button onClick={loadPlans} className="p-1 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center space-y-3 text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-white">No Schedule Conflicts Detected</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All shift assignments adhere to contractual rules, skill constraints, and rest day periods.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Plan Selector Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
              {plans.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                    selectedPlanIndex === idx
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {p.plan_name}
                </button>
              ))}
            </div>

            {currentPlan && (
              <div className="space-y-4">
                {/* Plan Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Disruption Score</span>
                    <span className="font-bold text-indigo-400 text-base">{currentPlan.disruption_score}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Conflicts Resolved</span>
                    <span className="font-bold text-emerald-400 text-base">{currentPlan.conflicts_resolved_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fairness Impact</span>
                    <span className="font-bold text-blue-400 text-base">{currentPlan.fairness_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Overtime Delta</span>
                    <span className="font-bold text-amber-400 text-base">+{currentPlan.overtime_delta_hours}h</span>
                  </div>
                </div>

                {/* Actions List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">Targeted Repair Actions ({currentPlan.actions.length})</h4>
                  <div className="space-y-2">
                    {currentPlan.actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              act.action_type === 'SWAP'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : act.action_type === 'REPLACE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {act.action_type}
                          </span>
                          <span className="font-mono text-slate-400">{act.date}</span>
                          <span className="text-slate-300 font-semibold">{act.shift_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="line-through text-slate-500">{act.original_worker_name || 'Unfilled'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold text-emerald-400">{act.target_worker_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Diagnostics Accordion */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-400" />
                    Decision Explainability & Diagnostics
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300/90 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Root Cause</span>
                      <p className="mt-0.5">{currentPlan.explainability.root_cause}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Reason Chosen</span>
                      <p className="mt-0.5">{currentPlan.explainability.reason_chosen}</p>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyPlan}
                    disabled={applying}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {applying ? 'Applying Repair...' : 'Apply Repair Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
