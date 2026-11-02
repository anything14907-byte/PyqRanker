import React from 'react';
import { 
  Sparkles, 
  Sun, 
  BookOpen, 
  Flame,
  Timer, 
  Brain, 
  Video, 
  FileText, 
  Radio,
  Download,
  Droplets,
  Zap,
  Database
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type MainNavView = 
  | 'today' 
  | 'syllabus' 
  | 'pyqs' 
  | 'timer' 
  | 'flashcards' 
  | 'vault' 
  | 'pdf' 
  | 'overview' 
  | 'workspace';

interface NavbarProps {
  currentView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  onOpenBackup: () => void;
  onOpenSyncDevices?: () => void;
  onOpenInstallApp?: () => void;
  syncPeersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenBackup,
  onOpenSyncDevices,
  onOpenInstallApp,
  syncPeersCount = 1
}) => {
  const { themeMode, setThemeMode } = useTheme();

  // Navigation tabs
  const navItems: { id: MainNavView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'pyqs' as any, label: 'PYQ Ranker', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'timer', label: 'Timer', icon: <Timer className="w-3.5 h-3.5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'vault', label: 'Vault', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'pdf', label: 'PDF Notes', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] backdrop-blur-2xl bg-paper-cardElevated/85 dark:bg-[#070b14]/85 border-b border-paper-border/80 dark:border-white/10 shadow-lg print:hidden transition-colors">
      <div className="w-full px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* LEFT: App Brand Logo + AI Study OS badge */}
        <div 
          onClick={() => onSelectView('today')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          title="Pyq Ranker — AI Study OS"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-emerald-400 p-[1.5px] shadow-glow-cyan group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0f1d] dark:bg-[#070b14] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-paper-ink dark:text-white">
              Pyq<span className="text-cyan-400">Ranker</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
              AI Study OS
            </span>
          </div>
        </div>

        {/* CENTER: Segmented Liquid Glass Navigation Track (horizontal scroll on mobile) */}
        <nav className="flex-1 flex justify-center items-center min-w-0 overflow-x-auto no-scrollbar py-0.5 px-1">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-paper-well/70 dark:bg-black/35 border border-paper-borderWell dark:border-white/10 shadow-inner flex-nowrap shrink-0">
            {navItems.map(item => {
              const isActive = currentView === item.id || (item.id === 'pyqs' && currentView === 'syllabus');
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow-cyan font-extrabold'
                      : 'text-paper-secondary dark:text-slate-300 hover:text-paper-ink dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: Compact Non-Overlapping Utility Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* 🔗 QR Sync */}
          {onOpenSyncDevices && (
            <button
              type="button"
              onClick={onOpenSyncDevices}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 text-xs"
              title="Real-Time QR & WebRTC Multi-Device Sync"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden md:inline whitespace-nowrap">Sync</span>
              {syncPeersCount > 1 && (
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center">
                  {syncPeersCount}
                </span>
              )}
            </button>
          )}

          {/* 💧 Glass Mode Switcher */}
          <button
            type="button"
            onClick={() => {
              if (themeMode === 'liquid-dark') setThemeMode('liquid-light');
              else if (themeMode === 'liquid-light') setThemeMode('pro-cyber');
              else setThemeMode('liquid-dark');
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap bg-white/5 border-white/15 text-paper-ink dark:text-white hover:border-cyan-500/50 shadow-sm"
            title={`Visual Mode: ${themeMode}. Click to switch.`}
          >
            {themeMode === 'liquid-light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden lg:inline">Daylight</span>
              </>
            ) : themeMode === 'pro-cyber' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden lg:inline">Cyber</span>
              </>
            ) : (
              <>
                <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden lg:inline">Glass Mode</span>
              </>
            )}
          </button>

          {/* 📲 App Install */}
          {onOpenInstallApp && (
            <button
              type="button"
              onClick={onOpenInstallApp}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 text-xs"
              title="Install / Download Native App"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline whitespace-nowrap">App</span>
            </button>
          )}

          {/* 💾 Backup */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 text-xs"
            title="1-Click JSON Backup & Restore"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline whitespace-nowrap">Backup</span>
          </button>
        </div>

      </div>
    </header>
  );
};
