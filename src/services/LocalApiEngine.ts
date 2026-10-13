import { VideoJob, ProcessingSettings, WatermarkRegion } from '../types';

export class LocalApiEngine {
  private static API_BASE = '/api';

  static async checkStatus(): Promise<{ available: boolean; cpus?: number; hasVideoToolbox?: boolean }> {
    try {
      const res = await fetch(`${this.API_BASE}/status`);
      if (!res.ok) return { available: false };
      const data = await res.json();
      return {
        available: data.status === 'online',
        cpus: data.hardware?.cpus || 4,
        hasVideoToolbox: data.hardware?.hasVideoToolbox || false,
      };
    } catch (e) {
      return { available: false };
    }
  }

  static async processVideo(
    job: VideoJob,
    region: WatermarkRegion,
    settings: ProcessingSettings,
    onProgress: (progress: number, fps: number, speed: string) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('video', job.file);
    formData.append('jobId', job.id);
    formData.append('normX', region.normX.toString());
    formData.append('normY', region.normY.toString());
    formData.append('normW', region.normW.toString());
    formData.append('normH', region.normH.toString());
    formData.append('quality', settings.quality);
    formData.append('removalMethod', settings.removalMethod || 'smart-crop');

    const uploadRes = await fetch(`${this.API_BASE}/process`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to submit video for local processing');
    }

    const { jobId } = await uploadRes.json();

    // Poll status until completion or failure
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${this.API_BASE}/jobs/${jobId}/status`);
          if (!statusRes.ok) return;

          const statusData = await statusRes.json();
          onProgress(statusData.progress || 0, statusData.fps || 0, statusData.speed || '1.0x');

          if (statusData.status === 'COMPLETED') {
            clearInterval(interval);
            const downloadUrl = `${this.API_BASE}/jobs/${jobId}/download`;
            resolve(downloadUrl);
          } else if (statusData.status === 'FAILED') {
            clearInterval(interval);
            reject(new Error(statusData.error || 'Video processing failed'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 500);
    });
  }

  static async downloadBatchZip(jobIds: string[]): Promise<Blob> {
    const res = await fetch(`${this.API_BASE}/batch/download-zip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate ZIP archive');
    }

    return await res.blob();
  }
}
