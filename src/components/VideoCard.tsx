import React, { useState, useEffect } from 'react';
import {
  Film,
  Download,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { VideoJob } from '../types';

interface VideoCardProps {
  job: VideoJob;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCompare: (job: VideoJob) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ job, onRemove, onRetry, onCompare }) => {
  const [thumbUrl, setThumbUrl] = useState<string>('');

  useEffect(() => {
    // Generate object URL thumbnail for video preview
    const url = URL.createObjectURL(job.file);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [job.file]);

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="glass-panel-interactive rounded-2xl p-4 flex flex-col justify-between relative group border border-slate-800/80 shadow-md">
      {/* Top Media & File Info */}
      <div className="flex items-start space-x-3.5">
        {/* Thumbnail Preview Box */}
        <div className="relative h-20 w-28 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
          {thumbUrl ? (
            <video src={thumbUrl} className="h-full w-full object-cover" muted preload="metadata" />
          ) : (
            <Film className="h-6 w-6 text-slate-600" />
          )}

          {/* Status Badge Overlay */}
          {job.status === 'COMPLETED' && (
            <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 p-1 rounded-md shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          )}
          {job.status === 'FAILED' && (
            <div className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-md shadow-md">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          )}
          {job.status === 'PROCESSING' && (
            <div className="absolute top-1 right-1 bg-cyan-500 text-slate-950 p-1 rounded-md shadow-md animate-spin">
              <Loader2 className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Video Title & Meta details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors" title={job.name}>
            {job.name}
          </h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-400 mt-1">
            <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
              {formatSize(job.size)}
            </span>
            {job.metadata && (
              <>
                <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                  {job.metadata.width}x{job.metadata.height}
                </span>
                <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                  {job.metadata.fps} FPS
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Status Bar Area */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="flex items-center space-x-1.5 text-slate-300">
            {job.status === 'QUEUED' && <span className="text-slate-400">Queued</span>}
            {job.status === 'PROCESSING' && (
              <span className="text-cyan-400 flex items-center">
                <Zap className="h-3 w-3 mr-1 animate-pulse" /> Processing ({job.speed})
              </span>
            )}
            {job.status === 'COMPLETED' && <span className="text-emerald-400 font-bold">Cleaned Complete</span>}
            {job.status === 'FAILED' && <span className="text-rose-400">Failed</span>}
          </span>
          <span className="font-mono text-cyan-300 text-xs">{job.progress}%</span>
        </div>

        {/* Inner Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              job.status === 'COMPLETED'
                ? 'bg-emerald-400'
                : job.status === 'FAILED'
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${job.progress}%` }}
          />
        </div>

        {job.error && <p className="text-[10px] font-medium text-rose-400 mt-1 truncate" title={job.error}>{job.error}</p>}
      </div>

      {/* Footer Controls */}
      <div className="mt-3 flex items-center justify-between">
        {job.status === 'COMPLETED' && (
          <button
            onClick={() => onCompare(job)}
            className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Compare Before/After
          </button>
        )}

        <div className="flex items-center space-x-2 ml-auto">
          {job.status === 'FAILED' && (
            <button
              onClick={() => onRetry(job.id)}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs transition-all"
              title="Retry Processing"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {job.status === 'COMPLETED' && job.processedUrl && (
            <a
              href={job.processedUrl}
              download={`${job.name.replace(/\.[^/.]+$/, '')}_clean.mp4`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </a>
          )}

          <button
            onClick={() => onRemove(job.id)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
            title="Remove from queue"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
