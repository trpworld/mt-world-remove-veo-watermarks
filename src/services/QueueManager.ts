import { VideoJob, ProcessingSettings, BatchStats, WatermarkRegion } from '../types';
import { LocalApiEngine } from './LocalApiEngine';
import { BrowserDelogoEngine } from './BrowserDelogoEngine';

export type QueueStateListener = (jobs: VideoJob[], stats: BatchStats) => void;

export class QueueManager {
  private jobs: VideoJob[] = [];
  private settings: ProcessingSettings;
  private isProcessing = false;
  private isPaused = false;
  private activeCount = 0;
  private listeners: QueueStateListener[] = [];
  private localApiAvailable = false;
  private startTime = 0;

  constructor(initialSettings: ProcessingSettings) {
    this.settings = initialSettings;
    this.checkLocalApi();
  }

  public async checkLocalApi() {
    const status = await LocalApiEngine.checkStatus();
    this.localApiAvailable = status.available;
  }

  public subscribe(listener: QueueStateListener) {
    this.listeners.push(listener);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const stats = this.getStats();
    this.listeners.forEach((l) => l(this.jobs, stats));
  }

  public updateSettings(newSettings: ProcessingSettings) {
    this.settings = newSettings;
    this.notify();
  }

  public addFiles(files: File[]) {
    // Max 100 limit check
    const currentCount = this.jobs.length;
    const allowedToAdd = Math.min(files.length, 100 - currentCount);

    const newJobs: VideoJob[] = files.slice(0, allowedToAdd).map((file, idx) => ({
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      status: 'QUEUED',
      progress: 0,
      speed: '0.0x',
      etaSeconds: 0,
      region: { ...this.settings.customRegion },
      quality: this.settings.quality,
    }));

    this.jobs = [...this.jobs, ...newJobs];
    this.notify();
    return allowedToAdd;
  }

  public removeJob(id: string) {
    const job = this.jobs.find((j) => j.id === id);
    if (job?.processedUrl) {
      URL.revokeObjectURL(job.processedUrl);
    }
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  public clearAll() {
    this.jobs.forEach((j) => {
      if (j.processedUrl) URL.revokeObjectURL(j.processedUrl);
    });
    this.jobs = [];
    this.isProcessing = false;
    this.isPaused = false;
    this.activeCount = 0;
    this.notify();
  }

  public getEffectiveConcurrency(): number {
    if (typeof this.settings.concurrency === 'number') {
      return this.settings.concurrency;
    }
    // Auto concurrency detection
    const cores = navigator.hardwareConcurrency || 4;
    if (cores >= 12) return 6;
    if (cores >= 8) return 4;
    return 2;
  }

  public async startProcessing() {
    if (this.isProcessing && !this.isPaused) return;

    this.isProcessing = true;
    this.isPaused = false;
    if (this.startTime === 0) this.startTime = Date.now();

    this.processNextJobs();
  }

  public pauseProcessing() {
    this.isPaused = true;
    this.notify();
  }

  public resumeProcessing() {
    if (!this.isProcessing) {
      this.startProcessing();
    } else {
      this.isPaused = false;
      this.processNextJobs();
    }
  }

  public cancelAll() {
    this.isProcessing = false;
    this.isPaused = false;
    this.activeCount = 0;
    this.jobs.forEach((j) => {
      if (j.status === 'PROCESSING' || j.status === 'DECODING' || j.status === 'ENCODING') {
        j.status = 'QUEUED';
        j.progress = 0;
      }
    });
    this.notify();
  }

  public retryFailed() {
    this.jobs.forEach((j) => {
      if (j.status === 'FAILED') {
        j.status = 'QUEUED';
        j.progress = 0;
        j.error = undefined;
      }
    });
    this.startProcessing();
  }

  public retryJob(id: string) {
    const job = this.jobs.find((j) => j.id === id);
    if (job) {
      job.status = 'QUEUED';
      job.progress = 0;
      job.error = undefined;
      this.startProcessing();
    }
  }

  private async processNextJobs() {
    if (this.isPaused || !this.isProcessing) return;

    const maxConcurrency = this.getEffectiveConcurrency();

    while (this.activeCount < maxConcurrency) {
      const nextJob = this.jobs.find((j) => j.status === 'QUEUED');
      if (!nextJob) break;

      this.activeCount++;
      nextJob.status = 'PROCESSING';
      nextJob.startTime = Date.now();
      this.notify();

      this.executeJob(nextJob).finally(() => {
        this.activeCount--;
        this.notify();
        this.processNextJobs();
      });
    }

    // Check if batch complete
    if (this.activeCount === 0 && !this.jobs.some((j) => j.status === 'QUEUED')) {
      this.isProcessing = false;
      this.notify();
    }
  }

  private async executeJob(job: VideoJob) {
    const useLocalApi = this.settings.engine === 'local-hardware' ||
      (this.settings.engine === 'auto' && this.localApiAvailable);

    try {
      let outputUrl = '';
      if (useLocalApi) {
        outputUrl = await LocalApiEngine.processVideo(
          job,
          job.region,
          this.settings,
          (progress, fps, speed) => {
            job.progress = progress;
            job.speed = speed;
            this.notify();
          }
        );
      } else {
        outputUrl = await BrowserDelogoEngine.processVideoInBrowser(
          job,
          job.region,
          this.settings,
          (progress, fps, speed) => {
            job.progress = progress;
            job.speed = speed;
            this.notify();
          }
        );
      }

      job.status = 'COMPLETED';
      job.progress = 100;
      job.processedUrl = outputUrl;
      job.completedTime = Date.now();
    } catch (err: any) {
      console.error(`Job ${job.id} failed:`, err);
      job.status = 'FAILED';
      job.error = err?.message || 'Processing error occurred';
    }
  }

  public getStats(): BatchStats {
    const total = this.jobs.length;
    const completed = this.jobs.filter((j) => j.status === 'COMPLETED').length;
    const processing = this.jobs.filter((j) => j.status === 'PROCESSING' || j.status === 'DECODING' || j.status === 'ENCODING').length;
    const queued = this.jobs.filter((j) => j.status === 'QUEUED').length;
    const failed = this.jobs.filter((j) => j.status === 'FAILED').length;

    let totalProgressSum = 0;
    this.jobs.forEach((j) => {
      if (j.status === 'COMPLETED') totalProgressSum += 100;
      else if (j.status === 'PROCESSING') totalProgressSum += j.progress;
    });

    const overallProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;
    const totalBytes = this.jobs.reduce((acc, j) => acc + j.size, 0);

    // Calculate speed and ETA
    let avgSpeed = 1.0;
    const activeProcessing = this.jobs.filter((j) => j.status === 'PROCESSING');
    if (activeProcessing.length > 0) {
      const speeds = activeProcessing.map((j) => parseFloat(j.speed.replace('x', '')) || 1.0);
      avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    }

    const remainingJobs = queued + processing;
    const estimatedSecsPerJob = 10 / Math.max(1, avgSpeed);
    const etaSeconds = Math.round((remainingJobs * estimatedSecsPerJob) / Math.max(1, this.getEffectiveConcurrency()));

    return {
      total,
      completed,
      processing,
      queued,
      failed,
      overallProgress,
      speedMultiplier: parseFloat(avgSpeed.toFixed(1)),
      etaSeconds,
      totalBytes,
    };
  }

  public getJobs() {
    return this.jobs;
  }

  public getSettings() {
    return this.settings;
  }

  public isApiAvailable() {
    return this.localApiAvailable;
  }
}
