import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Play,
  GitCompare,
  ArrowUpRight,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Clock,
  Sparkles,
  History,
  X,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  SandboxSchedule,
  Schedule,
  Worker,
  ScheduleComparison,
  SandboxSimulationRequest,
  SandboxVersionItem
} from '../types';
import { sandboxService, scheduleService, workerService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { NotificationToast, NotificationType } from '../components/Common/NotificationToast';

export const SandboxPage: React.FC = () => {
  const [sandboxes, setSandboxes] = useState<SandboxSchedule[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: NotificationType; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedSandbox, setSelectedSandbox] = useState<SandboxSchedule | null>(null);
  const [comparison, setComparison] = useState<ScheduleComparison | null>(null);
  const [versionHistory, setVersionHistory] = useState<SandboxVersionItem[]>([]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    parent_schedule_id: '',
    name: '',
    description: '',
    scenario_type: 'SICK_CALL'
  });

  // Simulation Form State
  const [simForm, setSimForm] = useState<SandboxSimulationRequest>({
    scenario_type: 'SICK_CALL',
    employee_id: '',
    dates: [new Date().toISOString().split('T')[0]],
    notes: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sbList, schedList, wrkList] = await Promise.all([
        sandboxService.getSandboxes(),
        scheduleService.getSchedules(),
        workerService.getWorkers(true)
      ]);
      setSandboxes(sbList);
      setSchedules(schedList);
      setWorkers(wrkList);
      if (schedList.length > 0 && !createForm.parent_schedule_id) {
        setCreateForm((prev) => ({ ...prev, parent_schedule_id: schedList[0].id }));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load sandbox data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Sandbox
  const handleCreateSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name) return;
    try {
      await sandboxService.createSandbox(createForm);
      setToast({ type: 'success', message: `Sandbox '${createForm.name}' created successfully.` });
      setIsCreateModalOpen(false);
      setCreateForm({ parent_schedule_id: schedules[0]?.id || '', name: '', description: '', scenario_type: 'SICK_CALL' });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create sandbox.');
    }
  };

  // Run Simulation
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSandbox) return;
    try {
      const res = await sandboxService.runSimulation(selectedSandbox.id, simForm);
      setToast({ type: 'success', message: `Simulation completed: ${res.details}` });
      setIsSimulateModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to run simulation.');
    }
  };

  // Open Compare Modal
  const handleOpenCompare = async (sb: SandboxSchedule) => {
    setSelectedSandbox(sb);
    if (!sb.parent_schedule_id) {
      setError('Selected sandbox does not have a linked parent schedule for comparison.');
      return;
    }
    try {
      const comp = await sandboxService.compareSchedules(sb.id, sb.parent_schedule_id);
      setComparison(comp);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate comparison.');
    }
  };

  // Promote Sandbox
  const handlePromoteSandbox = async () => {
    if (!selectedSandbox) return;
    try {
      const res = await sandboxService.promoteSandbox(selectedSandbox.id);
      setToast({ type: 'success', message: res.message });
      setIsPromoteModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to promote sandbox to production.');
    }
  };

  // Actions
  const handleClone = async (id: string) => {
    try {
      await sandboxService.cloneSandbox(id);
      setToast({ type: 'success', message: 'Sandbox duplicated.' });
      loadData();
    } catch (err: any) {
      setError('Failed to clone sandbox.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await sandboxService.archiveSandbox(id);
      setToast({ type: 'info', message: 'Sandbox archived.' });
      loadData();
    } catch (err: any) {
      setError('Failed to archive sandbox.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this sandbox permanently?')) return;
    try {
      await sandboxService.deleteSandbox(id);
      setToast({ type: 'warning', message: 'Sandbox deleted.' });
      loadData();
    } catch (err: any) {
      setError('Failed to delete sandbox.');
    }
  };

  const handleViewHistory = async (sb: SandboxSchedule) => {
    setSelectedSandbox(sb);
    try {
      const history = await sandboxService.getVersionHistory(sb.id);
      setVersionHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      setError('Failed to load version history.');
    }
  };

  const filteredSandboxes = sandboxes.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.scenario_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Boxes className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Schedule Sandbox & Scenario Planning</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Safely simulate employee sickness, vacations, staffing changes, and rule modifications in isolated environments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Sandbox Scenario
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {toast && <NotificationToast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search scenarios by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'DRAFT', 'SIMULATED', 'PROMOTED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sandboxes Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredSandboxes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-200">No Sandbox Scenarios Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Create an isolated sandbox schedule to simulate employee sickness, vacations, or staffing changes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSandboxes.map((sb) => (
            <div
              key={sb.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{sb.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sb.description || 'Custom planning scenario'}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      sb.status === 'PROMOTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : sb.status === 'SIMULATED'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : sb.status === 'ARCHIVED'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {sb.status}
                  </span>
                </div>

                {/* Scenario Badge & Metrics */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-950 text-indigo-300 rounded font-mono border border-slate-800">
                    Scenario: {sb.scenario_type || 'CUSTOM'}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded font-mono border border-slate-800">
                    v{sb.version}
                  </span>
                  <span className="text-slate-400">By {sb.author_name}</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Coverage</span>
                    <span className="font-bold text-emerald-400">{sb.coverage_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Period</span>
                    <span className="font-semibold text-slate-300">
                      {sb.month}/{sb.year}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Shifts</span>
                    <span className="font-semibold text-slate-300">{sb.total_assignments}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedSandbox(sb);
                      setIsSimulateModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Simulate
                  </button>

                  <button
                    onClick={() => handleOpenCompare(sb)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare Diff
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-slate-400">
                  <button
                    onClick={() => {
                      setSelectedSandbox(sb);
                      setIsPromoteModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Promote
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewHistory(sb)}
                      className="p-1 hover:text-white rounded"
                      title="Version History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClone(sb.id)}
                      className="p-1 hover:text-white rounded"
                      title="Clone Sandbox"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(sb.id)}
                      className="p-1 hover:text-amber-400 rounded"
                      title="Archive Sandbox"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sb.id)}
                      className="p-1 hover:text-rose-400 rounded"
                      title="Delete Sandbox"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Sandbox Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                Create New Sandbox Scenario
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSandbox} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Base Production Schedule</label>
                <select
                  value={createForm.parent_schedule_id}
                  onChange={(e) => setCreateForm({ ...createForm, parent_schedule_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      Schedule: {s.month}/{s.year} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Scenario Title</label>
                <input
                  type="text"
                  placeholder="e.g. August Peak Season Staffing Plan"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Scenario Type</label>
                <select
                  value={createForm.scenario_type}
                  onChange={(e) => setCreateForm({ ...createForm, scenario_type: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="SICK_CALL">Employee Sick Call Simulation</option>
                  <option value="VACATION_REQUEST">Approved Vacation Request</option>
                  <option value="STAFF_SHORTAGE">Staff Shortage / Headcount Reduction</option>
                  <option value="EXTRA_STAFF">Extra Staffing Capacity</option>
                  <option value="RULE_MODIFICATION">Rule & Constraint Modification</option>
                  <option value="CUSTOM">Custom Planning Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional planning notes and hypotheses..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 shadow-md"
                >
                  Create Isolated Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulation Controls Modal */}
      {isSimulateModalOpen && selectedSandbox && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-400" />
                Run Simulation for '{selectedSandbox.name}'
              </h3>
              <button onClick={() => setIsSimulateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Simulation Type</label>
                <select
                  value={simForm.scenario_type}
                  onChange={(e) => setSimForm({ ...simForm, scenario_type: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="SICK_CALL">Employee Sick Call</option>
                  <option value="VACATION_REQUEST">Vacation Request</option>
                  <option value="STAFF_SHORTAGE">Staff Shortage / Headcount Reduction</option>
                  <option value="EXTRA_STAFF">Extra Staffing Capacity</option>
                </select>
              </div>

              {(simForm.scenario_type === 'SICK_CALL' || simForm.scenario_type === 'VACATION_REQUEST') && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Employee</label>
                  <select
                    value={simForm.employee_id}
                    onChange={(e) => setSimForm({ ...simForm, employee_id: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="">-- Select Employee --</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.first_name} {w.last_name} ({w.employee_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={simForm.dates[0] || ''}
                  onChange={(e) => setSimForm({ ...simForm, dates: [e.target.value] })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Simulation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Reasoning for simulation..."
                  value={simForm.notes}
                  onChange={(e) => setSimForm({ ...simForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 shadow-md"
                >
                  Execute Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Comparison Diff Viewer */}
      {isCompareModalOpen && comparison && selectedSandbox && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-blue-400" />
                  Schedule Comparison: Production vs Sandbox '{selectedSandbox.name}'
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual diff highlighting added, removed, and reassigned shifts
                </p>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Delta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Changes</span>
                <div className="text-xl font-bold text-white mt-1">{comparison.total_changes_count}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Coverage Delta</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {comparison.metrics_summary.coverage_delta >= 0 ? '+' : ''}
                  {comparison.metrics_summary.coverage_delta}%
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Overtime Delta</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {comparison.metrics_summary.overtime_delta >= 0 ? '+' : ''}
                  {comparison.metrics_summary.overtime_delta}h
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Unfilled Delta</span>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {comparison.metrics_summary.unfilled_delta >= 0 ? '+' : ''}
                  {comparison.metrics_summary.unfilled_delta}
                </div>
              </div>
            </div>

            {/* Assignment Diffs Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Assignment Differences ({comparison.assignment_diffs.length})</h4>
              {comparison.assignment_diffs.length === 0 ? (
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                  No shift assignment differences detected between production schedule and sandbox.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Change</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Shift Type</th>
                        <th className="p-3">Original Worker</th>
                        <th className="p-3">Sandbox Worker</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950">
                      {comparison.assignment_diffs.map((diff, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                diff.change_type === 'ADDED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : diff.change_type === 'REMOVED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {diff.change_type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-white">{diff.date}</td>
                          <td className="p-3 text-slate-200">{diff.shift_name}</td>
                          <td className="p-3 text-slate-400">{diff.original_worker_name || '-'}</td>
                          <td className="p-3 font-semibold text-indigo-300">{diff.sandbox_worker_name || '-'}</td>
                          <td className="p-3 text-slate-400">{diff.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promotion Approval Modal */}
      {isPromoteModalOpen && selectedSandbox && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Sandbox Promotion</h3>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              Promoting sandbox <strong className="text-white">'{selectedSandbox.name}'</strong> (v{selectedSandbox.version}) will replace the live assignments in the production schedule. This operation will be logged in audit trail.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteSandbox}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs shadow-md"
              >
                Promote to Production
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {isHistoryModalOpen && selectedSandbox && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Version History for '{selectedSandbox.name}'
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {versionHistory.map((ver) => (
                <div key={ver.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-mono font-bold text-indigo-300">v{ver.version_number}</span>
                    <span className="text-[10px]">{new Date(ver.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{ver.change_description}</p>
                  <span className="text-[10px] text-slate-500 block">Author: {ver.author_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
