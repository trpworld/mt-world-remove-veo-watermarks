import React from 'react';
import { X, Sliders, Cpu, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { ProcessingSettings, QualityMode, EngineType, RemovalMethod } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProcessingSettings;
  onSaveSettings: (settings: ProcessingSettings) => void;
  isApiAvailable: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  isApiAvailable,
}) => {
  if (!isOpen) return null;

  const handleQualityChange = (quality: QualityMode) => {
    onSaveSettings({ ...settings, quality });
  };

  const handleEngineChange = (engine: EngineType) => {
    onSaveSettings({ ...settings, engine });
  };

  const handleRemovalMethodChange = (removalMethod: RemovalMethod) => {
    onSaveSettings({ ...settings, removalMethod });
  };

  const handleConcurrencyChange = (concurrency: number | 'auto') => {
    onSaveSettings({ ...settings, concurrency });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Batch Processing Settings</h3>
              <p className="text-xs text-slate-400">Configure watermark algorithm, speed and output quality</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Watermark Removal Algorithm Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              REMOVAL ALGORITHM (NO BLUR ACCURACY)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleRemovalMethodChange('smart-crop')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.removalMethod === 'smart-crop'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Sparkles className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
                  <span>SMART CROP & FILL (100% Crisp, Zero Blur)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  RECOMMENDED: Trims watermark edge seamlessly and rescales to original dimensions. Result is 100% sharp with ZERO blur patch on every frame!
                </p>
              </button>

              <button
                onClick={() => handleRemovalMethodChange('delogo-sharp')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.removalMethod === 'delogo-sharp'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>SHARP DELOGO INPAINT</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Applies tight edge inpainting over exact watermark bounding box without wide Gaussian blur halos.
                </p>
              </button>
            </div>
          </div>

          {/* Quality Mode */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              PROCESSING QUALITY MODE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleQualityChange('fast')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.quality === 'fast'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">FAST</div>
                <p className="text-[11px] text-slate-400 mt-1">Fastest processing speed, reasonable quality.</p>
              </button>

              <button
                onClick={() => handleQualityChange('balanced')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.quality === 'balanced'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">BALANCED</div>
                <p className="text-[11px] text-slate-400 mt-1">Recommended default. Optimal balance of speed and clarity.</p>
              </button>

              <button
                onClick={() => handleQualityChange('max')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.quality === 'max'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">MAX QUALITY</div>
                <p className="text-[11px] text-slate-400 mt-1">Highest visual fidelity with slower encoding.</p>
              </button>
            </div>
          </div>

          {/* Engine Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              PROCESSING ENGINE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleEngineChange('auto')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.engine === 'auto'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span>AUTO (Hardware Accelerated)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically chooses local GPU hardware acceleration if available.
                </p>
              </button>

              <button
                onClick={() => handleEngineChange('browser-webcodecs')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.engine === 'browser-webcodecs'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span>BROWSER WEBCODECS</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Runs 100% inside your browser using Web Workers and Canvas.
                </p>
              </button>
            </div>
          </div>

          {/* Concurrency Level */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              PARALLEL CONCURRENCY
            </label>
            <div className="flex items-center space-x-2">
              {(['auto', 2, 4, 6, 8] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => handleConcurrencyChange(val)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    settings.concurrency === val
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {val === 'auto' ? 'AUTO' : `${val} JOBS`}
                </button>
              ))}
            </div>
          </div>

          {/* Preservation Toggles */}
          <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Preserve Original Audio Track</span>
              <input
                type="checkbox"
                checked={settings.preserveAudio}
                onChange={(e) => onSaveSettings({ ...settings, preserveAudio: e.target.checked })}
                className="h-4 w-4 rounded accent-cyan-400 bg-slate-950 border-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Preserve Original Resolution</span>
              <input
                type="checkbox"
                checked={settings.preserveResolution}
                onChange={(e) => onSaveSettings({ ...settings, preserveResolution: e.target.checked })}
                className="h-4 w-4 rounded accent-cyan-400 bg-slate-950 border-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Preserve Frame Rate (FPS)</span>
              <input
                type="checkbox"
                checked={settings.preserveFps}
                onChange={(e) => onSaveSettings({ ...settings, preserveFps: e.target.checked })}
                className="h-4 w-4 rounded accent-cyan-400 bg-slate-950 border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Local processing. Memory auto-released after job completion.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
