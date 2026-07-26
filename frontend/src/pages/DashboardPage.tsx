import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ShieldAlert, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { workerService, scheduleService, ruleService } from '../services/apiServices';
import { Worker, Schedule, WorkerConstraint } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rules, setRules] = useState<WorkerConstraint[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

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
          <h1 className="text-2xl font-bold text-slate-100">Scheduling Operations Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time constraint solver metrics and workforce scheduling overview
          </p>
        </div>
        <button
          onClick={() => navigate('/schedules')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start md:self-auto"
        >
          <span>Manage Schedules</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Workers</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{activeWorkersCount}</p>
          <p className="text-xs text-slate-500">Available staff pool</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Draft Schedules</span>
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{draftSchedulesCount}</p>
          <p className="text-xs text-amber-400/80">Pending optimization</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Published Periods</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{publishedSchedulesCount}</p>
          <p className="text-xs text-emerald-400/80">Active duty schedules</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Rules</span>
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{activeRulesCount}</p>
          <p className="text-xs text-slate-500">Active hard & soft constraints</p>
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
          <h3 className="font-semibold text-slate-200">Recent Schedule Periods</h3>
        </div>
        {schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No schedule periods found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Period</th>
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
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
