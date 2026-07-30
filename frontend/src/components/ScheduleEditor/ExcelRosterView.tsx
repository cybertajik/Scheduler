import React from 'react';
import { Calendar, FileSpreadsheet, Printer, Download, UserPlus, Info, CheckCircle2, Palmtree, GraduationCap, Clock, X } from 'lucide-react';
import { Schedule, Worker, ShiftInstance, Assignment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ExcelRosterViewProps {
  schedule: Schedule;
  workers: Worker[];
  onAssignClick: (shiftInstanceId: string) => void;
  onUnassignClick: (assignmentId: string) => void;
  onInspectWorker?: (worker: Worker) => void;
}

export const ExcelRosterView: React.FC<ExcelRosterViewProps> = ({
  schedule,
  workers,
  onAssignClick,
  onUnassignClick,
  onInspectWorker,
}) => {
  const { t, language } = useLanguage();

  // Generate all days for the target month
  const totalDaysInMonth = new Date(schedule.year, schedule.month, 0).getDate();
  const datesList: { dateStr: string; dayName: string; dayNum: number; isWeekend: boolean }[] = [];

  const dayNamesShort = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dt = new Date(schedule.year, schedule.month - 1, d);
    const dayOfWeek = dt.getDay();
    const dayName = dayNamesShort[dayOfWeek];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${schedule.year}-${String(schedule.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    datesList.push({ dateStr, dayName, dayNum: d, isWeekend });
  }

  // Extract unique shift types from shift instances
  const shiftTypeMap = new Map<string, { id: string; name: string; color: string; duration: number; isNight: boolean }>();
  schedule.shift_instances?.forEach((inst) => {
    if (inst.shift_type && !shiftTypeMap.has(inst.shift_type_id)) {
      shiftTypeMap.set(inst.shift_type_id, {
        id: inst.shift_type.id,
        name: inst.shift_type.name,
        color: inst.shift_type.color,
        duration: inst.shift_type.duration || 8.0,
        isNight: inst.shift_type.is_night_shift || false,
      });
    }
  });

  const uniqueShiftTypes = Array.from(shiftTypeMap.values());

  // Map instances by (dateStr, shift_type_id)
  const instancesByDateAndShift = new Map<string, ShiftInstance>();
  schedule.shift_instances?.forEach((inst) => {
    instancesByDateAndShift.set(`${inst.date}_${inst.shift_type_id}`, inst);
  });

  // Calculate vacations/leaves and active certifications for right panel
  const activeVacations = workers
    .filter((w) => w.notes && (w.notes.toLowerCase().includes('vacation') || w.notes.toLowerCase().includes('leave') || w.notes.toLowerCase().includes('urlaub')))
    .map((w) => ({
      name: `${w.first_name} ${w.last_name}`,
      notes: w.notes,
    }));

  const localeMap: Record<string, string> = {
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    ar: 'ar-SA',
    ru: 'ru-RU',
    zh: 'zh-CN',
    pt: 'pt-BR',
    it: 'it-IT',
  };
  const activeLocale = localeMap[language] || 'en-US';
  const monthNameLocalized = new Date(schedule.year, schedule.month - 1).toLocaleString(activeLocale, { month: 'long' });

  const startDateStr = `01.${String(schedule.month).padStart(2, '0')}.${schedule.year}`;
  const endDateStr = `${totalDaysInMonth}.${String(schedule.month).padStart(2, '0')}.${schedule.year}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header Card (Duty Roster Sheet Header) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-none print:shadow-none print:p-2 print:bg-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 print:hidden">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight print:text-black">
                {t('duty_roster')} {monthNameLocalized} {schedule.year}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-slate-300 print:text-slate-700">
                {schedule.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
              {t('period')}: {startDateStr} {t('until')} {endDateStr} | Organization Staff Schedule Sheet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            {t('print_roster')}
          </button>
        </div>
      </div>

      {/* Main Excel-Type Roster Layout (2 Columns: Left Roster Table, Right Events & Info Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Main Duty Roster Table (3 Columns Span) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl print:bg-white print:border-slate-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-300 font-bold border-b border-slate-800 uppercase tracking-wider print:bg-slate-100 print:text-black">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-800 min-w-[120px] print:border-slate-300">
                    {t('date')}
                  </th>
                  {uniqueShiftTypes.map((st, idx) => (
                    <th
                      key={st.id}
                      className="px-4 py-3 border-r border-slate-800 text-center min-w-[140px] print:border-slate-300"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-white print:text-black font-semibold">
                          {idx + 1}. {t('shift')} ({st.name})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal lowercase print:text-slate-600">
                          {st.duration}h {st.isNight ? '• Night' : ''}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left min-w-[130px]">
                    {t('information_notes')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200 print:divide-slate-300">
                {datesList.map((d) => {
                  const formattedDateLabel = `${d.dayName}, ${String(d.dayNum).padStart(2, '0')}.${String(schedule.month).padStart(2, '0')}.${String(schedule.year).slice(-2)}`;

                  return (
                    <tr
                      key={d.dateStr}
                      className={`transition-colors hover:bg-slate-800/50 ${
                        d.isWeekend
                          ? 'bg-emerald-950/20 text-emerald-200 font-medium print:bg-emerald-50 print:text-black'
                          : 'bg-slate-900/40 print:bg-white'
                      }`}
                    >
                      {/* Date Column */}
                      <td
                        className={`px-4 py-2.5 border-r border-slate-800/80 font-mono text-xs ${
                          d.isWeekend ? 'font-bold text-emerald-400 print:text-emerald-700' : 'text-slate-300'
                        }`}
                      >
                        {formattedDateLabel}
                      </td>

                      {/* Shift Columns */}
                      {uniqueShiftTypes.map((st) => {
                        const inst = instancesByDateAndShift.get(`${d.dateStr}_${st.id}`);
                        const assignments = inst?.assignments || [];

                        return (
                          <td
                            key={st.id}
                            className="px-3 py-2 border-r border-slate-800/80 text-center font-medium print:border-slate-300"
                          >
                            {inst ? (
                              <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {assignments.length > 0 ? (
                                  assignments.map((asgn) => {
                                    const wName = asgn.worker
                                      ? `${asgn.worker.last_name}`
                                      : 'Worker';
                                    const fullWName = asgn.worker
                                      ? `${asgn.worker.first_name} ${asgn.worker.last_name}`
                                      : 'Worker';

                                    return (
                                      <span
                                        key={asgn.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-blue-950/60 border border-slate-700 hover:border-blue-500/50 text-white rounded-md text-xs font-semibold transition-all shadow-sm print:bg-slate-200 print:text-black print:border-slate-400"
                                      >
                                        <span
                                          onClick={() => asgn.worker && onInspectWorker && onInspectWorker(asgn.worker)}
                                          title={`${fullWName} - Click to edit availability settings & constraints`}
                                          className="cursor-pointer hover:underline hover:text-blue-300"
                                        >
                                          {wName}
                                        </span>
                                        {asgn.locked && (
                                          <span className="text-[10px] text-amber-400" title="Locked from solver modification">🔒</span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onUnassignClick(asgn.id);
                                          }}
                                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors print:hidden"
                                          title="Remove assignment"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <button
                                    onClick={() => onAssignClick(inst.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-950/60 hover:bg-blue-600/20 border border-dashed border-slate-700 hover:border-blue-500/40 text-slate-500 hover:text-blue-300 rounded text-[11px] transition-all print:hidden"
                                    title="Click to assign worker"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>NN</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px]">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Notes Column */}
                      <td className="px-4 py-2 text-slate-400 text-[11px] font-mono italic print:text-slate-600">
                        {d.dayName === 'Mo.' ? 'KW ' + Math.ceil(d.dayNum / 7) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Panel: Events & Information (Fully Translated Context Panel) */}
        <div className="space-y-4 print:border print:border-slate-300 print:p-4 print:bg-white">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                {t('events_information')}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{monthNameLocalized} {schedule.year}</span>
            </div>

            {/* Section 1: Vacations & Absences */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs font-bold uppercase">
                <Palmtree className="w-3.5 h-3.5" />
                <span>{t('vacations_absences')}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 text-slate-300 font-mono">
                {activeVacations.length > 0 ? (
                  activeVacations.map((v, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-white">{v.name}</span>
                      <span className="text-slate-400 text-[10px]">{v.notes}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">Alp</span>
                      <span className="text-slate-400">01.08. {t('until')} 16.08.</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">Netscher</span>
                      <span className="text-slate-400">08.08. {t('until')} 23.08.</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">Ishankulova</span>
                      <span className="text-slate-400">11.08. {t('until')} 20.08.</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Trainings & Certifications */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-bold uppercase">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{t('trainings_courses')}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 text-slate-300 font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Giokoglu</span>
                  <span className="text-slate-400">29.08. ACLS</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Stojanovic</span>
                  <span className="text-slate-400">10.+11.08. ACLS</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Utrobicic</span>
                  <span className="text-slate-400">24.-26.08. ACLS</span>
                </div>
              </div>
            </div>

            {/* Section 3: Meetings & Notes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('meetings_notes')}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2 text-slate-300 font-mono text-[11px]">
                <div>
                  <span className="block font-bold text-white">{t('monday_meeting')}:</span>
                  <span className="text-slate-400 text-[10px]">03., 10., 17., 24., 31.{String(schedule.month).padStart(2, '0')}.</span>
                </div>
                <div className="pt-1 border-t border-slate-800">
                  <span className="block font-bold text-white">{t('duty_service')}:</span>
                  <span className="text-slate-400 text-[10px]">Mo. - Mi. {t('until')} 21:00 | Do. {t('until')} 24:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

