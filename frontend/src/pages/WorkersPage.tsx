import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, Edit, UserCheck, UserX } from 'lucide-react';
import { workerService } from '../services/apiServices';
import { Worker, WorkerCreate } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<WorkerCreate>({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    weekly_contract_hours: 40,
  });

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await workerService.getWorkers(false); // include inactive
      setWorkers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workerService.createWorker(formData);
      setIsModalOpen(false);
      setFormData({
        employee_number: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        weekly_contract_hours: 40,
      });
      loadWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create worker');
    }
  };

  const handleToggleActive = async (worker: Worker) => {
    try {
      if (worker.active) {
        await workerService.deleteWorker(worker.id);
      } else {
        await workerService.updateWorker(worker.id, { active: true });
      }
      loadWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update worker state');
    }
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.first_name.toLowerCase().includes(search.toLowerCase()) ||
      w.last_name.toLowerCase().includes(search.toLowerCase()) ||
      w.employee_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Worker Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage staff roster, contract hours, and availability rules</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Worker</span>
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or employee number..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching worker directory..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Emp #</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Contract Hours</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-400">
                      {worker.employee_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {worker.first_name} {worker.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{worker.email || worker.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{worker.weekly_contract_hours} hrs/wk</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={worker.active ? 'Active' : 'Inactive'} type="boolean" />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/workers/${worker.id}`)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(worker)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          worker.active
                            ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={worker.active ? 'Deactivate Worker' : 'Reactivate Worker'}
                      >
                        {worker.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Worker Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Worker">
        <form onSubmit={handleCreateWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Number</label>
            <input
              type="text"
              required
              value={formData.employee_number}
              onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              placeholder="EMP-1001"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Weekly Contract Hours</label>
            <input
              type="number"
              step="0.5"
              required
              value={formData.weekly_contract_hours}
              onChange={(e) => setFormData({ ...formData, weekly_contract_hours: parseFloat(e.target.value) })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
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
              Save Worker
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
