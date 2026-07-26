import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { scheduleService } from '../services/apiServices';
import { ConflictReport } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const ConflictReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadConflicts = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await scheduleService.getConflicts(id);
        setReport(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch conflict report');
      } finally {
        setLoading(false);
      }
    };
    loadConflicts();
  }, [id]);

  if (loading) return <LoadingSpinner label="Running infeasibility diagnostics..." />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/schedules/${id}`)}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Schedule Calendar</span>
      </button>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <ShieldAlert className="w-8 h-8 text-rose-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Solver Conflict & Diagnostic Report</h1>
          <p className="text-sm text-slate-400 mt-0.5">Explanation of hard constraint violations and soft optimization penalty scores</p>
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-semibold">Feasibility Status</span>
              <span className={`text-xl font-bold mt-1 inline-block ${report.is_feasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {report.is_feasible ? 'Feasible Solution Found' : 'Infeasible Constraints'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block uppercase font-semibold">Hard Conflicts Count</span>
              <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{report.hard_conflicts_count}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block uppercase font-semibold">Soft Violations Penalty</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{report.total_penalty_score}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-semibold text-slate-200 text-base">Diagnostic Summary</h3>
            <p className="text-sm text-slate-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              {report.summary_message}
            </p>

            {report.conflicts && report.conflicts.length > 0 && (
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400">Detailed Conflict List</h4>
                {report.conflicts.map((item, idx) => (
                  <div key={idx} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-300">{item.description}</p>
                      <p className="text-xs text-rose-400/80 mt-1">Severity: {item.severity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
