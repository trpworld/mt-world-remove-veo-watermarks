import React, { useState, useEffect, useMemo } from 'react';
import { VideoJob, BatchStats, ProcessingSettings, WatermarkRegion, WatermarkProfileType } from './types';
import { QueueManager } from './services/QueueManager';
import { Header } from './components/Header';
import { HeroDropzone } from './components/HeroDropzone';
import { StatsDashboard } from './components/StatsDashboard';
import { VideoCard } from './components/VideoCard';
import { WatermarkSelectorModal } from './components/WatermarkSelectorModal';
import { BeforeAfterModal } from './components/BeforeAfterModal';
import { SettingsModal } from './components/SettingsModal';
import { CompletionBanner } from './components/CompletionBanner';
import { ShieldCheck, Plus } from 'lucide-react';
import JSZip from 'jszip';

const DEFAULT_SETTINGS: ProcessingSettings = {
  quality: 'balanced',
  concurrency: 'auto',
  engine: 'auto',
  removalMethod: 'smart-crop', // 100% Crisp Zero-Blur default
  outputFormat: 'mp4',
  preserveAudio: true,
  preserveFps: true,
  preserveResolution: true,
  profileType: 'gemini-veo',
  customRegion: {
    normX: 0.78,
    normY: 0.90,
    normW: 0.20,
    normH: 0.08,
  },
};

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const queueManager = useMemo(() => new QueueManager(settings), []);

  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [stats, setStats] = useState<BatchStats>({
    total: 0,
    completed: 0,
    processing: 0,
    queued: 0,
    failed: 0,
    overallProgress: 0,
    speedMultiplier: 1.0,
    etaSeconds: 0,
    totalBytes: 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [comparingJob, setComparingJob] = useState<VideoJob | null>(null);

  useEffect(() => {
    const unsubscribe = queueManager.subscribe((updatedJobs, updatedStats) => {
      setJobs(updatedJobs);
      setStats(updatedStats);
      setIsApiAvailable(queueManager.isApiAvailable());
      setIsProcessing(updatedStats.processing > 0 || (updatedStats.queued > 0 && updatedStats.overallProgress > 0));
    });

    return () => unsubscribe();
  }, [queueManager]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + O -> Open files
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
      }
      // Space -> Pause / Resume processing
      else if (e.code === 'Space' && e.target === document.body && jobs.length > 0) {
        e.preventDefault();
        if (isProcessing) {
          if (isPaused) {
            queueManager.resumeProcessing();
            setIsPaused(false);
          } else {
            queueManager.pauseProcessing();
            setIsPaused(true);
          }
        }
      }
      // Cmd/Ctrl + Enter -> Start processing
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && jobs.length > 0 && !isProcessing) {
        e.preventDefault();
        queueManager.startProcessing();
      }
      // Esc -> Close modals
      else if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsWatermarkModalOpen(false);
        setComparingJob(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jobs, isProcessing, isPaused, queueManager]);

  const handleFilesSelected = (files: File[]) => {
    queueManager.addFiles(files);
  };

  const handleUpdateSettings = (newSettings: ProcessingSettings) => {
    setSettings(newSettings);
    queueManager.updateSettings(newSettings);
  };

  const handleApplyWatermarkRegion = (region: WatermarkRegion, profileType: WatermarkProfileType) => {
    const updated = { ...settings, customRegion: region, profileType };
    handleUpdateSettings(updated);
  };

  const handleDownloadAllZip = async () => {
    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED' && j.processedUrl);
    if (completedJobs.length === 0) return;

    try {
      const zip = new JSZip();
      for (const job of completedJobs) {
        const response = await fetch(job.processedUrl!);
        const blob = await response.blob();
        const cleanName = `${job.name.replace(/\.[^/.]+$/, '')}_clean.mp4`;
        zip.file(cleanName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `MT_WORLD_VEO_CLEANED_${dateStr}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('ZIP generation error:', err);
    }
  };

  const isBatchFinished = stats.total > 0 && stats.completed + stats.failed === stats.total && !isProcessing;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Workstation Top Navigation Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWatermarkSelector={() => setIsWatermarkModalOpen(true)}
        isApiAvailable={isApiAvailable}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Landing Dropzone state when no jobs */}
        {jobs.length === 0 ? (
          <HeroDropzone onFilesSelected={handleFilesSelected} currentCount={jobs.length} />
        ) : (
          <div>
            {/* Completion Celebration Banner */}
            {isBatchFinished && (
              <CompletionBanner
                stats={stats}
                onDownloadZip={handleDownloadAllZip}
                onStartNewBatch={() => queueManager.clearAll()}
              />
            )}

            {/* Queue Metrics & Controls Dashboard */}
            <StatsDashboard
              stats={stats}
              isProcessing={isProcessing}
              isPaused={isPaused}
              onStart={() => queueManager.startProcessing()}
              onPause={() => {
                queueManager.pauseProcessing();
                setIsPaused(true);
              }}
              onResume={() => {
                queueManager.resumeProcessing();
                setIsPaused(false);
              }}
              onCancel={() => {
                queueManager.cancelAll();
                setIsPaused(false);
              }}
              onClear={() => queueManager.clearAll()}
              onRetryFailed={() => queueManager.retryFailed()}
              onDownloadZip={handleDownloadAllZip}
            />

            {/* Video Queue Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center">
                Video Queue ({jobs.length}/100)
              </h3>

              {jobs.length < 100 && (
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  className="inline-flex items-center text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/20"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add More Videos
                </button>
              )}
            </div>

            {/* Hidden Input for Adding More Videos */}
            <input
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
              className="hidden"
              onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
            />

            {/* Video Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <VideoCard
                  key={job.id}
                  job={job}
                  onRemove={(id) => queueManager.removeJob(id)}
                  onRetry={(id) => queueManager.retryJob(id)}
                  onCompare={(jobToCompare) => setComparingJob(jobToCompare)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Legal & Privacy Footer Notice */}
      <footer className="w-full border-t border-slate-800/80 py-4 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Use this tool only on content you own or have permission to edit.</span>
          </div>
          <div>MT WORLD • Remove Veo Watermarks v1.0 • Hardware Engine</div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        isApiAvailable={isApiAvailable}
      />

      <WatermarkSelectorModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        initialRegion={settings.customRegion}
        sampleVideoFile={jobs[0]?.file}
        onApplyToAll={handleApplyWatermarkRegion}
      />

      <BeforeAfterModal job={comparingJob} onClose={() => setComparingJob(null)} />
    </div>
  );
};

export default App;
