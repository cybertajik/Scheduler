import React, { useEffect, useState, useCallback } from 'react';
import { Sliders, Globe, ShieldCheck, Check, AlertCircle, MapPin, Calendar, Flag, ChevronDown, Search, Plus, X } from 'lucide-react';
import { organizationService, holidayService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';
import { useHolidays } from '../context/HolidayContext';

interface CountryOption {
  code: string;
  name: string;
}

const DATE_FORMAT_LABELS: Record<string, string> = {
  'MM/DD/YYYY': '🇺🇸 MM/DD/YYYY — US format',
  'DD/MM/YYYY': '🇪🇺 DD/MM/YYYY — European format',
  'YYYY/MM/DD': '🗾 YYYY/MM/DD — ISO / East Asian format',
  'YYYY.MM.DD': '🇭🇺 YYYY.MM.DD — Hungarian format',
};

const COUNTRY_DATE_FORMATS: Record<string, string> = {
  US: 'MM/DD/YYYY', PH: 'MM/DD/YYYY',
  CN: 'YYYY/MM/DD', JP: 'YYYY/MM/DD', KR: 'YYYY/MM/DD',
  TW: 'YYYY/MM/DD', HU: 'YYYY.MM.DD',
};
const getDateFormat = (code: string) => COUNTRY_DATE_FORMATS[code] || 'DD/MM/YYYY';

const CountrySearchDropdown: React.FC<{
  value: string;
  onChange: (code: string) => void;
  countries: CountryOption[];
  placeholder: string;
  label: string;
}> = ({ value, onChange, countries, placeholder, label }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = countries.find(c => c.code === value);
  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
        <Flag className="w-3.5 h-3.5 text-amber-400" />
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 flex items-center justify-between hover:border-amber-500/50 transition-colors"
      >
        <span className={selected ? 'text-slate-100' : 'text-slate-500'}>
          {selected ? `${selected.code} — ${selected.name}` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800 rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.slice(0, 100).map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                  value === c.code ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'
                }`}
              >
                <span className="font-mono text-xs text-slate-400 w-8">{c.code}</span>
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-slate-500 text-sm">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganizationSettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { refreshHolidays } = useHolidays();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [showExtraCountry, setShowExtraCountry] = useState(false);
  const [previewHolidays, setPreviewHolidays] = useState<{ date: string; name: string; country: string }[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const loadData = async () => {
    try {
      const data = await organizationService.getCurrentOrganization();
      setOrg(data);
      setShowExtraCountry(!!data.extra_country_code);
    } catch (err) {
      console.error('Failed to load current org settings', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const data = await holidayService.getSupportedCountries();
      setCountries(data);
    } catch (e) {
      console.error('Failed to load countries', e);
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadPreviewHolidays = useCallback(async () => {
    if (!org?.country_code) { setPreviewHolidays([]); return; }
    setLoadingHolidays(true);
    try {
      const data = await holidayService.getOrgHolidays(new Date().getFullYear());
      setPreviewHolidays(data.slice(0, 8));
    } catch {
      setPreviewHolidays([]);
    } finally {
      setLoadingHolidays(false);
    }
  }, [org?.country_code, org?.extra_country_code]);

  useEffect(() => { loadData(); loadCountries(); }, []);
  useEffect(() => { loadPreviewHolidays(); }, [loadPreviewHolidays]);

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
        country_code: org.country_code || null,
        extra_country_code: showExtraCountry ? (org.extra_country_code || null) : null,
      });
      setOrg(updated);
      setMsg('Organization settings updated successfully!');
      setMsgType('success');
      // Refresh global holiday context so calendars update immediately
      await refreshHolidays();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Failed to update organization settings');
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Organization Settings..." />;

  const primaryDateFormat = org?.country_code ? getDateFormat(org.country_code) : null;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Sliders className="w-7 h-7 text-blue-400" />
          Organization Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure domain mappings, regional settings, and public holiday calendars
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 ${
          msgType === 'success'
            ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-600/10 border border-red-500/20 text-red-400'
        }`}>
          {msgType === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* General Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> General Settings
          </h2>

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
                If enabled, workers must have a unique Employee ID.
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
        </div>

        {/* ── Country & Public Holidays Card ── */}
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6 space-y-6 shadow-xl shadow-amber-500/5">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" /> Country & Public Holidays
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your organization's country to automatically mark public holidays in all schedule calendars with descriptions.
            </p>
          </div>

          {/* Primary Country */}
          {loadingCountries ? (
            <div className="text-slate-500 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              Loading countries...
            </div>
          ) : (
            <CountrySearchDropdown
              label="Primary Country"
              placeholder="Select primary country..."
              value={org?.country_code || ''}
              countries={countries}
              onChange={(code) => setOrg({ ...org, country_code: code })}
            />
          )}

          {/* Date Format Preview */}
          {org?.country_code && primaryDateFormat && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-400 font-semibold">Date Format</p>
                <p className="text-sm text-slate-200 font-mono">
                  {DATE_FORMAT_LABELS[primaryDateFormat] || primaryDateFormat}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule dates will follow this convention throughout the app.
                </p>
              </div>
            </div>
          )}

          {/* Additional Country Toggle */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Observe holidays from an additional country
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Useful for international teams — both countries' holidays appear on the calendar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExtraCountry(!showExtraCountry);
                  if (showExtraCountry) setOrg({ ...org, extra_country_code: null });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  showExtraCountry ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  showExtraCountry ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {showExtraCountry && (
              <CountrySearchDropdown
                label="Additional Country"
                placeholder="Select additional country..."
                value={org?.extra_country_code || ''}
                countries={countries.filter(c => c.code !== org?.country_code)}
                onChange={(code) => setOrg({ ...org, extra_country_code: code })}
              />
            )}
          </div>

          {/* Holiday Preview */}
          {org?.country_code && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Upcoming Holidays Preview ({new Date().getFullYear()})
              </h4>
              {loadingHolidays ? (
                <div className="text-slate-500 text-sm flex items-center gap-2 py-2">
                  <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Loading holidays...
                </div>
              ) : previewHolidays.length > 0 ? (
                <div className="space-y-1.5">
                  {previewHolidays.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-800/60 rounded-lg hover:bg-slate-800 transition-colors">
                      <span className="text-amber-400">🏖️</span>
                      <span className="text-xs font-mono text-slate-400 w-24 flex-shrink-0">{h.date}</span>
                      <span className="text-sm text-slate-200 flex-1">{h.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">{h.country}</span>
                    </div>
                  ))}
                  {previewHolidays.length === 8 && (
                    <p className="text-xs text-slate-500 text-center pt-1">+ more holidays visible in the calendar</p>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-sm py-2">
                  No holidays found for this selection. Save your country choice to load holidays.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
