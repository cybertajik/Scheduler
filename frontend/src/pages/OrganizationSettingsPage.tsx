import React, { useEffect, useState } from 'react';
import { Sliders, Globe, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { organizationService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const OrganizationSettingsPage: React.FC = () => {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const data = await organizationService.getCurrentOrganization();
      setOrg(data);
    } catch (err) {
      console.error('Failed to load current org settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const updated = await organizationService.updateCurrentOrganization({
        name: org.name,
        domain: org.domain,
        description: org.description,
        require_employee_id: org.require_employee_id,
      });
      setOrg(updated);
      setMsg('Organization settings updated successfully!');
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Organization Settings..." />;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Sliders className="w-7 h-7 text-blue-400" />
          Organization Settings (TOP Manager Control)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure domain mappings and toggle Employee ID requirement preferences
        </p>
      </div>

      {msg && (
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Org Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
          <input
            type="text"
            required
            value={org?.name || ''}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Custom Domain */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Custom Web Domain Mapping
          </label>
          <input
            type="text"
            placeholder="e.g. org1.scheduler.local or company.com"
            value={org?.domain || ''}
            onChange={(e) => setOrg({ ...org, domain: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Users accessing this web domain will be automatically directed to this organization.
          </p>
        </div>

        {/* Toggle Employee ID requirement */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Require Employee ID</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              If enabled, workers must have a unique Employee ID. If disabled, managers can add workers using just names (e.g. John Smith).
            </p>
          </div>
          <input
            type="checkbox"
            checked={org?.require_employee_id ?? true}
            onChange={(e) => setOrg({ ...org, require_employee_id: e.target.checked })}
            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
          <textarea
            rows={3}
            value={org?.description || ''}
            onChange={(e) => setOrg({ ...org, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
