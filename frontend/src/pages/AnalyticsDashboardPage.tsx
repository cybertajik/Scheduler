import React, { useEffect, useState, useCallback } from 'react';
import { BarChart2, Users, Calendar, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { analyticsService, scheduleService } from '../services/apiServices';
import { Schedule } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

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
      {/* Grid lines */}
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

      {/* Bars */}
      {days.map((d, i) => {
        const x = PAD.left + (i / days.length) * chartW + (chartW / days.length - barW) / 2;
        const barH = Math.max(2, (d.assigned / maxVal) * chartH);
        const reqH = (d.required / maxVal) * chartH;
        const col = coverageColor(d.coverage_pct);
        const dayNum = new Date(d.date + 'T00:00:00').getDate();

        return (
          <g key={d.date}>
            {/* Required ghost bar */}
            <rect x={x} y={PAD.top + chartH - reqH} width={barW} height={reqH}
              fill="#1e293b" rx={2} />
            {/* Assigned bar */}
            <rect x={x} y={PAD.top + chartH - barH} width={barW} height={barH}
              fill={col} rx={2} opacity={0.9} />
            {/* Day label every 5 days */}
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
            <text x={PAD.left - 6} y={y + 16} textAnchor="end" fontSize={10} fill="#94a3b8"
              style={{ fontFamily: 'sans-serif' }}>
              {w.name.length > 16 ? w.name.slice(0, 15) + '…' : w.name}
            </text>
            <rect x={PAD.left} y={y + 4} width={Math.max(barW, 2)} height={18}
              fill={col} rx={3} opacity={0.85} />
            <text x={PAD.left + barW + 6} y={y + 16} fontSize={10} fill="#e2e8f0">
              {w.shifts}
            </text>
          </g>
        );
      })}
      {/* Average line */}
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
        {/* Inner hole */}
        <circle cx={cx} cy={cy} r={42} fill="#0f172a" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#e2e8f0">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#64748b">assignments</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate max-w-[120px]">{s.d.department}</span>
            <span className="ml-auto font-mono text-slate-400">{s.d.assigned}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shift type horizontal bars
function ShiftTypeChart({ types }: { types: ShiftType[] }) {
  const maxCount = Math.max(...types.map(t => t.instances), 1);
  const W = 500, PAD = { left: 110, right: 60 };
  const chartW = W - PAD.left - PAD.right;

  return (
    <div className="space-y-2">
      {types.map(t => {
        const barPct = (t.instances / maxCount) * 100;
        return (
          <div key={t.shift_type_id} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-24 text-right truncate">{t.name}</span>
            <div className="flex-1 bg-slate-800 rounded-full h-5 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${barPct}%`, background: t.color || '#3b82f6', opacity: 0.85 }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-8 text-right">{t.instances}</span>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Status badge
// ──────────────────────────────────────────────
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
// Main page
// ──────────────────────────────────────────────
export const AnalyticsDashboardPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dailyCoverage, setDailyCoverage] = useState<DailyDay[]>([]);
  const [workerLoad, setWorkerLoad] = useState<{ workers: WorkerLoad[]; average_shifts: number } | null>(null);
  const [deptLoad, setDeptLoad] = useState<DeptLoad[]>([]);
  const [shiftDist, setShiftDist] = useState<ShiftType[]>([]);
  const [summary, setSummary] = useState<ScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [sData, ovData, sumData] = await Promise.all([
          scheduleService.getSchedules(),
          analyticsService.getOverview(),
          analyticsService.getSchedulesSummary(),
        ]);
        setSchedules(sData);
        setOverview(ovData);
        setSummary(sumData.schedules || []);
        // Select first published, else first
        const published = sData.find((s: Schedule) => s.status === 'PUBLISHED');
        const first = published || sData[0];
        if (first) setSelectedId(first.id);
      } catch (e) {
        console.error('Analytics load error', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Per-schedule data
  const loadScheduleData = useCallback(async (id: string) => {
    if (!id) return;
    setScheduleLoading(true);
    try {
      const [cov, wl, dl, sd] = await Promise.all([
        analyticsService.getDailyCoverage(id),
        analyticsService.getWorkerLoad(id),
        analyticsService.getDepartmentLoad(id),
        analyticsService.getShiftDistribution(id),
      ]);
      setDailyCoverage(cov.days || []);
      setWorkerLoad(wl);
      setDeptLoad(dl.departments || []);
      setShiftDist(sd.shift_types || []);
    } catch (e) {
      console.error('Schedule analytics error', e);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadScheduleData(selectedId);
  }, [selectedId, loadScheduleData]);

  if (loading) return <LoadingSpinner label="Loading analytics..." />;

  const selectedSchedule = schedules.find(s => s.id === selectedId);
  const monthLabel = selectedSchedule
    ? `${new Date(selectedSchedule.year, selectedSchedule.month - 1).toLocaleString('default', { month: 'long' })} ${selectedSchedule.year}`
    : '';

  const uncovered = overview
    ? overview.total_required_slots - overview.total_filled_slots
    : 0;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            Analytics & Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Workforce coverage, load distribution, and scheduling efficiency
          </p>
        </div>
        {/* Schedule selector */}
        <select
          id="schedule-selector"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 min-w-[200px]"
        >
          <option value="">— Select Schedule —</option>
          {schedules.map(s => (
            <option key={s.id} value={s.id}>
              {new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long' })} {s.year} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {/* ── Global KPI Cards ── */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Workers', value: overview.total_active_workers, icon: <Users className="w-5 h-5 text-blue-400" />, sub: 'In staff pool' },
            { label: 'Published Schedules', value: overview.published_schedules, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, sub: `${overview.draft_schedules} draft` },
            { label: 'Overall Coverage', value: `${overview.overall_coverage_pct}%`, icon: <TrendingUp className="w-5 h-5 text-purple-400" />, sub: 'Across all published' },
            { label: 'Uncovered Slots', value: uncovered, icon: <AlertTriangle className={`w-5 h-5 ${uncovered > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />, sub: `${overview.total_filled_slots} filled of ${overview.total_required_slots}` },
          ].map(card => (
            <div key={card.label} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">{card.label}</span>
                {card.icon}
              </div>
              <p className="text-3xl font-extrabold text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Per-schedule charts ── */}
      {selectedId && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-200">
              Schedule: <span className="text-blue-400">{monthLabel}</span>
            </h2>
            {scheduleLoading && (
              <span className="text-xs text-slate-500 animate-pulse">Loading…</span>
            )}
          </div>

          {/* Daily Coverage */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-200">Daily Coverage</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="inline-block w-3 h-2 rounded-sm bg-slate-700 mr-1" />Required slots ·
                <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500 ml-2 mr-1" />Filled
              </p>
            </div>
            {dailyCoverage.length > 0 ? (
              <DailyCoverageChart days={dailyCoverage} />
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No shift instances for this schedule.</p>
            )}
          </div>

          {/* Two-column: Worker Load + Dept Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Worker Load */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-200">Worker Load Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 15 workers by shifts assigned — avg: <span className="text-slate-300 font-mono">{workerLoad?.average_shifts ?? 0}</span>
                </p>
              </div>
              {workerLoad && workerLoad.workers.length > 0 ? (
                <WorkerLoadChart workers={workerLoad.workers} avg={workerLoad.average_shifts} />
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No assignments yet.</p>
              )}
            </div>

            {/* Department Donut */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-200">Assignments by Department</h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution of filled shifts per department</p>
              </div>
              {deptLoad.length > 0 ? (
                <DepartmentDonut depts={deptLoad} />
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No assignments yet.</p>
              )}
            </div>
          </div>

          {/* Shift Type Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-200">Shift Type Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Number of shift instances per shift type</p>
            </div>
            {shiftDist.length > 0 ? (
              <ShiftTypeChart types={shiftDist} />
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No shift instances for this schedule.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Schedules Comparison Table ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-200">All Schedules — Coverage Comparison</h3>
        </div>
        {summary.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">No schedules found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Required</th>
                  <th className="px-6 py-3 text-right">Assigned</th>
                  <th className="px-6 py-3 text-right">Coverage</th>
                  <th className="px-6 py-3">Solver Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.map(s => (
                  <tr key={s.id}
                    className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${s.id === selectedId ? 'bg-blue-950/20' : ''}`}
                    onClick={() => setSelectedId(s.id)}>
                    <td className="px-6 py-3 font-medium text-slate-100">
                      {new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long' })} {s.year}
                    </td>
                    <td className="px-6 py-3"><StatusChip status={s.status} /></td>
                    <td className="px-6 py-3 text-right font-mono text-slate-400">{s.total_required}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-400">{s.total_assigned}</td>
                    <td className="px-6 py-3 text-right">
                      <span style={{ color: coverageColor(s.coverage_pct) }} className="font-bold">
                        {s.coverage_pct}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-slate-500">{s.solver_score || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
