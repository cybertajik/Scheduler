import React, { useEffect, useState } from 'react';
import { Clock, Plus, Moon, Sun, ShieldAlert } from 'lucide-react';
import { shiftTypeService } from '../services/apiServices';
import { ShiftType, ShiftTypeCreate } from '../types';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';

export const ShiftTypesPage: React.FC = () => {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<ShiftTypeCreate>({
    name: '',
    color: '#3B82F6',
    start_time: '08:00:00',
    end_time: '16:00:00',
    duration: 8,
    is_night_shift: false,
    requires_rest_day: false,
  });

  const loadShiftTypes = async () => {
    try {
      setLoading(true);
      const data = await shiftTypeService.getShiftTypes();
      setShiftTypes(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch shift definitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShiftTypes();
  }, []);

  const handleCreateShiftType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await shiftTypeService.createShiftType(formData);
      setIsModalOpen(false);
      loadShiftTypes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create shift definition');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Shift Definitions</h1>
          <p className="text-sm text-slate-400 mt-1">Configure duty shifts, night rules, and durations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Shift Type</span>
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner label="Loading shift definitions..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shiftTypes.map((shift) => (
            <div
              key={shift.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: shift.color }}
                  ></span>
                  {shift.is_night_shift ? (
                    <span className="flex items-center space-x-1 text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      <Moon className="w-3 h-3" />
                      <span>Night Shift</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Sun className="w-3 h-3" />
                      <span>Day Shift</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-100">{shift.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {shift.start_time} &mdash; {shift.end_time}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Duration: <strong className="text-slate-200">{shift.duration}h</strong></span>
                {shift.requires_rest_day && (
                  <span className="text-indigo-300 font-medium">Requires Rest Day</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Shift Type">
        <form onSubmit={handleCreateShiftType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Morning Shift"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 p-1 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_night_shift}
                onChange={(e) => setFormData({ ...formData, is_night_shift: e.target.checked })}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Is Night Shift</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_rest_day}
                onChange={(e) => setFormData({ ...formData, requires_rest_day: e.target.checked })}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Requires Rest Day Next Day</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500"
            >
              Create Shift
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
