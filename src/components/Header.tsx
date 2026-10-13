import React from 'react';
import { Sparkles, Settings, Zap, Cpu, HardDrive } from 'lucide-react';
import { ProcessingSettings } from '../types';

interface HeaderProps {
  settings: ProcessingSettings;
  onOpenSettings: () => void;
  onOpenWatermarkSelector: () => void;
  isApiAvailable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenWatermarkSelector,
  isApiAvailable,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-400 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
                <span>MT WORLD</span>
                <span className="text-xs sm:text-sm font-sans font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  Remove Veo Watermarks
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              100 Videos. One Click. Fast Hardware Processing.
            </p>
          </div>
        </div>

        {/* Action Controls & Engine Status */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Hardware Engine Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            {isApiAvailable ? (
              <>
                <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400/20 animate-pulse" />
                <span className="text-slate-200 font-medium">GPU Hardware Accel</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span className="text-slate-200 font-medium">Browser WebCodecs</span>
              </>
            )}
          </div>

          {/* Watermark Region Button */}
          <button
            onClick={onOpenWatermarkSelector}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold transition-all shadow-sm"
          >
            <HardDrive className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Watermark Region</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all hover:shadow-cyan-500/10 shadow-sm"
            title="Processing Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
