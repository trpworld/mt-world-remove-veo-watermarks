import React from 'react';
import { CheckCircle2, Download, RotateCcw, Sparkles } from 'lucide-react';
import { BatchStats } from '../types';

interface CompletionBannerProps {
  stats: BatchStats;
  onDownloadZip: () => void;
  onStartNewBatch: () => void;
}

export const CompletionBanner: React.FC<CompletionBannerProps> = ({
  stats,
  onDownloadZip,
  onStartNewBatch,
}) => {
  return (
    <div className="w-full glass-panel rounded-3xl p-8 mb-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-cyan-950/30 shadow-2xl shadow-emerald-500/10 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="h-48 w-48 text-emerald-400" />
      </div>

      <div className="mx-auto h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono mb-2">
        BATCH COMPLETE
      </h2>
      <p className="text-base text-slate-300 font-semibold mb-6">
        <span className="text-emerald-400 font-bold">{stats.completed}</span> / {stats.total} VIDEOS PROCESSED
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 max-w-md mx-auto">
        <button
          onClick={onDownloadZip}
          className="flex-1 inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 transition-all scale-[1.02] hover:scale-[1.04]"
        >
          <Download className="h-5 w-5 mr-2" />
          DOWNLOAD ALL ZIP
        </button>

        <button
          onClick={onStartNewBatch}
          className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm transition-all"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          START NEW BATCH
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-slate-400 font-medium">
        <span>Successful: <strong className="text-emerald-400">{stats.completed}</strong></span>
        <span>Failed: <strong className="text-rose-400">{stats.failed}</strong></span>
      </div>
    </div>
  );
};
