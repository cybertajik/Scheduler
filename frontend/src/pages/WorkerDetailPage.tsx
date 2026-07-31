import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ShieldAlert, Calendar, Clock, UserCheck } from 'lucide-react';
import { workerService } from '../services/apiServices';
import { Worker, WorkerConstraint, ConstraintCreate, ConstraintType } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [rules, setRules] = useState<WorkerConstraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [ruleData, setRuleData] = useState<ConstraintCreate>({
    constraint_type: 'VACATION',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: 1,
    enabled: true,
  });

  const loadWorkerData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [w, r] = await Promise.all([
        workerService.getWorker(id),
        workerService.getWorkerRules(id),
      ]);
      setWorker(w);
      setRules(r);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, [id]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await workerService.createWorkerRule(id, ruleData);
      setIsModalOpen(false);
      loadWorkerData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add rule');
    }
  };

  if (loading) return <LoadingSpinner label="Loading employee profile..." />;
  if (!worker) return <ErrorBanner message="Employee not found" />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/workers')}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employees Directory</span>
      </button>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Header Profile Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xl text-blue-400">
            {worker.first_name[0]}{worker.last_name[0]}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-100">{worker.first_name} {worker.last_name}</h1>
              <StatusBadge status={worker.active ? 'Active' : 'Inactive'} type="boolean" />
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">Employee ID: {worker.employee_number}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Weekly Target</span>
            <span className="font-semibold text-slate-200">{worker.weekly_contract_hours} Hours</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Contact</span>
            <span className="font-semibold text-slate-200">{worker.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Rules / Availability Constraints Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-200">Availability & Vacation Constraints</h3>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Constraint</span>
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No specific unavailability rules registered for this employee.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={rule.constraint_type} type="constraint" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{rule.constraint_type}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {rule.start_date} &rarr; {rule.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-400">Priority: {rule.priority}</span>
                  <StatusBadge status={rule.enabled ? 'Enabled' : 'Disabled'} type="boolean" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Employee Rule / Vacation">
        <form onSubmit={handleAddRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Constraint Type</label>
            <select
              value={ruleData.constraint_type}
              onChange={(e) => setRuleData({ ...ruleData, constraint_type: e.target.value as ConstraintType })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            >
              <option value="VACATION">VACATION</option>
              <option value="UNAVAILABLE_DATE">UNAVAILABLE DATE</option>
              <option value="UNAVAILABLE_RANGE">UNAVAILABLE RANGE</option>
              <option value="NO_WEEKENDS">NO WEEKENDS</option>
              <option value="NO_NIGHTS">NO NIGHTS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={ruleData.start_date}
                onChange={(e) => setRuleData({ ...ruleData, start_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                required
                value={ruleData.end_date}
                onChange={(e) => setRuleData({ ...ruleData, end_date: e.target.value })}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
