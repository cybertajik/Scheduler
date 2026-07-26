import React from 'react';
import {
  ArrowLeft, Cpu, ShieldAlert, CheckCircle2, RefreshCw, Undo2, Redo2, PanelRightOpen, Users
} from 'lucide-react';
import { ScheduleStatus } from '../../types';
import { StatusBadge } from '../Common/StatusBadge';

interface EditorToolbarProps {
  scheduleTitle: string;
  status: ScheduleStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNavigateBack: () => void;
  onRunSolver: () => void;
  onPublish: () => void;
  onToggleConflictPanel: () => void;
  onToggleWorkerDrawer: () => void;
  isSolving: boolean;
  conflictCount: number;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  scheduleTitle,
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNavigateBack,
  onRunSolver,
  onPublish,
  onToggleConflictPanel,
  onToggleWorkerDrawer,
  isSolving,
  conflictCount,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <button
          onClick={onNavigateBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Periods</span>
        </button>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-slate-100">{scheduleTitle}</h1>
          <StatusBadge status={status} type="schedule" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Undo / Redo Actions */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Side Panel Toggles */}
        <button
          onClick={onToggleConflictPanel}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
        >
          <ShieldAlert className={`w-4 h-4 ${conflictCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>Conflicts ({conflictCount})</span>
        </button>

        <button
          onClick={onToggleWorkerDrawer}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Worker Details</span>
        </button>

        {/* Solver Execution Button */}
        <button
          onClick={onRunSolver}
          disabled={isSolving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
        >
          {isSolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          <span>{isSolving ? 'CP-SAT Solving...' : 'Run CP-SAT Solver'}</span>
        </button>

        {status !== 'PUBLISHED' && (
          <button
            onClick={onPublish}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Schedule</span>
          </button>
        )}
      </div>
    </div>
  );
};
