import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Setup temp directories
const TEMP_DIR = path.join(os.tmpdir(), 'veo_batch_temp');
const UPLOAD_DIR = path.join(TEMP_DIR, 'uploads');
const OUTPUT_DIR = path.join(TEMP_DIR, 'outputs');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit per video
});

// Active processing jobs store
const activeJobs = new Map();

// Helper: Check system capability
async function checkFFmpegCapability() {
  try {
    const [versionRes, encodersRes] = await Promise.all([
      execFileAsync('ffmpeg', ['-version']).catch(() => ({ stdout: '' })),
      execFileAsync('ffmpeg', ['-encoders']).catch(() => ({ stdout: '' })),
    ]);
    const hasVideoToolbox = encodersRes.stdout.includes('h264_videotoolbox') || versionRes.stdout.includes('videotoolbox');
    return {
      available: true,
      hasVideoToolbox,
      cpus: os.cpus().length,
      totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1),
    };
  } catch (err) {
    return { available: false, error: 'FFmpeg not found in system PATH' };
  }
}

// Helper: Probe video dimensions and metadata
async function probeVideo(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames',
      '-of', 'json',
      filePath,
    ]);
    const parsed = JSON.parse(stdout);
    const stream = parsed.streams?.[0] || {};
    let fps = 24;
    if (stream.r_frame_rate) {
      const parts = stream.r_frame_rate.split('/');
      if (parts.length === 2 && Number(parts[1]) > 0) {
        fps = Math.round(Number(parts[0]) / Number(parts[1]));
      } else {
        fps = Math.round(Number(parts[0]));
      }
    }
    return {
      width: stream.width || 1280,
      height: stream.height || 720,
      duration: parseFloat(stream.duration || '0'),
      nb_frames: parseInt(stream.nb_frames || '0', 10),
      fps: fps || 24,
    };
  } catch (err) {
    // Robust fallback: Probe metadata directly using ffmpeg -i
    try {
      const result = await execFileAsync('ffmpeg', ['-i', filePath]).catch((e) => ({
        stderr: e.stderr || '',
        stdout: e.stdout || '',
      }));
      const output = (result.stderr || '') + (result.stdout || '');
      const dimMatch = output.match(/,\s*(\d{2,5})x(\d{2,5})/);
      const durMatch = output.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      const fpsMatch = output.match(/(\d+(?:\.\d+)?)\s*fps/);

      let duration = 10;
      if (durMatch) {
        duration =
          parseInt(durMatch[1], 10) * 3600 +
          parseInt(durMatch[2], 10) * 60 +
          parseFloat(durMatch[3]);
      }
      const width = dimMatch ? parseInt(dimMatch[1], 10) : 1280;
      const height = dimMatch ? parseInt(dimMatch[2], 10) : 720;
      const fps = fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : 24;
      const nb_frames = Math.round(duration * fps);

      return { width, height, duration, nb_frames, fps };
    } catch (fallbackErr) {
      console.error('Probe video error:', fallbackErr);
      return { width: 1280, height: 720, duration: 10, nb_frames: 240, fps: 24 };
    }
  }
}

// System Status Endpoint
app.get('/api/status', async (req, res) => {
  const sysInfo = await checkFFmpegCapability();
  res.json({
    status: 'online',
    engine: 'FFmpeg Hardware Engine',
    hardware: sysInfo,
    activeJobsCount: activeJobs.size,
  });
});

// Single Video Watermark Removal Processing Endpoint
app.post('/api/process', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const inputPath = req.file.path;
  const jobId = req.body.jobId || `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const originalName = req.file.originalname || 'video.mp4';
  const nameWithoutExt = path.basename(originalName, path.extname(originalName));
  const outputFileName = `${nameWithoutExt}_clean.mp4`;
  const outputPath = path.join(OUTPUT_DIR, `${jobId}_${outputFileName}`);

  // Watermark parameters & Removal Method
  const normX = parseFloat(req.body.normX || '0.78');
  const normY = parseFloat(req.body.normY || '0.90');
  const normW = parseFloat(req.body.normW || '0.20');
  const normH = parseFloat(req.body.normH || '0.08');
  const qualityMode = req.body.quality || 'balanced'; // fast, balanced, max
  const removalMethod = req.body.removalMethod || 'smart-crop'; // 'smart-crop' (100% sharp zero-blur) or 'delogo-sharp'

  // Probe metadata
  const meta = await probeVideo(inputPath);

  let filterString = '';

  if (removalMethod === 'smart-crop') {
    // 🌟 SMART MICRO-CROP & SCALE FILL MODE (100% CRISP, ZERO BLUR)
    // Trims the bottom margin containing the watermark (or bottom corner) and rescales seamlessly
    // Result: 100% sharp video with NO blur box whatsoever!
    const cropHeightRatio = Math.max(0.88, Math.min(0.96, normY - 0.01));
    const cropPixelH = Math.round(meta.height * cropHeightRatio);

    filterString = `crop=iw:${cropPixelH}:0:0,scale=w=${meta.width}:h=${meta.height}:flags=bicubic+accurate_rnd`;
  } else {
    // 🎨 SHARP DELOGO MODE (Tight boundary without wide blur halo)
    let pxX = Math.round(normX * meta.width);
    let pxY = Math.round(normY * meta.height);
    let pxW = Math.round(normW * meta.width);
    let pxH = Math.round(normH * meta.height);

    pxW = Math.min(pxW, meta.width - pxX);
    pxH = Math.min(pxH, meta.height - pxY);
    pxX = Math.max(0, pxX);
    pxY = Math.max(0, pxY);

    filterString = `delogo=x=${pxX}:y=${pxY}:w=${pxW}:h=${pxH}:band=1:show=0`;
  }

  // Codec selection (h264_videotoolbox on Mac GPU, or libx264)
  const sysInfo = await checkFFmpegCapability();
  let videoCodec = 'libx264';
  let encoderArgs = ['-preset', 'ultrafast', '-crf', '22'];

  if (sysInfo.hasVideoToolbox && qualityMode !== 'max') {
    videoCodec = 'h264_videotoolbox';
    const bitrate = qualityMode === 'fast' ? '4M' : '8M';
    encoderArgs = ['-b:v', bitrate];
  } else if (qualityMode === 'fast') {
    encoderArgs = ['-preset', 'ultrafast', '-crf', '24'];
  } else if (qualityMode === 'max') {
    encoderArgs = ['-preset', 'medium', '-crf', '17'];
  }

  const args = [
    '-y',
    '-i', inputPath,
    '-vf', filterString,
    '-c:v', videoCodec,
    ...encoderArgs,
    '-c:a', 'copy', // Preserve exact original audio
    '-progress', 'pipe:1',
    outputPath,
  ];

  // Store job state
  const jobRecord = {
    id: jobId,
    originalName,
    outputFileName,
    inputPath,
    outputPath,
    status: 'PROCESSING',
    progress: 0,
    fps: 0,
    speed: '1.0x',
    startTime: Date.now(),
    duration: meta.duration,
    nbFrames: meta.nb_frames,
  };
  activeJobs.set(jobId, jobRecord);

  // Spawn FFmpeg process
  const ffProc = spawn('ffmpeg', args);
  jobRecord.process = ffProc;

  ffProc.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('frame=')) {
        const frameNum = parseInt(line.split('=')[1].trim(), 10);
        if (jobRecord.nbFrames > 0 && !isNaN(frameNum)) {
          jobRecord.progress = Math.min(99, Math.round((frameNum / jobRecord.nbFrames) * 100));
        }
      } else if (line.startsWith('fps=')) {
        jobRecord.fps = parseFloat(line.split('=')[1].trim()) || 0;
      } else if (line.startsWith('speed=')) {
        jobRecord.speed = line.split('=')[1].trim() || '1.0x';
      }
    }
  });

  ffProc.on('close', (code) => {
    if (code === 0) {
      jobRecord.status = 'COMPLETED';
      jobRecord.progress = 100;
      jobRecord.completedTime = Date.now();
    } else {
      jobRecord.status = 'FAILED';
      jobRecord.error = `FFmpeg exited with code ${code}`;
    }
    // Cleanup input file
    try { fs.unlinkSync(inputPath); } catch (e) {}
  });

  res.json({
    jobId,
    status: 'QUEUED',
    originalName,
    outputFileName,
    width: meta.width,
    height: meta.height,
    duration: meta.duration,
  });
});

// Query Job Status
app.get('/api/jobs/:id/status', (req, res) => {
  const job = activeJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    fps: job.fps,
    speed: job.speed,
    error: job.error,
  });
});

// Download Cleaned Video
app.get('/api/jobs/:id/download', (req, res) => {
  const job = activeJobs.get(req.params.id);
  if (!job || job.status !== 'COMPLETED' || !fs.existsSync(job.outputPath)) {
    return res.status(404).send('Cleaned video not found or job incomplete');
  }

  res.download(job.outputPath, job.outputFileName);
});

// Download All Completed Jobs as ZIP
app.post('/api/batch/download-zip', async (req, res) => {
  const { jobIds } = req.body;
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({ error: 'No job IDs specified' });
  }

  const zip = new JSZip();
  let addedCount = 0;

  for (const id of jobIds) {
    const job = activeJobs.get(id);
    if (job && job.status === 'COMPLETED' && fs.existsSync(job.outputPath)) {
      const fileData = fs.readFileSync(job.outputPath);
      zip.file(job.outputFileName, fileData);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    return res.status(400).json({ error: 'No completed files found for ZIP export' });
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
  const dateStr = new Date().toISOString().split('T')[0];
  const zipName = `MT_WORLD_VEO_CLEANED_${dateStr}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
  res.send(zipBuffer);
});

// Serve frontend dist assets in production
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start backend server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MT WORLD - REMOVE VEO WATERMARKS] Hardware server active on http://0.0.0.0:${PORT}`);
});
