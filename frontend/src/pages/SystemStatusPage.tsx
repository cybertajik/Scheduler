import React, { useEffect, useState } from 'react';
import { systemStatusService } from '../services/apiServices';
import { StatusBadge } from '../components/Common/StatusBadge';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const SystemStatusPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  
  const [health, setHealth] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [redisStats, setRedisStats] = useState<any>(null);
  const [celeryStats, setCeleryStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchStatus = async () => {
    setError(null);
    try {
      const [h, db, red, cel, met] = await Promise.all([
        systemStatusService.getHealthStatus(),
        systemStatusService.getDatabaseStats(),
        systemStatusService.getRedisStats(),
        systemStatusService.getCeleryStats(),
        systemStatusService.getSystemMetrics(),
      ]);
      setHealth(h);
      setDbStats(db);
      setRedisStats(red);
      setCeleryStats(cel);
      setMetrics(met);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch system diagnostic status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner label="Polling system status probes..." />;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            System Status & Observability Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time infrastructure health, queue metrics, and database latency
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Last updated: {lastRefreshed}</span>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition"
          >
            Refresh Diagnostics 🔄
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Gateway Health */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold">API Gateway</span>
            <StatusBadge status={health?.status === 'healthy' ? 'ACTIVE' : 'FAILED'} />
          </div>
          <p className="text-2xl font-bold text-white mt-3">FastAPI 3.12</p>
          <p className="text-xs text-slate-400 mt-1">v{health?.version || '1.0.0'}</p>
        </div>

        {/* PostgreSQL Database */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold">PostgreSQL 16</span>
            <StatusBadge status={dbStats?.status === 'connected' ? 'ACTIVE' : 'FAILED'} />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-3">{dbStats?.query_latency_ms || 0} ms</p>
          <p className="text-xs text-slate-400 mt-1">Query Latency | {dbStats?.user_count || 0} registered accounts</p>
        </div>

        {/* Redis Cache */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold">Redis Broker</span>
            <StatusBadge status={redisStats?.status === 'connected' ? 'ACTIVE' : 'OFFLINE'} />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-3">{redisStats?.used_memory_human || '0B'}</p>
          <p className="text-xs text-slate-400 mt-1">{redisStats?.connected_clients || 0} Connected Clients</p>
        </div>

        {/* Celery Worker Pool */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-semibold">Celery Workers</span>
            <StatusBadge status={celeryStats?.status === 'online' ? 'ACTIVE' : 'OFFLINE'} />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-3">{celeryStats?.workers_online_count || 0} Worker Nodes</p>
          <p className="text-xs text-slate-400 mt-1">{celeryStats?.active_tasks_count || 0} Active Solver Tasks</p>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-bold text-white">Workforce Data Metrics Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400">Total Staff Pool</span>
            <p className="text-xl font-bold text-white mt-1">{metrics?.total_workers || 0} Employees</p>
            <span className="text-xs text-emerald-400">{metrics?.active_workers || 0} Active</span>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400">Schedule Periods</span>
            <p className="text-xl font-bold text-white mt-1">{metrics?.total_schedules || 0} Schedules</p>
            <span className="text-xs text-slate-400">Generated & Drafts</span>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400">Persisted Shift Assignments</span>
            <p className="text-xl font-bold text-indigo-300 mt-1">{metrics?.total_assignments || 0} Assignments</p>
            <span className="text-xs text-indigo-400">Fulfillments</span>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400">System Users</span>
            <p className="text-xl font-bold text-white mt-1">{metrics?.total_users || 0} Users</p>
            <span className="text-xs text-purple-400">RBAC Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPage;
