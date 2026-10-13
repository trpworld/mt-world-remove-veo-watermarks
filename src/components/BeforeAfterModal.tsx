import React, { useState, useRef, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { VideoJob } from '../types';

interface BeforeAfterModalProps {
  job: VideoJob | null;
  onClose: () => void;
}

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({ job, onClose }) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100 percentage
  const [origUrl, setOrigUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoBeforeRef = useRef<HTMLVideoElement>(null);
  const videoAfterRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (job) {
      const url = URL.createObjectURL(job.file);
      setOrigUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [job]);

  if (!job || !job.processedUrl) return null;

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pos = (x / rect.width) * 100;
    setSliderPos(pos);
  };

  const handlePlaySync = () => {
    if (videoBeforeRef.current && videoAfterRef.current) {
      videoAfterRef.current.currentTime = videoBeforeRef.current.currentTime;
      if (videoBeforeRef.current.paused) {
        videoBeforeRef.current.play();
        videoAfterRef.current.play();
      } else {
        videoBeforeRef.current.pause();
        videoAfterRef.current.pause();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate max-w-md">{job.name}</h3>
              <p className="text-xs text-slate-400">Before & After Watermark Removal Comparison</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Interactive Split Slider Video Comparison */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950 select-none">
          <div
            ref={containerRef}
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
            onClick={handlePlaySync}
            className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-ew-resize shadow-2xl"
          >
            {/* After Cleaned Video (Base Layer) */}
            <video
              ref={videoAfterRef}
              src={job.processedUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-contain bg-black"
            />

            {/* Before Original Video (Clipped Layer) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden bg-black"
              style={{ width: `${sliderPos}%` }}
            >
              <video
                ref={videoBeforeRef}
                src={origUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-y-0 left-0 h-full w-auto max-w-none object-contain"
                style={{ width: containerRef.current?.clientWidth || '100%' }}
              />
              <span className="absolute top-4 left-4 bg-rose-500/80 text-white font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm border border-rose-400/30">
                BEFORE (WITH WATERMARK)
              </span>
            </div>

            <span className="absolute top-4 right-4 bg-emerald-500/80 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-lg">
              AFTER (CLEANED)
            </span>

            {/* Divider Line & Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-xl shadow-cyan-500/80 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-2xl border-2 border-slate-950">
                ↔
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Drag slider left/right to compare original vs cleaned video frame. Click video to pause/play.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <a
            href={job.processedUrl}
            download={`${job.name.replace(/\.[^/.]+$/, '')}_clean.mp4`}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            Download Cleaned File
          </a>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
