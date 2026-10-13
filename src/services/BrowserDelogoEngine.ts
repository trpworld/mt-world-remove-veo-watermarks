import { VideoJob, WatermarkRegion, ProcessingSettings } from '../types';

export class BrowserDelogoEngine {
  /**
   * Process a single video file using Canvas spatial delogo + MediaRecorder in the browser.
   */
  static async processVideoInBrowser(
    job: VideoJob,
    region: WatermarkRegion,
    settings: ProcessingSettings,
    onProgress: (progress: number, fps: number, speed: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      const fileUrl = URL.createObjectURL(job.file);
      video.src = fileUrl;

      video.onloadedmetadata = async () => {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const duration = video.duration || 10;
        const fps = job.metadata?.fps || 24;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          URL.revokeObjectURL(fileUrl);
          return reject(new Error('Canvas 2D context unavailable'));
        }

        // Capture stream from canvas
        const stream = canvas.captureStream(fps);

        // Extract audio stream from source video if requested
        if (settings.preserveAudio) {
          try {
            const audioCtx = new AudioContext();
            const sourceNode = audioCtx.createMediaElementSource(video);
            const destNode = audioCtx.createMediaStreamDestination();
            sourceNode.connect(destNode);
            const audioTrack = destNode.stream.getAudioTracks()[0];
            if (audioTrack) {
              stream.addTrack(audioTrack);
            }
          } catch (e) {
            console.warn('Audio track extraction fallback:', e);
          }
        }

        // Configure MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
          ? 'video/mp4;codecs=avc1'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(fileUrl);
          const finalBlob = new Blob(chunks, { type: mimeType });
          const cleanedUrl = URL.createObjectURL(finalBlob);
          onProgress(100, fps, '1.0x');
          resolve(cleanedUrl);
        };

        mediaRecorder.onerror = () => {
          URL.revokeObjectURL(fileUrl);
          reject(new Error('MediaRecorder encoding error'));
        };

        // Start recording
        mediaRecorder.start(100);
        video.play();

        const startTime = Date.now();
        const removalMethod = settings.removalMethod || 'smart-crop';

        // Frame rendering loop
        const renderLoop = () => {
          if (video.ended || video.paused || video.currentTime >= duration) {
            mediaRecorder.stop();
            return;
          }

          if (removalMethod === 'smart-crop') {
            // 🌟 SMART MICRO-CROP & SCALE FILL (100% Sharp, Zero Blur)
            // Trims off bottom watermark margin and rescales to canvas
            const cropRatio = Math.max(0.88, Math.min(0.96, region.normY - 0.01));
            const sourceH = Math.round(height * cropRatio);
            ctx.drawImage(video, 0, 0, width, sourceH, 0, 0, width, height);
          } else {
            // 🎨 SHARP EDGE INPAINT (No heavy blur filter)
            ctx.drawImage(video, 0, 0, width, height);

            const pxX = Math.round(region.normX * width);
            const pxY = Math.round(region.normY * height);
            const pxW = Math.round(region.normW * width);
            const pxH = Math.round(region.normH * height);

            if (pxW > 0 && pxH > 0) {
              const pad = 2;
              const sx = Math.max(0, pxX - pad);
              const sy = Math.max(0, pxY - pad);
              const sw = Math.min(width - sx, pxW + pad * 2);
              const sh = Math.min(height - sy, pxH + pad * 2);

              try {
                const imgData = ctx.getImageData(sx, sy, sw, sh);
                const data = imgData.data;

                for (let y = pad; y < sh - pad; y++) {
                  for (let x = pad; x < sw - pad; x++) {
                    const idx = (y * sw + x) * 4;
                    const topIdx = (pad * sw + x) * 4;
                    const leftIdx = (y * sw + pad) * 4;

                    const weightY = (y - pad) / (sh - pad * 2);
                    const weightX = (x - pad) / (sw - pad * 2);

                    data[idx] = Math.round(data[topIdx] * (1 - weightY) + data[leftIdx] * weightY);
                    data[idx + 1] = Math.round(data[topIdx + 1] * (1 - weightY) + data[leftIdx + 1] * weightY);
                    data[idx + 2] = Math.round(data[topIdx + 2] * (1 - weightY) + data[leftIdx + 2] * weightY);
                  }
                }
                ctx.putImageData(imgData, sx, sy);
              } catch (e) {}
            }
          }

          // Progress calculation
          const currTime = video.currentTime;
          const prog = Math.min(99, Math.round((currTime / duration) * 100));
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speedRatio = currTime > 0 && elapsedSec > 0 ? (currTime / elapsedSec).toFixed(1) : '1.0';

          onProgress(prog, fps, `${speedRatio}x`);

          requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
      };

      video.onerror = () => {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Failed to load video file in browser engine'));
      };
    });
  }
}
