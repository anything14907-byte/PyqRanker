import React, { useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Timer, 
  Brain, 
  Video, 
  FileText, 
  Upload,
  Download, 
  Database,
  Plus,
  Flame
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
  onFastExport?: () => void;
  onFastImport?: (jsonString: string) => void;
  onOpenAddSubject?: () => void;
  onOpenInstallApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenBackup,
  onFastExport,
  onFastImport,
  onOpenAddSubject,
  onOpenInstallApp
}) => {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Studio Mode Switchers as requested in Section 5
  const navItems: { id: MainNavView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Bookshelf Desk', icon: <span className="text-xs">📚</span> },
    { id: 'syllabus', label: 'Open Book (Chapters)', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'timer', label: 'Focus Timer', icon: <Timer className="w-3.5 h-3.5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'vault', label: 'Attachments Vault', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'pdf', label: 'PDF Extractor', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && onFastImport) {
        onFastImport(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header 
      className="sticky top-0 z-40 w-full max-w-[100vw] border-b shadow-md print:hidden transition-colors select-none"
      style={{
        backgroundColor: isLight ? '#FAF7F0' : '#0C0E12',
        borderColor: isLight ? '#DCD7CE' : '#222733'
      }}
    >
      {/* Hidden file input for 1-click cross-device JSON import */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden" 
      />

      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
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
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-wider">
              Studio
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Architectural Mode Switchers (Hidden on Mobile < 768px) */}
        <nav className="hidden md:flex flex-1 justify-center items-center min-w-0 overflow-x-auto no-scrollbar py-0.5 px-1">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/80 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-800 shadow-inner flex-nowrap shrink-0">
            {navItems.map(item => {
              const isActive = currentView === item.id || (item.id === 'syllabus' && currentView === ('workspace' as any));
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: Tools, JSON Sync, + Add Book, with right-side clearance for the Hanging Bulb */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-12 sm:pr-24">
          
          {/* + Add Book Button */}
          {onOpenAddSubject && (
            <button
              type="button"
              onClick={onOpenAddSubject}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 text-xs"
              title="Add a new 3D subject book"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline whitespace-nowrap">+ Book</span>
            </button>
          )}

          {/* 📥 1-Click Fast Import */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-stone-400/40 dark:border-stone-700 bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 text-xs"
            title="Import JSON backup from another device"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline whitespace-nowrap">Import</span>
          </button>

          {/* 📤 1-Click Fast Export */}
          <button
            type="button"
            onClick={onFastExport}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-stone-400/40 dark:border-stone-700 bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 text-xs"
            title="Export full JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline whitespace-nowrap">Export</span>
          </button>

          {/* 💾 Backup & Restore Full Modal */}
          <button
            type="button"
            onClick={onOpenBackup}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-stone-400/40 dark:border-stone-700 bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            title="Open Data Backup & Storage Manager"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
