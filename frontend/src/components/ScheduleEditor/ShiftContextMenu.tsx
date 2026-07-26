import React from 'react';
import { Lock, Unlock, Trash2, UserCheck, X } from 'lucide-react';

interface ShiftContextMenuProps {
  x: number;
  y: number;
  isLocked: boolean;
  onLockToggle: () => void;
  onUnassign: () => void;
  onInspectWorker: () => void;
  onClose: () => void;
}

export const ShiftContextMenu: React.FC<ShiftContextMenuProps> = ({
  x,
  y,
  isLocked,
  onLockToggle,
  onUnassign,
  onInspectWorker,
  onClose,
}) => {
  return (
    <>
      {/* Invisible Backdrop to dismiss context menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      {/* Floating Context Menu */}
      <div
        className="fixed z-50 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
        style={{ top: `${y}px`, left: `${x}px` }}
      >
        <button
          onClick={() => { onLockToggle(); onClose(); }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg text-left transition-colors"
        >
          {isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-blue-400" />}
          <span>{isLocked ? 'Unlock Shift Assignment' : 'Lock Shift Assignment'}</span>
        </button>

        <button
          onClick={() => { onInspectWorker(); onClose(); }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg text-left transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Inspect Worker Details</span>
        </button>

        <div className="my-1 border-t border-slate-800" />

        <button
          onClick={() => { onUnassign(); onClose(); }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-left transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Remove Assignment</span>
        </button>
      </div>
    </>
  );
};
