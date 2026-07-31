import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleService, workerService, assignmentService } from '../services/apiServices';
import { Schedule, Worker, CoverageSummary, ConflictReport, ConflictItem, Assignment } from '../types';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { NotificationToast, NotificationType } from '../components/Common/NotificationToast';
import { useScheduleHistory } from '../hooks/useScheduleHistory';
import { EditorToolbar } from '../components/ScheduleEditor/EditorToolbar';
import { ConflictSidePanel } from '../components/ScheduleEditor/ConflictSidePanel';
import { ExcelRosterView } from '../components/ScheduleEditor/ExcelRosterView';
import { WorkerDetailDrawer } from '../components/ScheduleEditor/WorkerDetailDrawer';
import { ShiftContextMenu } from '../components/ScheduleEditor/ShiftContextMenu';
import { DiagnosticsPanel } from '../components/ScheduleEditor/DiagnosticsPanel';
import { AutoRepairModal } from '../components/ScheduleEditor/AutoRepairModal';

import { useLanguage } from '../context/LanguageContext';
import { useHolidays } from '../context/HolidayContext';

export const ScheduleDetailPage: React.FC = () => {
  const { t } = useLanguage();
  const { getHolidaysForDate, holidays } = useHolidays();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const calendarRef = useRef<any>(null);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [coverage, setCoverage] = useState<CoverageSummary | null>(null);
  const [conflicts, setConflicts] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: NotificationType; message: string } | null>(null);

  // View Mode: 'calendar' (FullCalendar) | 'excel' (Table Roster View) - Persisted in localStorage
  const [viewMode, setViewMode] = useState<'calendar' | 'excel'>(() => {
    const saved = localStorage.getItem('schedule_view_mode');
    return saved === 'excel' || saved === 'calendar' ? saved : 'calendar';
  });

  const handleViewModeChange = (mode: 'calendar' | 'excel') => {
    setViewMode(mode);
    localStorage.setItem('schedule_view_mode', mode);
  };

  // Side Panels & Drawers
  const [isConflictPanelOpen, setIsConflictPanelOpen] = useState(false);
  const [isWorkerDrawerOpen, setIsWorkerDrawerOpen] = useState(false);
  const [isDiagnosticsPanelOpen, setIsDiagnosticsPanelOpen] = useState(false);
  const [isAutoRepairModalOpen, setIsAutoRepairModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedShiftInstanceId, setSelectedShiftInstanceId] = useState<string>('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    assignmentId: string;
    shiftInstanceId: string;
    workerId: string;
    isLocked: boolean;
  } | null>(null);

  // History Hook
  const { canUndo, canRedo, undo, redo, pushAction } = useScheduleHistory();

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sched, wrks, cov, conf, allScheds] = await Promise.all([
        scheduleService.getScheduleDetail(id),
        workerService.getWorkers(true),
        scheduleService.getCoverage(id).catch(() => null),
        scheduleService.getConflicts(id).catch(() => null),
        scheduleService.getSchedules().catch(() => []),
      ]);
      setSchedule(sched);
      setWorkers(wrks);
      setCoverage(cov);
      setConflicts(conf);
      setAllSchedules(allScheds);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load schedule details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (!schedule) return;
    const prevMonth = schedule.month === 1 ? 12 : schedule.month - 1;
    const prevYear = schedule.month === 1 ? schedule.year - 1 : schedule.year;
    const match = allSchedules.find((s) => s.month === prevMonth && s.year === prevYear);
    if (match) {
      navigate(`/schedules/${match.id}`);
    } else {
      setToast({
        type: 'info',
        message: `No schedule period exists for ${new Date(prevYear, prevMonth - 1).toLocaleString('default', { month: 'long' })} ${prevYear}.`,
      });
    }
  };

  const handleNextMonth = () => {
    if (!schedule) return;
    const nextMonth = schedule.month === 12 ? 1 : schedule.month + 1;
    const nextYear = schedule.month === 12 ? schedule.year + 1 : schedule.year;
    const match = allSchedules.find((s) => s.month === nextMonth && s.year === nextYear);
    if (match) {
      navigate(`/schedules/${match.id}`);
    } else {
      setToast({
        type: 'info',
        message: `No schedule period exists for ${new Date(nextYear, nextMonth - 1).toLocaleString('default', { month: 'long' })} ${nextYear}.`,
      });
    }
  };

  // Keyboard Shortcuts for Undo (Ctrl+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Solver Trigger
  const handleTriggerSolver = async () => {
    if (!id) return;
    try {
      setSolving(true);
      setError('');
      setToast({ type: 'info', message: 'CP-SAT Solver initiated in background...' });
      await scheduleService.triggerSolver(id);

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await scheduleService.getSolverStatus(id);
          if (status.status === 'GENERATED' || status.status === 'DRAFT' || attempts > 15) {
            clearInterval(interval);
            setSolving(false);
            setToast({ type: 'success', message: 'CP-SAT Solver finished optimizing schedule!' });
            loadData();
          }
        } catch {
          clearInterval(interval);
          setSolving(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Solver execution failed');
      setSolving(false);
    }
  };

  const handlePublishSchedule = async () => {
    if (!id) return;
    try {
      await scheduleService.updateSchedule(id, { status: 'PUBLISHED' });
      setToast({ type: 'success', message: 'Schedule published successfully!' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to publish schedule');
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedShiftInstanceId || !selectedWorkerId) return;

    try {
      const newAsgn = await assignmentService.createAssignment(id, {
        shift_instance_id: selectedShiftInstanceId,
        worker_id: selectedWorkerId,
        locked: false,
      });

      // Record to Undo/Redo History
      pushAction({
        id: newAsgn.id,
        type: 'ASSIGN',
        description: `Assigned worker to shift`,
        timestamp: new Date().toISOString(),
        previousState: null,
        newState: newAsgn,
        undoHandler: async () => {
          await assignmentService.deleteAssignment(newAsgn.id);
          loadData();
        },
        redoHandler: async () => {
          await assignmentService.createAssignment(id, {
            shift_instance_id: selectedShiftInstanceId,
            worker_id: selectedWorkerId,
            locked: false,
          });
          loadData();
        },
      });

      setIsAssignModalOpen(false);
      setToast({ type: 'success', message: 'Worker assigned successfully!' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign worker');
    }
  };

  // Toggle Lock Assignment State
  const handleToggleLock = async (assignmentId: string, currentLock: boolean) => {
    if (!id) return;
    try {
      await assignmentService.updateAssignment(assignmentId, { locked: !currentLock });
      setToast({ type: 'info', message: currentLock ? 'Assignment unlocked.' : 'Assignment locked from solver modification.' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update lock status');
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!id) return;
    try {
      await assignmentService.deleteAssignment(assignmentId);
      setToast({ type: 'warning', message: 'Shift assignment removed.' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove assignment');
    }
  };

  // Drag & Drop Reschedule Event Handler
  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;
    const assignmentId = event.id;
    const newDateStr = event.startStr.split('T')[0];

    if (!id || event.extendedProps.unassigned) {
      dropInfo.revert();
      return;
    }

    if (event.extendedProps.locked) {
      setError('Cannot move a locked assignment. Unlock it first.');
      dropInfo.revert();
      return;
    }

    // Find target shift instance on target date
    const targetShiftInst = schedule?.shift_instances?.find(
      (inst) => inst.date === newDateStr && inst.shift_type_id === event.extendedProps.shiftTypeId
    );

    if (!targetShiftInst) {
      setError(`No matching shift instance available on ${newDateStr}`);
      dropInfo.revert();
      return;
    }

    try {
      await assignmentService.updateAssignment(assignmentId, {
        shift_instance_id: targetShiftInst.id,
      });
      setToast({ type: 'success', message: `Shift moved to ${newDateStr}` });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to move assignment');
      dropInfo.revert();
    }
  };

  if (loading) return <LoadingSpinner label="Loading schedule & interactive editor..." />;
  if (!schedule) return <ErrorBanner message="Schedule period not found" />;

  // Transform shift instances into FullCalendar event objects
  const events: any[] = [];
  let totalAssignedHours = 0;

  schedule.shift_instances?.forEach((inst) => {
    const shiftName = inst.shift_type?.name || 'Shift';
    const color = inst.shift_type?.color || '#3B82F6';

    if (inst.assignments && inst.assignments.length > 0) {
      inst.assignments.forEach((asgn) => {
        const workerName = asgn.worker
          ? `${asgn.worker.first_name} ${asgn.worker.last_name}`
          : 'Assigned Worker';

        if (asgn.worker_id === selectedWorker?.id) {
          totalAssignedHours += inst.shift_type?.duration || 8;
        }

        events.push({
          id: asgn.id,
          title: `${shiftName}: ${workerName}${asgn.locked ? ' 🔒' : ''}`,
          date: inst.date,
          backgroundColor: color,
          borderColor: asgn.locked ? '#F59E0B' : color,
          editable: !asgn.locked,
          extendedProps: {
            shiftInstanceId: inst.id,
            shiftTypeId: inst.shift_type_id,
            workerId: asgn.worker_id,
            worker: asgn.worker,
            locked: asgn.locked,
          },
        });
      });
    } else {
      events.push({
        id: `unassigned-${inst.id}`,
        title: `⚠️ Unfilled: ${shiftName} (${inst.required_workers} needed)`,
        date: inst.date,
        backgroundColor: '#334155',
        borderColor: '#475569',
        editable: false,
        extendedProps: {
          shiftInstanceId: inst.id,
          unassigned: true,
        },
      });
    }
  });

  // Inject public holiday background events from HolidayContext
  holidays.forEach((h) => {
    events.push({
      id: `holiday-${h.date}-${h.country}`,
      title: `🏖️ ${h.name}`,
      date: h.date,
      display: 'background',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      classNames: ['holiday-bg-event'],
      extendedProps: { isHoliday: true, holidayName: h.name, country: h.country },
    });
  });

  return (
    <div className="space-y-6">
      {/* Editor Main Toolbar with Big View Switcher & Month Navigation */}
      <EditorToolbar
        scheduleTitle={`${new Date(schedule.year, schedule.month - 1).toLocaleString('default', { month: 'long' })} ${schedule.year}`}
        status={schedule.status}
        canUndo={canUndo}
        canRedo={canRedo}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onUndo={undo}
        onRedo={redo}
        onNavigateBack={() => navigate('/schedules?view=list')}
        onRunSolver={handleTriggerSolver}
        onPublish={handlePublishSchedule}
        onToggleConflictPanel={() => setIsConflictPanelOpen((prev) => !prev)}
        onToggleWorkerDrawer={() => setIsWorkerDrawerOpen((prev) => !prev)}
        onToggleDiagnosticsPanel={() => setIsDiagnosticsPanelOpen((prev) => !prev)}
        onToggleAutoRepairModal={() => setIsAutoRepairModalOpen(true)}
        isSolving={solving}
        conflictCount={conflicts?.hard_conflicts_count || 0}
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {toast && <NotificationToast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}

      {/* Solver Diagnostics Panel */}
      {isDiagnosticsPanelOpen && id && (
        <DiagnosticsPanel scheduleId={id} onClose={() => setIsDiagnosticsPanelOpen(false)} />
      )}

      {/* Intelligent Auto-Repair Modal */}
      {id && (
        <AutoRepairModal
          scheduleId={id}
          isOpen={isAutoRepairModalOpen}
          onClose={() => setIsAutoRepairModalOpen(false)}
          onRepairApplied={() => {
            setToast({ type: 'success', message: 'Auto-Repair plan applied successfully.' });
            loadData();
          }}
        />
      )}

      {/* Coverage & Diagnostics Card */}
      {coverage && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 shadow-xl">
          <div>
            <span className="text-xs text-slate-500 block uppercase font-semibold">{t('fulfillment_coverage')}</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-100">{coverage.coverage_percentage}%</span>
              <span className="text-xs text-slate-400">({coverage.total_assigned_workers} / {coverage.total_required_workers})</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(coverage.coverage_percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-semibold">{t('total_shifts_needed')}</span>
            <span className="text-2xl font-extrabold text-slate-100 mt-1 block">{coverage.total_required_workers}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-semibold">{t('assigned_staff')}</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{coverage.total_assigned_workers}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-semibold">{t('constraint_conflicts')}</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-2xl font-extrabold ${conflicts?.hard_conflicts_count ? 'text-rose-400' : 'text-slate-100'}`}>
                {conflicts?.hard_conflicts_count || 0} Hard
              </span>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 1: Excel / Duty Roster Table View (Matching Submitted Reference Document) */}
      {viewMode === 'excel' ? (
        <div className="flex relative items-start gap-4">
          <div className="flex-1 overflow-hidden">
            <ExcelRosterView
              schedule={schedule}
              workers={workers}
              onAssignClick={(shiftInstanceId) => {
                setSelectedShiftInstanceId(shiftInstanceId);
                setIsAssignModalOpen(true);
              }}
              onUnassignClick={(assignmentId) => {
                handleDeleteAssignment(assignmentId);
              }}
              onInspectWorker={(worker) => {
                setSelectedWorker(worker);
                setIsWorkerDrawerOpen(true);
              }}
            />
          </div>

          <WorkerDetailDrawer
            isOpen={isWorkerDrawerOpen}
            onClose={() => setIsWorkerDrawerOpen(false)}
            worker={selectedWorker}
            assignedHours={totalAssignedHours}
            onConstraintUpdated={loadData}
          />
        </div>
      ) : (
        /* View Mode 2: Classic FullCalendar Interactive Workspace */
        <div className="flex relative items-start gap-4">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              editable={true}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              events={events}
              eventDrop={handleEventDrop}
              eventClick={(info) => {
                const props = info.event.extendedProps;
                if (props.unassigned) {
                  setSelectedShiftInstanceId(props.shiftInstanceId);
                  setIsAssignModalOpen(true);
                } else if (props.worker) {
                  setSelectedWorker(props.worker);
                  setIsWorkerDrawerOpen(true);
                }
              }}
              eventDidMount={(info) => {
                info.el.oncontextmenu = (e) => {
                  e.preventDefault();
                  const props = info.event.extendedProps;
                  if (!props.unassigned) {
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      assignmentId: info.event.id,
                      shiftInstanceId: props.shiftInstanceId,
                      workerId: props.workerId,
                      isLocked: props.locked,
                    });
                  }
                };
              }}
              height="720px"
              aspectRatio={1.6}
            />
          </div>

          <ConflictSidePanel
            isOpen={isConflictPanelOpen}
            onClose={() => setIsConflictPanelOpen(false)}
            report={conflicts}
            onSelectConflict={(conflict: ConflictItem) => {
              if (conflict.date && calendarRef.current) {
                const calendarApi = calendarRef.current.getApi();
                calendarApi.gotoDate(conflict.date);
              }
            }}
          />

          <WorkerDetailDrawer
            isOpen={isWorkerDrawerOpen}
            onClose={() => setIsWorkerDrawerOpen(false)}
            worker={selectedWorker}
            assignedHours={totalAssignedHours}
            onConstraintUpdated={loadData}
          />
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <ShiftContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isLocked={contextMenu.isLocked}
          onLockToggle={() => handleToggleLock(contextMenu.assignmentId, contextMenu.isLocked)}
          onUnassign={() => handleDeleteAssignment(contextMenu.assignmentId)}
          onInspectWorker={() => {
            const worker = workers.find((w) => w.id === contextMenu.workerId);
            if (worker) {
              setSelectedWorker(worker);
              setIsWorkerDrawerOpen(true);
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Manual Assignment Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Staff Member">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Worker</label>
            <select
              required
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            >
              <option value="">-- Choose Worker --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.first_name} {w.last_name} ({w.weekly_contract_hours}h/wk)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
