import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-full"></div>
      <div className="h-12 bg-slate-800/50 rounded w-full"></div>
      <div className="h-12 bg-slate-800/50 rounded w-full"></div>
      <div className="h-12 bg-slate-800/50 rounded w-full"></div>
    </div>
  );
};
