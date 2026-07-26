import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-rose-500/20 rounded transition-colors">
          <X className="w-4 h-4 text-rose-400" />
        </button>
      )}
    </div>
  );
};
