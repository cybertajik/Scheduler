import React, { useState, useEffect } from 'react';
import { importExportService, scheduleService } from '../services/apiServices';
import { Schedule } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const ImportExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<string>('xlsx');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const data = await scheduleService.getSchedules();
      setSchedules(data);
      if (data.length > 0) setSelectedScheduleId(data[0].id);
    } catch (err: any) {
      setError('Failed to load schedules list for export.');
    }
  };

  const handleExportDownload = (url: string, defaultName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setValidationResult(null);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleValidateImport = async () => {
    if (!selectedFile) {
      setError('Please select a CSV or Excel file to import.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await importExportService.validateWorkersImport(selectedFile);
      setValidationResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Dry-run validation failed for selected file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || !validationResult.valid_records || validationResult.valid_records.length === 0) {
      setError('No valid records available to import.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await importExportService.commitWorkersImport(validationResult.valid_records);
      setSuccessMsg(res.message);
      setValidationResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to commit worker import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Data Import & Export Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bulk workforce data onboarding via CSV/Excel and multi-format schedule reporting
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'export' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Export Center 📤
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === 'import' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Import Wizard 📥
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedule Export Card */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📅 Schedule Roster Export
            </h2>
            <p className="text-slate-400 text-sm">
              Export generated shift fulfillments, assigned worker codes, and locked assignments.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Schedule</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      Schedule Period {s.month}/{s.year} (Status: {s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['xlsx', 'csv', 'json'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition border ${
                        exportFormat === fmt
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!selectedScheduleId}
                onClick={() =>
                  handleExportDownload(
                    importExportService.downloadScheduleExportUrl(selectedScheduleId, exportFormat),
                    `schedule_export.${exportFormat}`
                  )
                }
                className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                Download Schedule Export ({exportFormat.toUpperCase()})
              </button>
            </div>
          </div>

          {/* Quick Roster & Audit Exports */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              👥 Workforce & Audit Exports
            </h2>
            <p className="text-slate-400 text-sm">
              Quick one-click CSV data downloads for employee master files and security audit logs.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Employee Roster (.csv)</h3>
                  <p className="text-xs text-slate-400">All registered employees and department codes</p>
                </div>
                <button
                  onClick={() =>
                    handleExportDownload(importExportService.downloadWorkersExportUrl(), 'workers_export.csv')
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Export Employees CSV
                </button>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">System Audit Log (.csv)</h3>
                  <p className="text-xs text-slate-400">Security actions, manual schedule edits, and logins</p>
                </div>
                <button
                  onClick={() =>
                    handleExportDownload(importExportService.downloadAuditLogExportUrl(), 'audit_log_export.csv')
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Export Audit CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Employee Data Bulk Import Wizard</h2>
            <p className="text-slate-400 text-sm mt-1">
              Upload a `.csv` or `.xlsx` spreadsheet containing employee columns: <code className="text-indigo-300">Employee Code</code>, <code className="text-indigo-300">First Name</code>, <code className="text-indigo-300">Last Name</code>, <code className="text-indigo-300">Email</code>, <code className="text-indigo-300">Department</code>.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center space-y-4">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="block w-full max-w-md text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-emerald-400">Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            )}
            <button
              onClick={handleValidateImport}
              disabled={!selectedFile || loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Performing Dry-Run Validation...' : 'Run Dry-Run Validation 🔍'}
            </button>
          </div>

          {/* Validation Report */}
          {validationResult && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <h3 className="text-md font-bold text-white">Dry-Run Validation Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">Total Rows</span>
                  <p className="text-xl font-bold text-white mt-1">{validationResult.total_rows}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">Valid Records</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{validationResult.valid_count}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">Warnings (Duplicates)</span>
                  <p className="text-xl font-bold text-amber-400 mt-1">{validationResult.warnings_count}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">Validation Errors</span>
                  <p className="text-xl font-bold text-rose-400 mt-1">{validationResult.errors_count}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCommitImport}
                  disabled={importing || validationResult.valid_count === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {importing ? 'Committing Import...' : `Commit Import (${validationResult.valid_count} Records) 🚀`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportExportPage;
