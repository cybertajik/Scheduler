import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, UserCheck, UserX, DollarSign, Clock } from 'lucide-react';
import { workerService, organizationService } from '../services/apiServices';
import { Worker, WorkerCreate } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { useLanguage } from '../context/LanguageContext';

export const WorkersPage: React.FC = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orgSettings, setOrgSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<any>({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    weekly_contract_hours: 40,
    contract_type: 'HOURLY',
    hourly_rate: '',
    monthly_salary: '',
  });

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const [wData, orgData] = await Promise.all([
        workerService.getWorkers(false),
        organizationService.getCurrentOrganization().catch(() => null),
      ]);
      setWorkers(wData);
      setOrgSettings(orgData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch employees');
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
      await workerService.createWorker({
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        monthly_salary: formData.monthly_salary ? parseFloat(formData.monthly_salary) : undefined,
      });
      setIsModalOpen(false);
      setFormData({
        employee_number: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        weekly_contract_hours: 40,
        contract_type: 'HOURLY',
        hourly_rate: '',
        monthly_salary: '',
      });
      loadWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create employee');
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
      setError(err.response?.data?.detail || 'Failed to update employee status');
    }
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.first_name.toLowerCase().includes(search.toLowerCase()) ||
      w.last_name.toLowerCase().includes(search.toLowerCase()) ||
      (w.employee_number && w.employee_number.toLowerCase().includes(search.toLowerCase()))
  );

  const requireEmpId = orgSettings?.require_employee_id ?? true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('workers')}</h1>
          <p className="text-sm text-slate-400 mt-1">Manage employee roster, contract type, and contact details</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
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
          placeholder="Search by name or ID..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching employee directory..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">{t('employee_id')}</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">{t('contract_type')}</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-400">
                      {worker.employee_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {worker.first_name} {worker.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{worker.email || worker.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                        {(worker as any).contract_type === 'SALARY' ? (
                          <>
                            <DollarSign className="w-3 h-3 text-emerald-400" /> Salary
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-blue-400" /> Hourly
                          </>
                        )}
                      </span>
                    </td>
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
                        title={worker.active ? 'Deactivate Employee' : 'Reactivate Employee'}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Employee">
        <form onSubmit={handleCreateWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('employee_id')} {requireEmpId ? `(${t('required')})` : `(${t('optional')})`}
            </label>
            <input
              type="text"
              required={requireEmpId}
              value={formData.employee_number}
              onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              placeholder={requireEmpId ? 'EMP-1001' : 'Optional (Leave blank if none)'}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="John"
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
                placeholder="Smith"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="john.smith@company.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 555-0192"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contract Type</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              >
                <option value="HOURLY">Hourly Rate</option>
                <option value="SALARY">Fixed Salary</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formData.contract_type === 'SALARY' ? 'Monthly Salary ($)' : 'Hourly Rate ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={formData.contract_type === 'SALARY' ? '4500' : '25.00'}
                value={formData.contract_type === 'SALARY' ? formData.monthly_salary : formData.hourly_rate}
                onChange={(e) =>
                  formData.contract_type === 'SALARY'
                    ? setFormData({ ...formData, monthly_salary: e.target.value })
                    : setFormData({ ...formData, hourly_rate: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm font-mono"
              />
            </div>
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
              Save Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
