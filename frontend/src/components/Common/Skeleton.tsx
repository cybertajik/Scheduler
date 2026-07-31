import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-3 animate-skeleton">
    <div className="h-3 w-1/3 bg-slate-800 rounded" />
    <div className="h-7 w-2/3 bg-slate-800 rounded-lg" />
    <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/60">
    <div className="bg-slate-900 p-3 border-b border-slate-800/80 flex gap-4">
      {Array.from({ length: cols }).map((_, idx) => (
        <div key={idx} className="h-4 flex-1 bg-slate-800/80 rounded animate-skeleton" />
      ))}
    </div>
    <div className="divide-y divide-slate-800/60">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="h-3 flex-1 bg-slate-800/40 rounded animate-skeleton" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-4 animate-skeleton max-w-lg">
    <div className="h-4 w-1/4 bg-slate-800 rounded" />
    <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
    <div className="h-4 w-1/3 bg-slate-800 rounded" />
    <div className="h-20 w-full bg-slate-800/60 rounded-xl" />
    <div className="h-10 w-28 bg-indigo-600/40 rounded-xl ml-auto" />
  </div>
);
