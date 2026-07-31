import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Info,
  Layers,
  Cpu,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
  RefreshCw,
  X
} from 'lucide-react';
import { ComprehensiveDiagnostics } from '../../types';
import { scheduleService } from '../../services/apiServices';

interface DiagnosticsPanelProps {
  scheduleId: string;
  onClose?: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ scheduleId, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [diagnostics, setDiagnostics] = useState<ComprehensiveDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'constraints' | 'fixes' | 'telemetry'>('overview');

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleService.getScheduleDiagnostics(scheduleId);
      setDiagnostics(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load solver diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [scheduleId]);

  const handleExport = async () => {
    try {
      await scheduleService.downloadDiagnosticsExport(scheduleId);
    } catch (err) {
      alert('Failed to download diagnostics export.');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Analyzing solver decisions & constraint diagnostics...</p>
      </div>
    );
  }

  if (error || !diagnostics) {
    return (
      <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-6 text-rose-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          <h3 className="text-base font-semibold text-rose-100">Diagnostics Unavailable</h3>
        </div>
        <p className="text-sm text-rose-300/90 mb-4">{error || 'No diagnostics telemetry found for this schedule.'}</p>
        <button
          onClick={fetchDiagnostics}
          className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  const { solver_statistics, successful_diagnostics, failed_diagnostics, constraint_diagnostics, suggested_fixes } = diagnostics;

  const isSuccess = diagnostics.status === 'OPTIMAL' || diagnostics.status === 'FEASIBLE' || diagnostics.status === 'SUCCESS';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Solver Explainability & Diagnostics</h2>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {diagnostics.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engine Telemetry • Decision Breakdown • Constraint Analysis • Actionable Recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Diagnostics (.json)
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Overview & Performance
        </button>
        <button
          onClick={() => setActiveTab('constraints')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'constraints'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Constraint Breakdown ({constraint_diagnostics.length})
        </button>
        <button
          onClick={() => setActiveTab('fixes')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'fixes'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Suggested Fixes ({suggested_fixes.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Solver Statistics
        </button>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-1">Coverage Percentage</div>
              <div className="text-2xl font-bold text-emerald-400">
                {successful_diagnostics ? `${successful_diagnostics.coverage_percentage}%` : '0%'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {successful_diagnostics
                  ? `${successful_diagnostics.total_assigned_shifts} assigned / ${
                      successful_diagnostics.total_assigned_shifts + successful_diagnostics.unassigned_shifts
                    } required`
                  : 'Infeasible coverage'}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-1">Fairness Score</div>
              <div className="text-2xl font-bold text-indigo-400">
                {successful_diagnostics ? `${successful_diagnostics.fairness_score} / 100` : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Workload equity index</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-1">Total Overtime</div>
              <div className="text-2xl font-bold text-amber-400">
                {successful_diagnostics
                  ? `${successful_diagnostics.overtime_summary.total_overtime_hours}h`
                  : '0h'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {successful_diagnostics?.overtime_summary.employees_with_overtime_count || 0} employees affected
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-1">Solver Runtime</div>
              <div className="text-2xl font-bold text-sky-400">
                {solver_statistics.solver_runtime_seconds}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1">CP-SAT Wall time</div>
            </div>
          </div>

          {/* Failed Schedule Summary (if INFEASIBLE) */}
          {failed_diagnostics && (
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3 text-rose-300">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-semibold">Ranked Infeasibility Root Causes</h3>
              </div>
              <p className="text-xs text-rose-200/90">{failed_diagnostics.summary}</p>
              <div className="space-y-2">
                {failed_diagnostics.ranked_reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-4 p-3 bg-rose-900/20 border border-rose-800/40 rounded-lg text-xs"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-800 text-white mr-2">
                        {reason.severity}
                      </span>
                      <span className="font-semibold text-rose-100">{reason.reason}</span>
                      {reason.suggested_action && (
                        <p className="text-[11px] text-rose-300/80 mt-1">💡 Action: {reason.suggested_action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Charts */}
          {successful_diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekend Shift Distribution */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Weekend Shift Distribution Per Employee
                </h4>
                <div className="space-y-3">
                  {successful_diagnostics.weekend_distribution.slice(0, 6).map((item) => (
                    <div key={item.employee_id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{item.employee_name}</span>
                        <span className="font-semibold text-slate-200">{item.count} shifts</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (item.count / 8) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Night Shift Distribution */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Night Shift Recovery Distribution
                </h4>
                <div className="space-y-3">
                  {successful_diagnostics.night_shift_distribution.slice(0, 6).map((item) => (
                    <div key={item.employee_id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{item.employee_name}</span>
                        <span className="font-semibold text-slate-200">{item.count} night shifts</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (item.count / 6) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Constraint Breakdown */}
      {activeTab === 'constraints' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Active constraints evaluated during CP-SAT model building and optimization solving.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Constraint Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Conflicts</th>
                  <th className="p-3">Corrective Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {constraint_diagnostics.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{c.constraint_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.constraint_type === 'HARD'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {c.constraint_type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{c.category}</td>
                    <td className="p-3 font-mono text-slate-200">{c.number_of_conflicts}</td>
                    <td className="p-3 text-slate-300">
                      {c.suggested_corrective_actions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {c.suggested_corrective_actions.map((act, aIdx) => (
                            <li key={aIdx}>{act}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500">None required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Suggested Fixes */}
      {activeTab === 'fixes' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Ranked actionable recommendations to improve shift coverage, fairness, and resolve bottlenecks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggested_fixes.map((fix) => (
              <div key={fix.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-sm text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {fix.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                    Impact: {fix.impact_score}/10
                  </span>
                </div>
                <p className="text-xs text-slate-300/90">{fix.description}</p>
                <div className="text-[11px] text-slate-500 font-mono">Action Type: {fix.action_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Solver Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Variables Created</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.variables_created.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Constraints Built</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.constraints_created.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Memory Estimate</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.memory_estimate_mb} MB
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Branches Explored</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.branches_explored.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Conflicts Detected</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.conflicts_detected.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400">Objective Score</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {solver_statistics.objective_score.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
