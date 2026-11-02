import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Radio, 
  Smartphone, 
  Laptop, 
  Sun, 
  Moon, 
  Zap, 
  Droplets, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Share2, 
  Download,
  Sliders,
  X
} from 'lucide-react';
import { useTheme, VisualMode } from '../contexts/ThemeContext';
import { deviceSyncService, SyncStatus } from '../services/deviceSyncService';

interface DynamicIslandProps {
  onOpenSyncModal: () => void;
  onOpenInstallModal: () => void;
  activeNotification?: string | null;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  onOpenSyncModal,
  onOpenInstallModal,
  activeNotification
}) => {
  const { themeMode, setThemeMode, liquidMotionEnabled, setLiquidMotionEnabled } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(deviceSyncService.status);
  const [recentNotice, setRecentNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = deviceSyncService.onStatus((status) => {
      setSyncStatus(status);
      if (status.lastMessage) {
        setRecentNotice(status.lastMessage);
        const timer = setTimeout(() => setRecentNotice(null), 5000);
        return () => clearTimeout(timer);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeNotification) {
      setRecentNotice(activeNotification);
      const timer = setTimeout(() => setRecentNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Click outside listener to collapse dynamic island
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const displayModes: { id: VisualMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      id: 'liquid-dark', 
      label: 'Apple Liquid Glass', 
      icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      desc: 'Translucent optical glass over fluid aurora mesh'
    },
    { 
      id: 'liquid-light', 
      label: 'Liquid Daylight', 
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'Pearlescent frosted glass for daytime focus'
    },
    { 
      id: 'pro-cyber', 
      label: 'Pro Cyber Studio', 
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      desc: 'Obsidian glass with high-contrast neon accents'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-50 select-none transition-all duration-400 ease-out"
      style={{
        width: isExpanded ? 'min(94vw, 440px)' : 'auto'
      }}
    >
      {/* Dynamic Island Capsule */}
      <div 
        className={`relative overflow-hidden border shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded 
            ? 'rounded-3xl p-4 sm:p-5' 
            : 'rounded-full px-3.5 sm:px-4 py-1.5 cursor-pointer hover:scale-[1.02] active:scale-95'
        }`}
        style={{
          background: themeMode === 'liquid-light' 
            ? 'rgba(255, 255, 255, 0.88)' 
            : 'rgba(9, 13, 22, 0.88)',
          backdropFilter: 'blur(28px) saturate(210%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(28px) saturate(210%) brightness(1.08)',
          borderColor: themeMode === 'liquid-light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.22)',
          boxShadow: themeMode === 'liquid-light'
            ? '0 16px 36px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
            : '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.45), inset 0 -1px 1px rgba(255, 255, 255, 0.1)'
        }}
        onClick={() => {
          if (!isExpanded) setIsExpanded(true);
        }}
      >
        {/* COMPACT PILL STATE */}
        {!isExpanded ? (
          <div className="flex items-center gap-2.5 text-xs font-semibold whitespace-nowrap">
            {/* Left: Device Live Status Indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                syncStatus.connectedPeersCount > 0 
                  ? 'bg-emerald-400 animate-pulse' 
                  : 'bg-cyan-400'
              }`} />
              <span className="font-mono text-[11px] font-bold text-paper-ink dark:text-night-text">
                {syncStatus.connectedPeersCount > 0 
                  ? `${syncStatus.connectedPeersCount} Linked` 
                  : (syncStatus.roomCode || 'LQ-Sync')}
              </span>
            </div>

            {/* Separator dot */}
            <span className="text-white/30">•</span>

            {/* Center: Current Visual Mode or Notice */}
            <div className="flex items-center gap-1.5 text-[11px] text-paper-muted dark:text-night-muted font-medium max-w-[140px] sm:max-w-[180px] truncate">
              {recentNotice ? (
                <span className="text-cyan-400 animate-pulse truncate font-bold">{recentNotice}</span>
              ) : (
                <>
                  {themeMode === 'liquid-light' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : themeMode === 'pro-cyber' ? (
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {themeMode === 'liquid-light' ? 'Daylight' : themeMode === 'pro-cyber' ? 'Pro Cyber' : 'Liquid Glass'}
                  </span>
                </>
              )}
            </div>

            {/* Expand arrow */}
            <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 ml-0.5" />
          </div>
        ) : (
          /* EXPANDED FLUID CONTROL STATE */
          <div className="space-y-4 animate-fade-slide-up">
            {/* Expanded Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center text-cyan-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-paper-ink dark:text-night-text tracking-tight flex items-center gap-1.5">
                    <span>Dynamic Island Status</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-500/15 text-cyan-400 font-bold">
                      macOS Tahoe
                    </span>
                  </h4>
                  <p className="text-[10px] text-paper-muted dark:text-night-muted">
                    Instant system controls, multi-device peer link, and optics
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Multi-Device Sync Card */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${syncStatus.connectedPeersCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>Real-Time Device Sync</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  syncStatus.connectedPeersCount > 0 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-white/10 text-slate-300'
                }`}>
                  {syncStatus.connectedPeersCount > 0 
                    ? `🟢 ${syncStatus.connectedPeersCount} Linked` 
                    : `Room: ${syncStatus.roomCode || 'LQ-SYNC'}`}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                    onOpenSyncModal();
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3 h-3" />
                  <span>Open Sync Hub (QR)</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                    onOpenInstallModal();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-paper-ink dark:text-night-text text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>Install App</span>
                </button>
              </div>
            </div>

            {/* 3 Display Modes Switcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted">
                1-Click Display Mode
              </span>

              <div className="grid grid-cols-3 gap-1.5">
                {displayModes.map(mode => {
                  const isActive = themeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThemeMode(mode.id);
                      }}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-extrabold shadow-sm'
                          : 'border-white/10 bg-white/[0.03] text-paper-muted dark:text-night-muted hover:text-paper-ink hover:bg-white/[0.07]'
                      }`}
                    >
                      {mode.icon}
                      <span className="text-[10px] truncate max-w-full">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liquid Motion / Refraction Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-semibold text-paper-ink dark:text-night-text">
                  Fluid Liquid Motion & Aurora Physics
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLiquidMotionEnabled(!liquidMotionEnabled);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  liquidMotionEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {liquidMotionEnabled ? 'Fluid Active' : 'Static Mode'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
