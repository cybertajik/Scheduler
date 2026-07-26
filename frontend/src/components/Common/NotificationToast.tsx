import React from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface NotificationToastProps {
  type: NotificationType;
  message: string;
  onDismiss?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ type, message, onDismiss }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  }[type];

  const IconComponent = styles.icon;

  return (
    <div className={`flex items-center justify-between p-4 mb-4 border rounded-xl text-sm transition-all shadow-lg ${styles.bg}`}>
      <div className="flex items-center space-x-3">
        <IconComponent className={`w-5 h-5 flex-shrink-0 ${styles.iconColor}`} />
        <span className="font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-slate-800/40 rounded transition-colors">
          <X className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};
