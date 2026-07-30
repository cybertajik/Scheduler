import React, { useEffect, useState } from 'react';
import { Building2, Plus, Globe, Shield, User, CheckCircle, AlertCircle } from 'lucide-react';
import { organizationService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  require_employee_id: boolean;
  active: boolean;
  created_at: string;
}

export const OrganizationsManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    description: '',
    require_employee_id: true,
    top_manager_email: '',
    top_manager_password: '',
  });

  const loadData = async () => {
    try {
      const data = await organizationService.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.createOrganization(formData);
      setShowModal(false);
      setFormData({
        name: '',
        slug: '',
        domain: '',
        description: '',
        require_employee_id: true,
        top_manager_email: '',
        top_manager_password: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create organization');
    }
  };

  if (loading) return <LoadingSpinner label="Loading SaaS Organizations..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-400" />
            SaaS Organizations (Product Owner Portal)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-tenant organizations, domains, and assigned Top Managers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div key={org.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                org.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {org.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100">{org.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">slug: {org.slug}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Domain: <strong className="text-slate-200">{org.domain || 'Not set'}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>ID Mode: <strong className="text-slate-200">{org.require_employee_id ? 'Mandatory IDs' : 'Optional (Names Only)'}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100">Create New Organization</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Domain Name (e.g. acme.scheduler.local)</label>
                <input
                  type="text"
                  placeholder="acme.company.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-slate-200 mb-2">Assign Organization TOP Manager</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Manager Email</label>
                    <input
                      type="email"
                      placeholder="topmanager@acme.com"
                      value={formData.top_manager_email}
                      onChange={(e) => setFormData({ ...formData, top_manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.top_manager_password}
                      onChange={(e) => setFormData({ ...formData, top_manager_password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
