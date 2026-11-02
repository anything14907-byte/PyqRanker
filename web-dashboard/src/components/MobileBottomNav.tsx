import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Flame, 
  Calendar, 
  Timer, 
  Brain, 
  Video, 
  FileText, 
  Layers, 
  MoreHorizontal,
  X,
  ShieldCheck,
  Radio,
  Download,
  Sun,
  Zap,
  Droplets,
  Activity
} from 'lucide-react';
import { useTheme, VisualMode } from '../contexts/ThemeContext';

export type ExtendedNavView = 
  | 'today' 
  | 'syllabus' 
  | 'pyqs' 
  | 'timer' 
  | 'flashcards' 
  | 'vault' 
  | 'pdf' 
  | 'overview' 
  | 'workspace';

interface MobileBottomNavProps {
  currentView: ExtendedNavView;
  onSelectView: (view: ExtendedNavView) => void;
  onOpenBackup: () => void;
  dueFlashcardsCount: number;
  onOpenSyncDevices?: () => void;
  onOpenInstallApp?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenBackup,
  dueFlashcardsCount,
  onOpenSyncDevices,
  onOpenInstallApp
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { themeMode, setThemeMode, liquidMotionEnabled, setLiquidMotionEnabled } = useTheme();

  const mainTabs: { id: ExtendedNavView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'timer', label: 'Timer', icon: <Timer className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-5 h-5" /> },
    { id: 'vault', label: 'Vault', icon: <Video className="w-5 h-5" /> },
  ];

  const moreTabs: { id: ExtendedNavView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'pdf', label: 'PDF Notes Tool', icon: <FileText className="w-5 h-5" /> },
    { id: 'overview', label: 'All Subjects Grid', icon: <Layers className="w-5 h-5" /> },
  ];

  const handleTabClick = (view: ExtendedNavView) => {
    onSelectView(view);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* "More" Drawer for Mobile (Liquid Glass Sheet) */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md animate-fade-slide-up">
          <div className="p-6 rounded-t-3xl bg-paper-card/95 dark:bg-[#0c1222]/95 border-t border-white/20 dark:border-white/10 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-cyan-400">
                Additional Tools & Hardware Settings
              </span>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl text-paper-muted hover:text-paper-ink dark:text-gray-400 dark:hover:text-white bg-paper-cardElevated/50 dark:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation options */}
            <div className="grid grid-cols-2 gap-3">
              {moreTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 btn-tactile min-h-[44px] ${
                    currentView === tab.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-paper-cardElevated dark:bg-white/5 border-paper-border dark:border-white/10 text-paper-ink dark:text-white font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Actions: Sync Devices & Install Native App */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {onOpenSyncDevices && (
                <button
                  onClick={() => { setIsMoreOpen(false); onOpenSyncDevices(); }}
                  className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center gap-2 btn-tactile min-h-[44px]"
                >
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Sync Devices</span>
                </button>
              )}
              {onOpenInstallApp && (
                <button
                  onClick={() => { setIsMoreOpen(false); onOpenInstallApp(); }}
                  className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 btn-tactile min-h-[44px]"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download App</span>
                </button>
              )}
            </div>

            {/* Visual Display Mode Switcher */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-paper-muted dark:text-gray-400 uppercase tracking-wide">
                Visual Experience Mode
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode('liquid-dark')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all ${
                    themeMode === 'liquid-dark'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-sm'
                      : 'bg-paper-cardElevated dark:bg-white/5 border-paper-border dark:border-white/10 text-paper-muted dark:text-gray-400'
                  }`}
                >
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px]">Liquid Glass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('liquid-light')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all ${
                    themeMode === 'liquid-light'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-500 shadow-sm'
                      : 'bg-paper-cardElevated dark:bg-white/5 border-paper-border dark:border-white/10 text-paper-muted dark:text-gray-400'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px]">Daylight</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('pro-cyber')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all ${
                    themeMode === 'pro-cyber'
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400 shadow-sm'
                      : 'bg-paper-cardElevated dark:bg-white/5 border-paper-border dark:border-white/10 text-paper-muted dark:text-gray-400'
                  }`}
                >
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px]">Pro Cyber</span>
                </button>
              </div>
            </div>

            {/* Motion toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-paper-cardElevated dark:bg-white/5 border border-paper-border dark:border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-paper-ink dark:text-white">Fluid Aurora & Caustic Waves</span>
              </div>
              <button
                type="button"
                onClick={() => setLiquidMotionEnabled(!liquidMotionEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  liquidMotionEnabled
                    ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold'
                    : 'bg-transparent text-paper-muted dark:text-gray-400 border-paper-border dark:border-white/20'
                }`}
              >
                {liquidMotionEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* JSON Backup Button */}
            <button
              onClick={() => { setIsMoreOpen(false); onOpenBackup(); }}
              className="w-full py-3 rounded-2xl bg-paper-cardElevated dark:bg-white/5 border border-paper-border dark:border-white/10 text-xs font-bold text-paper-ink dark:text-white flex items-center justify-center gap-2 btn-tactile min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Backup & Restore (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar on Mobile (< md) - Apple Liquid Glass Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-card/90 dark:bg-[#070b14]/85 backdrop-blur-2xl border-t border-paper-border dark:border-white/15 h-16 flex items-center justify-around px-2 shadow-2xl safe-area-bottom">
        {mainTabs.map(tab => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectView(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[44px] ${
                isActive 
                  ? 'text-cyan-600 dark:text-cyan-400 font-extrabold scale-105' 
                  : 'text-paper-muted dark:text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-glow-cyan" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More Options Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[44px] ${
            isMoreOpen || moreTabs.some(t => t.id === currentView)
              ? 'text-cyan-600 dark:text-cyan-400 font-extrabold'
              : 'text-paper-muted dark:text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {dueFlashcardsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
