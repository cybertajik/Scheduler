import React, { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, Power } from 'lucide-react';
import { ruleService, workerService } from '../services/apiServices';
import { WorkerConstraint, Worker } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<WorkerConstraint[]>([]);
  const [workers, setWorkers] = useState<Record<string, Worker>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRules = async () => {
    try {
      setLoading(true);
      const [rulesData, workersData] = await Promise.all([
        ruleService.getRules(),
        workerService.getWorkers(false),
      ]);
      setRules(rulesData);

      const workerMap: Record<string, Worker> = {};
      workersData.forEach((w) => {
        workerMap[w.id] = w;
      });
      setWorkers(workerMap);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = async (rule: WorkerConstraint) => {
    try {
      await ruleService.updateRule(rule.id, { enabled: !rule.enabled });
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await ruleService.deleteRule(id);
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Global Scheduling Rules & Constraints</h1>
          <p className="text-sm text-slate-400 mt-1">Review active worker unavailability rules, vacations, and hard constraints</p>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner label="Fetching rules matrix..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Worker</th>
                  <th className="px-6 py-4">Constraint Type</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rules.map((rule) => {
                  const worker = workers[rule.worker_id];
                  return (
                    <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-100">
                        {worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown Worker'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={rule.constraint_type} type="constraint" />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {rule.start_date} &rarr; {rule.end_date}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300">{rule.priority}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={rule.enabled ? 'Active' : 'Disabled'} type="boolean" />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            rule.enabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-500 hover:bg-slate-800'
                          }`}
                          title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
