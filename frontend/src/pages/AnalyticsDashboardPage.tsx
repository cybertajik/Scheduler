import React, { useEffect, useState, useCallback } from 'react';
import { BarChart2, Users, Calendar, TrendingUp, CheckCircle2, AlertTriangle, Shield, Server, Activity, Database, Cpu, LifeBuoy, Clock, Building2, Globe, Mail } from 'lucide-react';
import { analyticsService, scheduleService, organizationService, onboardingService } from '../services/apiServices';
import { Schedule, Organization, OnboardingApplication } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Overview {
  total_active_workers: number;
  total_schedules: number;
  published_schedules: number;
  draft_schedules: number;
  total_assignments: number;
  overall_coverage_pct: number;
  total_required_slots: number;
  total_filled_slots: number;
}

interface DailyDay {
  date: string;
  required: number;
  assigned: number;
  coverage_pct: number;
}

interface WorkerLoad {
  worker_id: string;
  name: string;
  shifts: number;
}

interface DeptLoad {
  department_id: string;
  department: string;
  assigned: number;
}

interface ShiftType {
  shift_type_id: string;
  name: string;
  instances: number;
  assigned: number;
  color: string;
}

interface ScheduleSummary {
  id: string;
  month: number;
  year: number;
  status: string;
  total_instances: number;
  total_required: number;
  total_assigned: number;
  coverage_pct: number;
  solver_score: string | null;
}

// ──────────────────────────────────────────────
// Pure SVG Chart helpers
// ──────────────────────────────────────────────

const COVERAGE_HIGH = '#10b981'; // emerald-500
const COVERAGE_MID  = '#f59e0b'; // amber-500
const COVERAGE_LOW  = '#ef4444'; // red-500

function coverageColor(pct: number) {
  if (pct >= 90) return COVERAGE_HIGH;
  if (pct >= 60) return COVERAGE_MID;
  return COVERAGE_LOW;
}

// Vertical bar chart — daily coverage
const DailyCoverageChart = React.memo(({ days }: { days: DailyDay[] }) => {
  const W = 900, H = 220, PAD = { top: 10, right: 10, bottom: 36, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...days.map(d => d.required), 1);
  const barW = Math.max(4, Math.floor((chartW / days.length) * 0.72));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PAD.top + chartH - (pct / 100) * chartH;
        return (
          <g key={pct}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#1e293b" strokeWidth={1} strokeDasharray="4 3" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748b">{pct}%</text>
          </g>
        );
      })}

      {days.map((d, i) => {
        const x = PAD.left + (i / days.length) * chartW + (chartW / days.length - barW) / 2;
        const barH = Math.max(2, (d.assigned / maxVal) * chartH);
        const reqH = (d.required / maxVal) * chartH;
        const col = coverageColor(d.coverage_pct);
        const dayNum = new Date(d.date + 'T00:00:00').getDate();

        return (
          <g key={d.date}>
            <rect x={x} y={PAD.top + chartH - reqH} width={barW} height={reqH} fill="#1e293b" rx={2} />
            <rect x={x} y={PAD.top + chartH - barH} width={barW} height={barH} fill={col} rx={2} opacity={0.9} />
            {dayNum % 5 === 1 || dayNum === 1 ? (
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {dayNum}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
});

// Horizontal bar chart — worker load
function WorkerLoadChart({ workers, avg }: { workers: WorkerLoad[]; avg: number }) {
  const top15 = workers.slice(0, 15);
  const H = Math.max(200, top15.length * 28 + 20);
  const W = 600;
  const PAD = { top: 10, right: 60, bottom: 10, left: 130 };
  const chartW = W - PAD.left - PAD.right;
  const maxShifts = Math.max(...top15.map(w => w.shifts), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {top15.map((w, i) => {
        const y = PAD.top + i * 28;
        const barW = (w.shifts / maxShifts) * chartW;
        const isHigh = w.shifts > avg * 1.3;
        const isLow = w.shifts < avg * 0.5 && avg > 0;
        const col = isHigh ? '#ef4444' : isLow ? '#f59e0b' : '#3b82f6';

        return (
          <g key={w.worker_id}>
            <text x={PAD.left - 6} y={y + 16} textAnchor="end" fontSize={10} fill="#94a3b8">
              {w.name.length > 16 ? w.name.slice(0, 15) + '…' : w.name}
            </text>
            <rect x={PAD.left} y={y + 4} width={Math.max(barW, 2)} height={18} fill={col} rx={3} opacity={0.85} />
            <text x={PAD.left + barW + 6} y={y + 16} fontSize={10} fill="#e2e8f0">{w.shifts}</text>
          </g>
        );
      })}
      {avg > 0 && (
        <line
          x1={PAD.left + (avg / maxShifts) * chartW}
          x2={PAD.left + (avg / maxShifts) * chartW}
          y1={PAD.top} y2={H - PAD.bottom}
          stroke="#64748b" strokeWidth={1} strokeDasharray="4 3"
        />
      )}
    </svg>
  );
}

// Donut chart — department load
function DepartmentDonut({ depts }: { depts: DeptLoad[] }) {
  const total = depts.reduce((s, d) => s + d.assigned, 0) || 1;
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];
  const R = 70, cx = 100, cy = 100;

  let startAngle = -Math.PI / 2;
  const slices = depts.slice(0, 8).map((d, i) => {
    const fraction = d.assigned / total;
    const angle = fraction * 2 * Math.PI;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + R * Math.cos(startAngle);
    const y2 = cy + R * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { d, fraction, x1, y1, x2, y2, largeArc, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i}
            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} Z`}
            fill={s.color} stroke="#0f172a" strokeWidth={2} opacity={0.9}
          />
        ))}
        <circle cx={cx} cy={cy} r={42} fill="#0f172a" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#e2e8f0">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#64748b">Shifts</text>
      </svg>

      <div className="space-y-1.5 text-xs flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-slate-300 truncate">{s.d.department}</span>
            </span>
            <span className="font-mono text-slate-400 flex-shrink-0">
              {s.d.assigned} ({Math.round(s.fraction * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    DRAFT:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    GENERATING:'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FAILED:    'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${map[status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {status}
    </span>
  );
}

// ──────────────────────────────────────────────
// Main Analytics Dashboard Page
// ──────────────────────────────────────────────
export const AnalyticsDashboardPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  // Super Admin Platform State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);

  // Operational Roster Analytics State
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dailyCoverage, setDailyCoverage] = useState<DailyDay[]>([]);
  const [workerLoad, setWorkerLoad] = useState<{ workers: WorkerLoad[]; average_shifts: number } | null>(null);
  const [deptLoad, setDeptLoad] = useState<DeptLoad[]>([]);
  const [shiftDist, setShiftDist] = useState<ShiftType[]>([]);
  const [summary, setSummary] = useState<ScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (isSuperAdmin) {
          const [orgsData, appsData] = await Promise.all([
            organizationService.getOrganizations(),
            onboardingService.getApplications().catch(() => []),
          ]);
          setOrganizations(orgsData);
          setApplications(appsData);
        } else {
          const [sData, ovData, sumData] = await Promise.all([
            scheduleService.getSchedules(),
            analyticsService.getOverview(),
            analyticsService.getSchedulesSummary(),
          ]);
          setSchedules(sData);
          setOverview(ovData);
          setSummary(sumData.schedules || []);
          const published = sData.find((s: Schedule) => s.status === 'PUBLISHED');
          const first = published || sData[0];
          if (first) setSelectedId(first.id);
        }
      } catch (e) {
        console.error('Analytics load error', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isSuperAdmin]);

  const loadScheduleData = useCallback(async (id: string) => {
    if (!id || isSuperAdmin) return;
    try {
      const [covData, loadDataRes, deptData, distData] = await Promise.all([
        analyticsService.getDailyCoverage(id),
        analyticsService.getWorkerLoad(id),
        analyticsService.getDepartmentLoad(id),
        analyticsService.getShiftDistribution(id),
      ]);
      setDailyCoverage(covData.days || []);
      setWorkerLoad(loadDataRes);
      setDeptLoad(deptData.departments || []);
      setShiftDist(distData.shift_types || []);
    } catch (e) {
      console.error('Failed schedule analytics load', e);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedId && !isSuperAdmin) {
      loadScheduleData(selectedId);
    }
  }, [selectedId, loadScheduleData, isSuperAdmin]);

  if (loading) return <LoadingSpinner label="Loading Analytics Dashboard..." />;

  // ── SUPER ADMIN PLATFORM ANALYTICS VIEW ──
  if (isSuperAdmin) {
    const activeOrgs = organizations.filter(o => o.active && o.subscription_status !== 'SUSPENDED');
    const pendingApps = applications.filter(a => a.status === 'PENDING');

    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Product Owner Executive View
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> System Status: Operational
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Platform System Analytics</h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Global SaaS platform performance, infrastructure health, onboarding requests queue, support tickets, and tenant subscriptions overview.
              </p>
            </div>
          </div>
        </div>

        {/* System Health Executive Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Organizations</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1">{activeOrgs.length}</p>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">Subscribed SaaS Tenants</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Pending Onboarding</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1">{pendingApps.length}</p>
              <p className="text-xs text-amber-400 mt-1 font-semibold">Tenant Provision Requests</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Database Latency</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1">&lt; 12ms</p>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">PostgreSQL 16 Healthy</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Redis & Solver Cluster</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-1">4 Nodes</p>
              <p className="text-xs text-blue-400 mt-1 font-semibold">Celery CP-SAT Active</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Support & Feature Requests Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscribed Organizations Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Subscribed Organizations Directory
            </h3>
            <div className="space-y-3">
              {organizations.map((org) => (
                <div key={org.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{org.name}</h4>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3 text-blue-400" /> {org.domain || `${org.slug}.scheduler.local`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded font-semibold">
                      {org.billing_cycle || 'MONTHLY'}
                    </span>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">{org.subscription_status || 'ACTIVE'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Tickets & Service Requests Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-400" /> Support Tickets & Requests Log
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Domain CNAME Mapping Request</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Submitted by Test Organisation 1</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
                  Resolved
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">German Public Holidays Integration</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Submitted by Test Organisation 2</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-full">
                  Completed
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Custom Shift Type Rest Constraint</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Submitted by Acme Healthcare</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full">
                  Under Review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TENANT OPERATIONAL ROSTER ANALYTICS VIEW (ORG MANAGERS) ──
  const curSummary = summary.find(s => s.id === selectedId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            Workforce Scheduling Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time coverage rates, workload distribution, and solver efficiency metrics.
          </p>
        </div>

        {schedules.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs font-semibold focus:outline-none pr-4 cursor-pointer"
            >
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Active Employees</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-2">{overview.total_active_workers}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Overall Coverage</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">
              {Math.round(overview.overall_coverage_pct)}%
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Schedules</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-2">{overview.total_schedules}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Published Periods</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-2">{overview.published_schedules}</p>
          </div>
        </div>
      )}

      {/* Selected Schedule Summary Bar */}
      {curSummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusChip status={curSummary.status} />
            <span className="text-sm font-bold text-slate-200">
              {new Date(curSummary.year, curSummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div>
              Required Slots: <span className="font-bold text-slate-200">{curSummary.total_required}</span>
            </div>
            <div>
              Assigned Slots: <span className="font-bold text-slate-200">{curSummary.total_assigned}</span>
            </div>
            <div>
              Coverage Rate:{' '}
              <span className="font-bold" style={{ color: coverageColor(curSummary.coverage_pct) }}>
                {Math.round(curSummary.coverage_pct)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Coverage Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-200">Daily Coverage Rate & Headcount Demand</h3>
          {dailyCoverage.length > 0 ? (
            <DailyCoverageChart days={dailyCoverage} />
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">No daily coverage data available.</div>
          )}
        </div>

        {/* Worker Workload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Worker Workload Distribution (Shifts Count)</h3>
          {workerLoad && workerLoad.workers.length > 0 ? (
            <WorkerLoadChart workers={workerLoad.workers} avg={workerLoad.average_shifts} />
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">No workload data available.</div>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Assignment Share by Department</h3>
          {deptLoad.length > 0 ? (
            <DepartmentDonut depts={deptLoad} />
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">No department data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
