export type WatermarkProfileType = 'gemini-veo' | 'bottom-right' | 'bottom-left' | 'custom';

export type RemovalMethod = 'smart-crop' | 'delogo-sharp' | 'corner-patch';

export interface WatermarkRegion {
  normX: number; // 0 to 1
  normY: number; // 0 to 1
  normW: number; // 0 to 1
  normH: number; // 0 to 1
}

export type JobStatus = 'QUEUED' | 'DECODING' | 'PROCESSING' | 'ENCODING' | 'COMPLETED' | 'FAILED';

export type QualityMode = 'fast' | 'balanced' | 'max';

export type EngineType = 'auto' | 'local-hardware' | 'browser-webcodecs';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  fileSize: number;
  aspectRatio: string;
}

export interface VideoJob {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbnailUrl?: string;
  processedUrl?: string;
  metadata?: VideoMetadata;
  status: JobStatus;
  progress: number;
  speed: string; // e.g. "4.8x"
  etaSeconds: number;
  error?: string;
  region: WatermarkRegion;
  quality: QualityMode;
  startTime?: number;
  completedTime?: number;
}

export interface ProcessingSettings {
  quality: QualityMode;
  concurrency: number | 'auto'; // 'auto' or number
  engine: EngineType;
  removalMethod: RemovalMethod; // 'smart-crop' (100% sharp, zero blur) or 'delogo-sharp'
  outputFormat: 'mp4';
  preserveAudio: boolean;
  preserveFps: boolean;
  preserveResolution: boolean;
  profileType: WatermarkProfileType;
  customRegion: WatermarkRegion;
}

export interface BatchStats {
  total: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  overallProgress: number;
  speedMultiplier: number;
  etaSeconds: number;
  totalBytes: number;
}

export interface BatchProfile {
  id: string;
  name: string;
  settings: ProcessingSettings;
  createdAt: number;
}
