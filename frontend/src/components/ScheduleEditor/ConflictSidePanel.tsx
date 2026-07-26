import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { ConflictReport, ConflictItem } from '../../types';

interface ConflictSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  report: ConflictReport | null;
  onSelectConflict: (conflict: ConflictItem) => void;
}

export const ConflictSidePanel: React.FC<ConflictSidePanelProps> = ({
  isOpen,
  onClose,
  report,
  onSelectConflict,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-slate-100 text-sm">Live Conflict Inspector</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {report ? (
          <>
            {/* Feasibility Metric Card */}
            <div className={`p-3 rounded-xl border ${report.is_feasible ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
              <div className="flex items-center space-x-2 font-bold mb-1">
                {report.is_feasible ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{report.is_feasible ? 'Feasible Schedule' : 'Infeasible Constraints Found'}</span>
              </div>
              <p className="text-[11px] opacity-80">{report.summary_message}</p>
            </div>

            {/* Diagnostic Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hard Violations</span>
                <span className="text-lg font-extrabold text-rose-400">{report.hard_conflicts_count}</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Soft Penalties</span>
                <span className="text-lg font-extrabold text-amber-400">{report.total_penalty_score}</span>
              </div>
            </div>

            {/* Detailed Conflicts List */}
            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-slate-400 uppercase text-[10px]">Conflict Breakdown</h4>
              {report.conflicts && report.conflicts.length > 0 ? (
                report.conflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectConflict(conflict)}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        conflict.severity === 'HARD' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {conflict.severity}
                      </span>
                      {conflict.date && <span className="font-mono text-[10px] text-slate-400">{conflict.date}</span>}
                    </div>
                    <p className="text-slate-200 font-medium group-hover:text-blue-400 transition-colors">
                      {conflict.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-80" />
                  <p>No active conflicts detected.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-slate-500">No conflict diagnostic report loaded.</div>
        )}
      </div>
    </div>
  );
};
