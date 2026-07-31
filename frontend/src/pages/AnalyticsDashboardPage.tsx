import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  Activity,
  Users,
  ShieldAlert,
  Download,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Building2,
  TrendingUp,
  Layers,
  Filter,
  Search,
  Zap,
  Calendar
} from 'lucide-react';
import {
  OperationalOverview,
  SystemHealth,
  EmployeeAnalyticsItem,
  DepartmentAnalyticsItem,
  HistoricalTrends,
  OperationalAlertItem
} from '../types';
import { analyticsService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const AnalyticsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HEALTH' | 'EMPLOYEES' | 'DEPARTMENTS' | 'TRENDS' | 'ALERTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState<OperationalOverview | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [empAnalytics, setEmpAnalytics] = useState<EmployeeAnalyticsItem[]>([]);
  const [deptAnalytics, setDeptAnalytics] = useState<DepartmentAnalyticsItem[]>([]);
  const [trends, setTrends] = useState<HistoricalTrends | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlertItem[]>([]);

  const [granularity, setGranularity] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [empSearch, setEmpSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ovData, sysHealth, empData, deptData, trendData, alertData] = await Promise.all([
        analyticsService.getOperationalDashboard(),
        analyticsService.getSystemHealth(),
        analyticsService.getEmployeeAnalytics(),
        analyticsService.getDepartmentAnalytics(),
        analyticsService.getHistoricalTrends(granularity),
        analyticsService.getAlerts()
      ]);
      setOverview(ovData);
      setHealth(sysHealth);
      setEmpAnalytics(empData);
      setDeptAnalytics(deptData);
      setTrends(trendData);
      setAlerts(alertData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load analytics dashboard.');
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = (fmt: string) => {
    analyticsService.downloadReport(fmt);
  };

  const filteredEmployees = empAnalytics.filter(e =>
    e.worker_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.department_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.employee_number.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Operational Dashboard & Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workforce control center, infrastructure health diagnostics, employee workload, and historical trends.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 transition-colors"
            title="Refresh Real-time Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => handleExport('PDF')}
              className="px-3 py-1.5 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              PDF
            </button>
            <button
              onClick={() => handleExport('EXCEL')}
              className="px-3 py-1.5 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel
            </button>
            <button
              onClick={() => handleExport('CSV')}
              className="px-3 py-1.5 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'OVERVIEW', label: 'Operational Overview', icon: Activity },
          { id: 'HEALTH', label: 'System Health', icon: Server },
          { id: 'EMPLOYEES', label: 'Employee Analytics', icon: Users },
          { id: 'DEPARTMENTS', label: 'Department Analytics', icon: Building2 },
          { id: 'TRENDS', label: 'Historical Trends', icon: TrendingUp },
          { id: 'ALERTS', label: `Operational Alerts (${alerts.length})`, icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* TAB 1: OPERATIONAL OVERVIEW */}
          {activeTab === 'OVERVIEW' && overview && (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Today's Coverage</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {overview.current_coverage_percentage}%
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Scheduled: {overview.staffing_status.scheduled_workers_today}</span>
                    <span>Required: {overview.staffing_status.required_workers_today}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Active Workers</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {overview.staffing_status.active_workers}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Total Employees: {overview.staffing_status.total_workers}</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Open Shifts Today</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 tracking-tight">
                    {overview.staffing_status.open_shifts_today}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Unfilled: {overview.staffing_status.unfilled_shifts_today}</span>
                    <span>Drafts: {overview.draft_schedules}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Published Schedules</span>
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {overview.published_schedules}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Total: {overview.total_schedules}</span>
                    <span>Users: {overview.active_users_count}</span>
                  </div>
                </div>
              </div>

              {/* Audit Stream */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Recent System Audit Events
                </h3>
                <div className="divide-y divide-slate-800/80 bg-slate-950 rounded-xl border border-slate-800/80">
                  {overview.recent_audit_events.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">No recent audit events logged.</div>
                  ) : (
                    overview.recent_audit_events.map(evt => (
                      <div key={evt.id} className="p-3 flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-indigo-400 font-bold">
                            {evt.action}
                          </span>
                          <span>{evt.entity_type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM HEALTH */}
          {activeTab === 'HEALTH' && health && (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between shadow-xl ${
                  health.overall_status === 'HEALTHY'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : health.overall_status === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <h3 className="text-base font-bold text-white">System Infrastructure Status: {health.overall_status}</h3>
                    <p className="text-xs text-slate-300/80 mt-0.5">
                      All core microservices, background task workers, database connection pools, and backups are monitored.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white">
                  Backup: {health.backup_status}
                </span>
              </div>

              {/* Resource Utilization Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      CPU Utilization
                    </span>
                    <span className="font-bold text-white">{health.cpu_usage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full transition-all" style={{ width: `${health.cpu_usage_pct}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      RAM Memory Usage
                    </span>
                    <span className="font-bold text-white">{health.memory_usage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${health.memory_usage_pct}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      Disk Capacity
                    </span>
                    <span className="font-bold text-white">{health.disk_usage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${health.disk_usage_pct}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Service Probes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[health.database, health.redis_cache, health.celery_queue, health.api_gateway].map((svc, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{svc.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 uppercase">
                        {svc.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{svc.details}</p>
                    <div className="text-[10px] text-slate-500 pt-1 font-mono">Ping Latency: {svc.response_time_ms} ms</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYEE ANALYTICS */}
          {activeTab === 'EMPLOYEES' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search employees by name, department, or number..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Employee Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Emp #</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Shifts</th>
                      <th className="p-3">Worked Hours</th>
                      <th className="p-3">Night Shifts</th>
                      <th className="p-3">Weekend Shifts</th>
                      <th className="p-3">Overtime</th>
                      <th className="p-3">Fairness Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.worker_id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono text-slate-400">{emp.employee_number}</td>
                        <td className="p-3 font-bold text-white">{emp.worker_name}</td>
                        <td className="p-3 text-slate-300">{emp.department_name}</td>
                        <td className="p-3 font-semibold text-indigo-400">{emp.assigned_shifts_count}</td>
                        <td className="p-3 text-slate-300">{emp.total_worked_hours}h</td>
                        <td className="p-3 text-amber-400">{emp.night_shifts_count}</td>
                        <td className="p-3 text-blue-400">{emp.weekend_shifts_count}</td>
                        <td className="p-3 font-semibold text-rose-400">{emp.overtime_hours}h</td>
                        <td className="p-3 font-bold text-emerald-400">{emp.fairness_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENT ANALYTICS */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deptAnalytics.map(dept => (
                <div key={dept.department_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{dept.department_name}</h3>
                      <span className="text-xs text-slate-400">{dept.active_staff_count} Active Employees</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                      {dept.coverage_percentage}% Coverage
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                    <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase block">Shifts Assigned</span>
                      <span className="font-bold text-indigo-400 text-sm">{dept.total_assigned_shifts}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase block">Overtime Hours</span>
                      <span className="font-bold text-amber-400 text-sm">{dept.total_overtime_hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: HISTORICAL TRENDS */}
          {activeTab === 'TRENDS' && trends && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Historical Workforce Trends
                </h3>
                <div className="flex gap-2">
                  {['WEEKLY', 'MONTHLY', 'YEARLY'].map(g => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g as any)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        granularity === g
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trend Points Visualization Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trends.trends.map((t, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs">{t.period_label}</span>
                      <span className="text-xs font-bold text-emerald-400">{t.coverage_pct}% Coverage</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Overtime</span>
                        <span className="font-bold text-amber-400">{t.overtime_hours}h</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Nights</span>
                        <span className="font-bold text-blue-400">{t.night_shifts_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Fairness</span>
                        <span className="font-bold text-indigo-400">{t.fairness_score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: OPERATIONAL ALERTS */}
          {activeTab === 'ALERTS' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No Active System Alerts</h3>
                  <p className="text-xs text-slate-500 mt-1">All workforce staffing coverage and system health parameters are normal.</p>
                </div>
              ) : (
                alerts.map(alt => (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-2xl border space-y-2 shadow-lg ${
                      alt.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : alt.severity === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <AlertTriangle className="w-4 h-4" />
                        {alt.title}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300/90">{alt.message}</p>
                    {alt.suggested_action && (
                      <div className="text-[11px] text-slate-400 pt-1 font-mono">
                        Suggested Action: {alt.suggested_action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
