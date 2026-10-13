import React from 'react';
import {
  Play,
  Pause,
  XCircle,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { BatchStats } from '../types';

interface StatsDashboardProps {
  stats: BatchStats;
  isProcessing: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onClear: () => void;
  onRetryFailed: () => void;
  onDownloadZip: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  isProcessing,
  isPaused,
  onStart,
  onPause,
  onResume,
  onCancel,
  onClear,
  onRetryFailed,
  onDownloadZip,
}) => {
  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 mb-8 border border-slate-800 shadow-2xl">
      {/* Top Header & Main Batch Control Button */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-3">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-500/50" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
              {isProcessing
                ? isPaused
                  ? 'BATCH PROCESSING PAUSED'
                  : 'PROCESSING BATCH QUEUE'
                : stats.completed > 0 && stats.completed === stats.total
                ? 'ALL VIDEOS COMPLETED'
                : `BATCH QUEUE (${stats.total} VIDEOS)`}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total Input Size: <span className="text-slate-200 font-semibold">{formatSize(stats.totalBytes)}</span>
          </p>
        </div>

        {/* Primary Action Button Cluster */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {!isProcessing && stats.queued > 0 && (
            <button
              onClick={onStart}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition-all scale-[1.02] hover:scale-[1.04]"
            >
              <Play className="h-5 w-5 mr-2 fill-slate-950" />
              REMOVE WATERMARK FROM ALL
            </button>
          )}

          {isProcessing && !isPaused && (
            <button
              onClick={onPause}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-sm transition-all"
            >
              <Pause className="h-4 w-4 mr-2 fill-amber-300" />
              PAUSE ALL
            </button>
          )}

          {isProcessing && isPaused && (
            <button
              onClick={onResume}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-sm transition-all"
            >
              <Play className="h-4 w-4 mr-2 fill-emerald-300" />
              RESUME
            </button>
          )}

          {isProcessing && (
            <button
              onClick={onCancel}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 font-bold text-xs transition-all"
            >
              <XCircle className="h-4 w-4 mr-1.5 inline text-rose-400" />
              CANCEL ALL
            </button>
          )}

          {stats.completed > 0 && (
            <button
              onClick={onDownloadZip}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Download className="h-5 w-5 mr-2" />
              DOWNLOAD ALL (ZIP)
            </button>
          )}

          {stats.failed > 0 && !isProcessing && (
            <button
              onClick={onRetryFailed}
              className="px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <RotateCcw className="h-4 w-4 mr-1.5 inline" />
              RETRY FAILED ({stats.failed})
            </button>
          )}

          {!isProcessing && stats.total > 0 && (
            <button
              onClick={onClear}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
              title="Clear Queue"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metric Counters Bar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TOTAL</p>
          <p className="text-2xl font-black text-white font-mono mt-1">{stats.total}</p>
        </div>

        <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">COMPLETED</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1">{stats.completed}</p>
        </div>

        <div className="bg-cyan-950/20 rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">PROCESSING</p>
            <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-cyan-300 font-mono mt-1">{stats.processing}</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">QUEUED</p>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-300 font-mono mt-1">{stats.queued}</p>
        </div>

        <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-500/20 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">FAILED</p>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300 font-mono mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Progress Bar + Speed + ETA */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">
              Overall Batch Progress: <span className="text-cyan-400 font-mono text-sm">{stats.overallProgress}%</span>
            </span>
            {isProcessing && (
              <span className="text-slate-400">
                Speed: <span className="text-emerald-400 font-mono">{stats.speedMultiplier}x realtime</span>
              </span>
            )}
          </div>
          {isProcessing && (
            <span className="text-slate-400">
              ETA: <span className="text-cyan-300 font-mono">{formatTime(stats.etaSeconds)}</span>
            </span>
          )}
        </div>

        {/* Outer Bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-cyan-500/50"
            style={{ width: `${stats.overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
