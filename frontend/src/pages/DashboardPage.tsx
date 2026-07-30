import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ShieldAlert, Cpu, CheckCircle2, ArrowRight, AlertTriangle, Plus } from 'lucide-react';
import { workerService, scheduleService, ruleService } from '../services/apiServices';
import { Worker, Schedule, WorkerConstraint } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Modal } from '../components/Common/Modal';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rules, setRules] = useState<WorkerConstraint[]>([]);
  const [conflictsCount, setConflictsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Range Plan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(defaultEndStr);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [wData, sData, rData] = await Promise.all([
          workerService.getWorkers(true),
          scheduleService.getSchedules(),
          ruleService.getRules(undefined, true),
        ]);
        setWorkers(wData);
        setSchedules(sData);
        setRules(rData);

        // Fetch conflicts count across draft schedules
        let totalConflicts = 0;
        const draftScheds = sData.filter((s) => s.status === 'DRAFT');
        for (const sched of draftScheds.slice(0, 3)) {
          try {
            const report = await scheduleService.getConflicts(sched.id);
            if (report && report.hard_conflicts_count) {
              totalConflicts += report.hard_conflicts_count;
            }
          } catch {
            // Ignore individual fetch errors
          }
        }
        setConflictsCount(totalConflicts);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const targetDate = new Date(toDate);
      const targetMonth = targetDate.getMonth() + 1;
      const targetYear = targetDate.getFullYear();

      const newSched = await scheduleService.createSchedule({ month: targetMonth, year: targetYear });
      setIsModalOpen(false);
      navigate(`/schedules/${newSched.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create schedule plan');
    }
  };

  if (loading) return <LoadingSpinner label="Loading dashboard metrics..." />;

  const activeWorkersCount = workers.length;
  const draftSchedulesCount = schedules.filter((s) => s.status === 'DRAFT').length;
  const publishedSchedulesCount = schedules.filter((s) => s.status === 'PUBLISHED').length;
  const activeRulesCount = rules.length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('dashboard')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time constraint solver metrics and workforce scheduling overview
          </p>
        </div>
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={() => navigate('/schedules?view=list')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium border border-slate-700 transition-all"
          >
            {t('manage_schedules')}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('create_new_plan')}</span>
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Metrics Grid - 5 Compact Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tile 1: Active Workers */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('active_workers')}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">{activeWorkersCount}</p>
          <p className="text-[11px] text-slate-500">Available staff pool</p>
        </div>

        {/* Tile 2: Draft Schedules */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('draft_schedules')}</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">{draftSchedulesCount}</p>
          <p className="text-[11px] text-amber-400/80">Pending solver runs</p>
        </div>

        {/* Tile 3: Published Periods */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('published_periods')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">{publishedSchedulesCount}</p>
          <p className="text-[11px] text-emerald-400/80">Active duty rosters</p>
        </div>

        {/* Tile 4: Active Rules */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('active_rules')}</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">{activeRulesCount}</p>
          <p className="text-[11px] text-slate-500">Constraints enabled</p>
        </div>

        {/* Tile 5: RED Alert / Conflict Box */}
        <div className="p-5 bg-rose-950/30 border border-rose-500/50 rounded-2xl space-y-2 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">{t('alerts_conflicts')}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-rose-100">{conflictsCount}</p>
          <p className="text-[11px] text-rose-400/80 font-medium">
            {conflictsCount > 0 ? `${conflictsCount} hard constraint issues` : 'No active conflicts'}
          </p>
        </div>
      </div>

      {/* CP-SAT Solver Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Google OR-Tools CP-SAT Solver Engine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimizes headcount fulfillment, vacation ranges, night rest rules, and fair shift distribution
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/schedules')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
        >
          View Active Runs
        </button>
      </div>

      {/* Schedules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">{t('recent_schedule_periods')}</h3>
        </div>
        {schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No schedule periods found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">{t('period')}</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Solver Score</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {schedules.slice(0, 5).map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {new Date(sched.year, sched.month - 1).toLocaleString('default', { month: 'long' })} {sched.year}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sched.status} type="schedule" />
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {sched.solver_score || 'Not executed'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/schedules/${sched.id}`)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {t('inspect')} &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New Plan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Schedule Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <p className="text-xs text-slate-400">Select the date range for your new workforce duty roster plan.</p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">From Date (Start Date)</label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Defaulted to current date ({todayStr})</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">To Date (Target End Date)</label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Select your desired target schedule end date</span>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20"
            >
              Create Schedule Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

