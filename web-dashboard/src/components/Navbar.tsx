import React, { useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Timer, 
  Brain, 
  Video, 
  Plus,
  Database
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { StudioLampSwitch } from './StudioLampSwitch';

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
  onOpenAddSubject?: () => void;
  onOpenInstallApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenBackup,
  onOpenAddSubject
}) => {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';

  // 5 Concise, Agency-Grade Tab Titles (Zero Clipping, No Horizontal Scrollbar)
  const navItems: { id: MainNavView; label: string; icon: string }[] = [
    { id: 'today', label: 'Bookshelf', icon: '📚' },
    { id: 'syllabus', label: 'Open Book', icon: '📖' },
    { id: 'timer', label: 'Focus Timer', icon: '⏱️' },
    { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
    { id: 'vault', label: 'Vault', icon: '🗂️' },
  ];

  return (
    <header 
      className="sticky top-0 z-40 w-full max-w-[100vw] border-b shadow-sm print:hidden transition-colors select-none"
      style={{
        backgroundColor: isLight ? '#FAF7F0' : '#0C0E12',
        borderColor: isLight ? '#DCD7CE' : '#222733'
      }}
    >
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* LEFT: Clean Professional Study OS Branding */}
        <div 
          onClick={() => onSelectView('today')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          title="Study OS — Academic Exam & Syllabus Command Hub"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-stone-700 to-amber-600 p-[1.5px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0C0E12] rounded-[10px] flex items-center justify-center">
              <span className="text-sm">📖</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
              Study<span className="text-amber-500">OS</span>
            </span>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-wider">
              Studio
            </span>
          </div>
        </div>

        {/* CENTER: 100% Readable Agency Navigation Track (Zero Horizontal Scrollbar, Zero Clipping) */}
        <nav className="hidden md:flex flex-1 justify-center items-center">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/80 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-800 shadow-inner shrink-0">
            {navItems.map(item => {
              const isActive = currentView === item.id || (item.id === 'syllabus' && currentView === ('workspace' as any));
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-300/70 dark:hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: High-Precision Luxury Controls (💾 Backup, ☀️/🌙 Studio Lamp Switch) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 💾 Consolidated Single Backup Button */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="px-3 py-1.5 rounded-xl border border-stone-400/40 dark:border-stone-700 bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs whitespace-nowrap"
            title="Import or Export Study OS JSON Backup"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline whitespace-nowrap">Backup</span>
          </button>

          {/* Machined Brass & Matte Onyx Studio Lamp Switch */}
          <StudioLampSwitch />
        </div>

      </div>
    </header>
  );
};
