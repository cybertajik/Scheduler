import React from 'react';
import {
  ArrowLeft, Cpu, ShieldAlert, CheckCircle2, RefreshCw, Undo2, Redo2, PanelRightOpen, Users, Calendar as CalendarIcon, FileSpreadsheet, ChevronLeft, ChevronRight, Activity, Wrench
} from 'lucide-react';
import { ScheduleStatus } from '../../types';
import { StatusBadge } from '../Common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';

interface EditorToolbarProps {
  scheduleTitle: string;
  status: ScheduleStatus;
  canUndo: boolean;
  canRedo: boolean;
  viewMode?: 'calendar' | 'excel';
  onViewModeChange?: (mode: 'calendar' | 'excel') => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNavigateBack: () => void;
  onRunSolver: () => void;
  onPublish: () => void;
  onToggleConflictPanel: () => void;
  onToggleWorkerDrawer: () => void;
  onToggleDiagnosticsPanel?: () => void;
  onToggleAutoRepairModal?: () => void;
  isSolving: boolean;
  conflictCount: number;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = React.memo(({
  scheduleTitle,
  status,
  canUndo,
  canRedo,
  viewMode = 'calendar',
  onViewModeChange,
  onPrevMonth,
  onNextMonth,
  onUndo,
  onRedo,
  onNavigateBack,
  onRunSolver,
  onPublish,
  onToggleConflictPanel,
  onToggleWorkerDrawer,
  onToggleDiagnosticsPanel,
  onToggleAutoRepairModal,
  isSolving,
  conflictCount,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      {/* Left: Navigation & Title with Month Arrows */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Back to Schedules"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {onPrevMonth && (
            <button
              onClick={onPrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Previous Schedule Period"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{scheduleTitle}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Interactive Schedule Editor & Duty Roster Inspector</p>
          </div>

          {onNextMonth && (
            <button
              onClick={onNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Next Schedule Period"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Center: BIG VIEW MODE SWITCHER ICONS */}
      {onViewModeChange && (
        <div className="flex items-center justify-center self-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CalendarIcon className={`w-5 h-5 ${viewMode === 'calendar' ? 'text-white' : 'text-slate-400'}`} />
            <span>{t('classic_calendar_view')}</span>
          </button>

          <button
            onClick={() => onViewModeChange('excel')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              viewMode === 'excel'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 ${viewMode === 'excel' ? 'text-white' : 'text-emerald-400'}`} />
            <span>{t('excel_roster_view')}</span>
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Worker Roster Drawer */}
        <button
          onClick={onToggleWorkerDrawer}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          {t('workers')}
        </button>

        {/* Conflict Inspector */}
        <button
          onClick={onToggleConflictPanel}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
            conflictCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {t('conflicts')} ({conflictCount})
          <PanelRightOpen className="w-4 h-4 ml-1 opacity-60" />
        </button>

        {/* Solver Diagnostics & Explainability */}
        {onToggleDiagnosticsPanel && (
          <button
            onClick={onToggleDiagnosticsPanel}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/80 text-indigo-300 text-sm font-medium rounded-lg transition-colors shadow-sm"
            title="Open Solver Explainability & Diagnostics"
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            Diagnostics
          </button>
        )}

        {/* Intelligent Auto-Repair */}
        {onToggleAutoRepairModal && (
          <button
            onClick={onToggleAutoRepairModal}
            className="inline-flex items-center gap-2 px-3 py-2 bg-teal-950/60 hover:bg-teal-900/80 border border-teal-800/80 text-teal-300 text-sm font-medium rounded-lg transition-colors shadow-sm"
            title="Intelligent Auto-Repair & Conflict Resolution"
          >
            <Wrench className="w-4 h-4 text-teal-400" />
            Auto-Repair
          </button>
        )}

        {/* Auto-Solve */}
        {status === 'DRAFT' && (
          <button
            onClick={onRunSolver}
            disabled={isSolving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            {isSolving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
            {isSolving ? 'Solving...' : t('run_auto_solver')}
          </button>
        )}

        {/* Publish */}
        {status === 'DRAFT' && (
          <button
            onClick={onPublish}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-950/40 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('publish')}
          </button>
        )}
      </div>
    </div>
  );
});

