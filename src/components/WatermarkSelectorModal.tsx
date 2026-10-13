import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Crop, Sliders, RefreshCw } from 'lucide-react';
import { WatermarkRegion, WatermarkProfileType } from '../types';

interface WatermarkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRegion: WatermarkRegion;
  sampleVideoFile?: File;
  onApplyToAll: (region: WatermarkRegion, profileType: WatermarkProfileType) => void;
}

export const WatermarkSelectorModal: React.FC<WatermarkSelectorModalProps> = ({
  isOpen,
  onClose,
  initialRegion,
  sampleVideoFile,
  onApplyToAll,
}) => {
  const [profileType, setProfileType] = useState<WatermarkProfileType>('gemini-veo');
  const [region, setRegion] = useState<WatermarkRegion>(initialRegion);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sampleVideoFile) {
      const url = URL.createObjectURL(sampleVideoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [sampleVideoFile]);

  if (!isOpen) return null;

  const handleProfileSelect = (type: WatermarkProfileType) => {
    setProfileType(type);
    if (type === 'gemini-veo' || type === 'bottom-right') {
      setRegion({ normX: 0.78, normY: 0.90, normW: 0.20, normH: 0.08 });
    } else if (type === 'bottom-left') {
      setRegion({ normX: 0.02, normY: 0.90, normW: 0.20, normH: 0.08 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    setDragStart({ x: clickX, y: clickY });
    setRegion((prev) => ({ ...prev, normX: Math.max(0, Math.min(1 - prev.normW, clickX)), normY: Math.max(0, Math.min(1 - prev.normH, clickY)) }));
    setIsDragging(true);
    setProfileType('custom');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const newW = Math.max(0.05, Math.min(1, Math.abs(currentX - dragStart.x)));
    const newH = Math.max(0.03, Math.min(1, Math.abs(currentY - dragStart.y)));
    const newX = Math.min(dragStart.x, currentX);
    const newY = Math.min(dragStart.y, currentY);

    setRegion({
      normX: Math.max(0, Math.min(1 - newW, newX)),
      normY: Math.max(0, Math.min(1 - newH, newY)),
      normW: newW,
      normH: newH,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    onApplyToAll(region, profileType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Crop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Watermark Region Profile</h3>
              <p className="text-xs text-slate-400">Select preset or draw rectangle over the watermark</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wider">
              WATERMARK PRESETS
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleProfileSelect('gemini-veo')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  profileType === 'gemini-veo'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Gemini / Veo (Default)
                <span className="block text-[10px] font-normal text-slate-400 mt-1">Bottom Right Bounding Box</span>
              </button>

              <button
                onClick={() => handleProfileSelect('bottom-right')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  profileType === 'bottom-right'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Bottom-Right
                <span className="block text-[10px] font-normal text-slate-400 mt-1">Standard Corner</span>
              </button>

              <button
                onClick={() => handleProfileSelect('bottom-left')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  profileType === 'bottom-left'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Bottom-Left
                <span className="block text-[10px] font-normal text-slate-400 mt-1">Left Corner</span>
              </button>

              <button
                onClick={() => setProfileType('custom')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  profileType === 'custom'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Custom Region
                <span className="block text-[10px] font-normal text-slate-400 mt-1">Interactive Frame Selector</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Canvas Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px] select-none">
            {videoUrl ? (
              <video ref={videoRef} src={videoUrl} controls className="max-h-[380px] w-auto mx-auto pointer-events-none" />
            ) : (
              <div className="h-64 w-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
                Preview frame placeholder (Upload video to see frame preview)
              </div>
            )}

            {/* Interactive Drag Bounding Box Overlay */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="absolute inset-0 cursor-crosshair"
            >
              <div
                className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/20 shadow-xl shadow-cyan-500/50 flex items-center justify-center transition-all"
                style={{
                  left: `${region.normX * 100}%`,
                  top: `${region.normY * 100}%`,
                  width: `${region.normW * 100}%`,
                  height: `${region.normH * 100}%`,
                }}
              >
                <span className="text-[10px] font-black text-cyan-200 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-400/50">
                  WATERMARK REGION
                </span>
              </div>
            </div>
          </div>

          {/* Precision Coordinates Numeric Inputs */}
          <div className="grid grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400">X POS (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={Math.round(region.normX * 100)}
                onChange={(e) => setRegion({ ...region, normX: Number(e.target.value) / 100 })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">Y POS (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={Math.round(region.normY * 100)}
                onChange={(e) => setRegion({ ...region, normY: Number(e.target.value) / 100 })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">WIDTH (%)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={Math.round(region.normW * 100)}
                onChange={(e) => setRegion({ ...region, normW: Number(e.target.value) / 100 })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">HEIGHT (%)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={Math.round(region.normH * 100)}
                onChange={(e) => setRegion({ ...region, normH: Number(e.target.value) / 100 })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => handleProfileSelect('gemini-veo')}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Veo Default</span>
          </button>

          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center"
            >
              <Check className="h-4 w-4 mr-1.5" />
              APPLY TO ALL VIDEOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
