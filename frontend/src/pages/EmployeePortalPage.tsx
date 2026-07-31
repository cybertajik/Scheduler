import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Briefcase,
  Palmtree,
  Repeat,
  Bell,
  Download,
  User,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import {
  EmployeeDashboard,
  MyScheduleShift,
  VacationRequestItem,
  ShiftSwapItem,
  AvailabilityItem,
  Worker
} from '../types';
import { employeePortalService, workerService } from '../services/apiServices';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { NotificationToast, NotificationType } from '../components/Common/NotificationToast';

export const EmployeePortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CALENDAR' | 'SWAPS' | 'VACATIONS' | 'AVAILABILITY' | 'ANALYTICS' | 'PROFILE'>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: NotificationType; message: string } | null>(null);

  const [dashboard, setDashboard] = useState<EmployeeDashboard | null>(null);
  const [scheduleShifts, setScheduleShifts] = useState<MyScheduleShift[]>([]);
  const [vacations, setVacations] = useState<VacationRequestItem[]>([]);
  const [swaps, setSwaps] = useState<ShiftSwapItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [colleagues, setColleagues] = useState<Worker[]>([]);

  // Modal Forms State
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  const [vacForm, setVacForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [swapForm, setSwapForm] = useState({ target_worker_id: '', requestor_assignment_id: '', notes: '' });
  const [availForm, setAvailForm] = useState({ date: '', availability_type: 'UNAVAILABLE', notes: '' });
  const [profileForm, setProfileForm] = useState({ phone: '', email: '', new_password: '' });

  const loadPortalData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dbData, schedData, vacData, swapData, availData, wrkData] = await Promise.all([
        employeePortalService.getDashboard(),
        employeePortalService.getMySchedule(),
        employeePortalService.getVacations(),
        employeePortalService.getShiftSwaps(),
        employeePortalService.getAvailability(),
        workerService.getWorkers(true)
      ]);
      setDashboard(dbData);
      setScheduleShifts(schedData);
      setVacations(vacData);
      setSwaps(swapData);
      setAvailability(availData);
      setColleagues(wrkData);
      setProfileForm({ phone: '', email: dbData.employee_number || '', new_password: '' });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load employee portal data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Vacation Submit
  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeePortalService.submitVacation(vacForm);
      setToast({ type: 'success', message: 'Vacation request submitted for administrator approval.' });
      setIsVacationModalOpen(false);
      setVacForm({ start_date: '', end_date: '', reason: '' });
      loadPortalData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit vacation request.');
    }
  };

  // Shift Swap Submit
  const handleSwapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeePortalService.submitShiftSwap(swapForm);
      setToast({ type: 'success', message: 'Shift swap request proposed to colleague.' });
      setIsSwapModalOpen(false);
      setSwapForm({ target_worker_id: '', requestor_assignment_id: '', notes: '' });
      loadPortalData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit shift swap.');
    }
  };

  // Availability Submit
  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeePortalService.submitAvailability(availForm);
      setToast({ type: 'success', message: 'Availability preference saved.' });
      setIsAvailabilityModalOpen(false);
      setAvailForm({ date: '', availability_type: 'UNAVAILABLE', notes: '' });
      loadPortalData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit availability.');
    }
  };

  // Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeePortalService.updateProfile(profileForm);
      setToast({ type: 'success', message: 'Profile contact details updated.' });
      loadPortalData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Employee Self-Service Portal</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            View your personal schedule, request shift swaps, submit vacations, and manage availability preferences.
          </p>
        </div>

        <button
          onClick={() => employeePortalService.downloadMySchedule()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all shadow-md"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          Download Personal Schedule
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {toast && <NotificationToast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'DASHBOARD', label: 'My Dashboard', icon: UserCheck },
          { id: 'CALENDAR', label: 'My Schedule Calendar', icon: Calendar },
          { id: 'SWAPS', label: `Shift Swaps (${swaps.length})`, icon: Repeat },
          { id: 'VACATIONS', label: `Vacations (${vacations.length})`, icon: Palmtree },
          { id: 'AVAILABILITY', label: 'Availability Preferences', icon: Clock },
          { id: 'ANALYTICS', label: 'Personal Analytics', icon: Briefcase },
          { id: 'PROFILE', label: 'Profile & Settings', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
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
          {/* TAB 1: MY DASHBOARD */}
          {activeTab === 'DASHBOARD' && dashboard && (
            <div className="space-y-6">
              {/* Personal Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Worked Hours (Month)</span>
                  <div className="text-2xl font-bold text-white tracking-tight">{dashboard.worked_hours_this_month}h</div>
                  <div className="text-[11px] text-slate-400">Contract: {dashboard.weekly_contract_hours}h/week</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Remaining Vacation</span>
                  <div className="text-2xl font-bold text-emerald-400 tracking-tight">{dashboard.remaining_vacation_days} Days</div>
                  <div className="text-[11px] text-slate-400">Approved: {vacations.filter(v => v.status === 'APPROVED').length} requests</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Night & Weekend Shifts</span>
                  <div className="text-2xl font-bold text-indigo-400 tracking-tight">
                    {dashboard.night_shifts_this_month} / {dashboard.weekend_shifts_this_month}
                  </div>
                  <div className="text-[11px] text-slate-400">Night / Weekend ratio</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Department</span>
                  <div className="text-xl font-bold text-white tracking-tight">{dashboard.department_name}</div>
                  <div className="text-[11px] text-slate-400">Emp #: {dashboard.employee_number}</div>
                </div>
              </div>

              {/* Upcoming Shifts Cards */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  My Upcoming Scheduled Shifts
                </h3>
                {dashboard.upcoming_shifts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800/80">
                    No upcoming shifts scheduled for the current period.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboard.upcoming_shifts.map(s => (
                      <div key={s.assignment_id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-white text-xs">{s.date}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: s.color }}>
                            {s.shift_name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {s.start_time} - {s.end_time} ({s.duration}h)
                        </div>
                        {s.is_night_shift && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-semibold">
                            <Moon className="w-3 h-3" /> Night Shift
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY CALENDAR */}
          {activeTab === 'CALENDAR' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Personal Shift Roster Calendar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduleShifts.map(s => (
                  <div key={s.assignment_id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white text-xs">{s.date}</span>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold text-white" style={{ backgroundColor: s.color }}>
                        {s.shift_name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Duration: {s.duration} hours</div>
                    {s.notes && <p className="text-[11px] text-slate-500 italic">{s.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHIFT SWAPS */}
          {activeTab === 'SWAPS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Shift Swap & Trade Requests</h3>
                <button
                  onClick={() => setIsSwapModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Request Shift Swap
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Requestor</th>
                      <th className="p-3">Colleague</th>
                      <th className="p-3">Shift Date</th>
                      <th className="p-3">Shift Name</th>
                      <th className="p-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950">
                    {swaps.map(sw => (
                      <tr key={sw.id} className="hover:bg-slate-900/60">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sw.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : sw.status === 'PROPOSED'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {sw.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">{sw.requestor_worker_name}</td>
                        <td className="p-3 text-slate-300">{sw.target_worker_name}</td>
                        <td className="p-3 font-mono">{sw.requestor_shift_date}</td>
                        <td className="p-3 text-indigo-300 font-semibold">{sw.requestor_shift_name}</td>
                        <td className="p-3 text-slate-500 text-[10px] font-mono">
                          {new Date(sw.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VACATIONS */}
          {activeTab === 'VACATIONS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Vacation Leave Requests</h3>
                <button
                  onClick={() => setIsVacationModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Submit Vacation Request
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3">Total Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Admin Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950">
                    {vacations.map(v => (
                      <tr key={v.id} className="hover:bg-slate-900/60">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : v.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-white">{v.start_date}</td>
                        <td className="p-3 font-mono font-semibold text-white">{v.end_date}</td>
                        <td className="p-3 font-bold text-indigo-400">{v.total_days} Days</td>
                        <td className="p-3 text-slate-300">{v.reason || '-'}</td>
                        <td className="p-3 text-slate-500">{v.admin_notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AVAILABILITY */}
          {activeTab === 'AVAILABILITY' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Availability Preferences & Restrictions</h3>
                <button
                  onClick={() => setIsAvailabilityModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Availability Preference
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availability.map(av => (
                  <div key={av.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white text-xs">{av.date}</span>
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono rounded">
                        {av.availability_type}
                      </span>
                    </div>
                    {av.notes && <p className="text-xs text-slate-400">{av.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg space-y-5 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Edit Profile & Contact Details
              </h3>
              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">New Password (Optional)</label>
                  <input
                    type="password"
                    value={profileForm.new_password}
                    onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md transition-all"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Vacation Modal */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white">Submit Vacation Leave Request</h3>
            <form onSubmit={handleVacationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={vacForm.start_date}
                  onChange={(e) => setVacForm({ ...vacForm, start_date: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={vacForm.end_date}
                  onChange={(e) => setVacForm({ ...vacForm, end_date: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={vacForm.reason}
                  onChange={(e) => setVacForm({ ...vacForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsVacationModalOpen(false)} className="px-4 py-2 bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 font-semibold rounded-lg text-white">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Swap Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white">Request Shift Swap with Colleague</h3>
            <form onSubmit={handleSwapSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Colleague</label>
                <select
                  value={swapForm.target_worker_id}
                  onChange={(e) => setSwapForm({ ...swapForm, target_worker_id: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Colleague --</option>
                  {colleagues.map(w => (
                    <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Select My Scheduled Shift</label>
                <select
                  value={swapForm.requestor_assignment_id}
                  onChange={(e) => setSwapForm({ ...swapForm, requestor_assignment_id: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="">-- Choose Shift --</option>
                  {scheduleShifts.map(s => (
                    <option key={s.assignment_id} value={s.assignment_id}>{s.date} - {s.shift_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsSwapModalOpen(false)} className="px-4 py-2 bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 font-semibold rounded-lg text-white">Propose Swap</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
