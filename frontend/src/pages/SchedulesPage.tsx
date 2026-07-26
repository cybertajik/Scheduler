import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Eye, Cpu, ArrowRight } from 'lucide-react';
import { scheduleService } from '../services/apiServices';
import { Schedule } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.createSchedule({ month, year });
      setIsModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create schedule period');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Schedule Periods</h1>
          <p className="text-sm text-slate-400 mt-1">Manage monthly duty rosters and trigger CP-SAT solver runs</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule Period</span>
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner label="Fetching schedule periods..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Generated Timestamp</th>
                  <th className="px-6 py-4">Solver Diagnostics</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-100">
                      {new Date(sched.year, sched.month - 1).toLocaleString('default', { month: 'long' })} {sched.year}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sched.status} type="schedule" />
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {sched.generated_at ? new Date(sched.generated_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {sched.solver_score || 'Not executed'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/schedules/${sched.id}`)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>Open Interactive View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Schedule Period">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Month (1 - 12)</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
              <input
                type="number"
                min="2024"
                max="2030"
                required
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Create Period
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
