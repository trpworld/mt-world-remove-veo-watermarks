import React, { useRef, useState } from 'react';
import { UploadCloud, Film, Zap, ShieldCheck, Layers, FileVideo } from 'lucide-react';

interface HeroDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  currentCount: number;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({ onFilesSelected, currentCount }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const videoFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name)
      );
      if (videoFiles.length > 0) {
        onFilesSelected(videoFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const videoFiles = Array.from(e.target.files);
      onFilesSelected(videoFiles);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4 tracking-wider uppercase font-mono">
          MT WORLD
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Remove Veo Watermarks in <span className="text-gradient">Batch</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal">
          Remove supported visible Gemini & Veo watermarks from up to 100 videos in one click. Local hardware accelerated processing with original audio & quality preservation.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 border-2 border-dashed ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/20 scale-[1.01]'
            : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mx-auto h-20 w-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <UploadCloud className="h-10 w-10 text-cyan-400" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {currentCount > 0 ? 'Add More Videos to Queue' : 'Select or Drag & Drop Videos'}
        </h3>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Supported formats: MP4, MOV, WebM, MKV • Maximum 100 videos per batch
        </p>

        <div className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all group-hover:shadow-cyan-500/40">
          <FileVideo className="h-5 w-5 mr-2" />
          SELECT VIDEOS
        </div>

        {currentCount >= 100 && (
          <p className="mt-4 text-xs font-semibold text-amber-400 bg-amber-500/10 py-1.5 px-3 rounded-full inline-block">
            Maximum limit reached (100/100 videos selected)
          </p>
        )}
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="glass-panel p-5 rounded-2xl flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">100 Video Batch</h4>
            <p className="text-xs text-slate-400 mt-0.5">Process entire folder queues in one click.</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Ultra Fast</h4>
            <p className="text-xs text-slate-400 mt-0.5">Hardware accelerated GPU parallel processing.</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Quality First</h4>
            <p className="text-xs text-slate-400 mt-0.5">Preserves resolution, FPS & audio track.</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">100% Private</h4>
            <p className="text-xs text-slate-400 mt-0.5">Processes locally on your computer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
