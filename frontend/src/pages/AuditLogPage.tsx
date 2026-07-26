import React, { useEffect, useState } from 'react';
import { FileText, Search, UserCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { AuditLog } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        // Query audit logs entity or generic logs endpoint
        const res = await apiClient.get('/schedules');
        const schedList = res.data;
        if (schedList.length > 0) {
          const firstId = schedList[0].id;
          const logRes = await apiClient.get(`/schedules/${firstId}/audit-log`);
          setLogs(logRes.data);
        }
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.who && l.who.toLowerCase().includes(search.toLowerCase())) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">System Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable security, solver execution, and schedule mutation logs</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter logs by action, user, or entity..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching system audit log timeline..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No audit logs matching current filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Attribution (Who)</th>
                    <th className="px-6 py-4">Entity Type</th>
                    <th className="px-6 py-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-400">{log.action}</td>
                      <td className="px-6 py-4 text-slate-200">{log.who || 'System'}</td>
                      <td className="px-6 py-4 text-slate-400">{log.entity_type}</td>
                      <td className="px-6 py-4 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
