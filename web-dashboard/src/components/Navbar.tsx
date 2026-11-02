import React, { useState } from 'react';
import { 
  SubjectMeta, 
  ExamSession, 
  SyllabusTopic,
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  Flashcard, 
  SubjectFile 
} from '../types';
import { useTheme, VisualMode } from '../contexts/ThemeContext';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Rocket,
  Database, 
  ChevronDown, 
  BookOpen, 
  Layers, 
  Timer, 
  Brain, 
  Video, 
  FileText, 
  GraduationCap, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Search,
  ExternalLink,
  Radio,
  Download,
  Droplets,
  Zap
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { formatUnitDisplayName } from '../utils/storageService';
import { GlobalSearchBar } from './GlobalSearchBar';
import { SearchIndexItem } from '../utils/searchService';

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
  subjects: SubjectMeta[];
  activeSubjectId: string;
  onSelectSubject?: (id: string, unitId?: string) => void;
  onOpenBackup: () => void;
  examSessions: ExamSession[];
  activeExamId: string;
  onSelectExam: (examId: string) => void;
  onAddExam: (name: string) => void;
  onRenameExam: (examId: string, newName: string) => void;
  onDeleteExam: (examId: string) => void;
  topics?: SyllabusTopic[];
  questions?: PYQQuestion[];
  tasks?: StudyTask[];
  videos?: VideoResource[];
  pdfs?: PdfResource[];
  flashcards?: Flashcard[];
  files?: SubjectFile[];
  onNavigateToTopic?: (subjectId: string, unitId: string, topicId: string) => void;
  onNavigateToSubject?: (subjectId: string) => void;
  onNavigateToSearchResult?: (item: SearchIndexItem) => void;
  onOpenSyncDevices?: () => void;
  onOpenInstallApp?: () => void;
  syncPeersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  subjects,
  activeSubjectId,
  onSelectSubject,
  onOpenBackup,
  examSessions,
  activeExamId,
  onSelectExam,
  onAddExam,
  onRenameExam,
  onDeleteExam,
  topics = [],
  questions = [],
  tasks = [],
  videos = [],
  pdfs = [],
  flashcards = [],
  files = [],
  onNavigateToTopic,
  onNavigateToSubject,
  onNavigateToSearchResult,
  onOpenSyncDevices,
  onOpenInstallApp,
  syncPeersCount = 1
}) => {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingExamName, setEditingExamName] = useState('');
  const [examToDelete, setExamToDelete] = useState<{ id: string; name: string } | null>(null);

  const activeExam = examSessions.find(e => e.id === activeExamId) || examSessions[0] || { id: 'mid-sem', name: 'Mid Sem' };

  // 6 Core Navigation Tabs per Requirement
  const navItems: { id: MainNavView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'timer', label: 'Timer', icon: <Timer className="w-4 h-4" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Brain className="w-4 h-4" /> },
    { id: 'vault', label: 'Vault', icon: <Video className="w-4 h-4" /> },
    { id: 'pdf', label: 'PDF Notes', icon: <FileText className="w-4 h-4" /> },
  ];

  const handleSearchResultNavigation = (item: SearchIndexItem) => {
    if (onNavigateToSearchResult) {
      onNavigateToSearchResult(item);
    } else if (item.type === 'topic' && onNavigateToTopic && item.unitId) {
      onNavigateToTopic(item.subjectId, item.unitId, item.id);
    } else if (item.type === 'subject' && onNavigateToSubject) {
      onNavigateToSubject(item.subjectId);
    } else {
      if (onSelectSubject) onSelectSubject(item.subjectId, item.unitId);
      onSelectView('syllabus');
    }
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;
    onAddExam(newExamName.trim());
    setNewExamName('');
    setIsCreatingExam(false);
    setIsExamDropdownOpen(false);
  };

  const handleRenameSubmit = (examId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExamName.trim()) return;
    onRenameExam(examId, editingExamName.trim());
    setEditingExamId(null);
  };

  const handleDeleteExamClick = (examId: string, name: string) => {
    if (examSessions.length <= 1) {
      alert('You must keep at least one exam.');
      return;
    }
    setExamToDelete({ id: examId, name });
  };


  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] backdrop-blur-xl bg-paper-cardElevated/85 dark:bg-night-card/85 border-b border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card print:hidden transition-colors">
      <div className="w-full px-4 sm:px-5 py-2.5">
        
        {/* Main Header Bar (3-Zone Balanced Flex Layout) */}
        <div className="h-11 flex items-center justify-between gap-3 sm:gap-4 w-full">
          
          {/* Left: Brand Logo + MULTIPLE EXAMS SWITCHER */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Logo */}
            <div 
              onClick={() => onSelectView('today')}
              className="flex items-center gap-2 cursor-pointer select-none group"
              title="Go to Today Screen"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-amber-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-paper-card dark:bg-night-card rounded-[10px] flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-cyan-600 dark:text-cyan-400 -rotate-45" />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-base font-extrabold text-paper-ink dark:text-night-text tracking-tight flex items-center gap-1">
                  Pyq<span className="text-cyan-600 dark:text-cyan-400">Ranker</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold ml-1">Orbit</span>
                </div>
              </div>
            </div>

            {/* Exam Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 sm:gap-2 btn-tactile transition-all"
                title="Switch Exam Session"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="max-w-[85px] sm:max-w-[110px] truncate">{activeExam.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExamDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Exam Switcher Popover */}
              {isExamDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-2xl p-3 z-50 animate-scale-up space-y-3">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
                    <span className="text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider">
                      Select University Exam
                    </span>
                    <button 
                      onClick={() => setIsExamDropdownOpen(false)}
                      className="text-paper-muted hover:text-paper-ink text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Exam Sessions List */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {examSessions.map(session => {
                      const isSelected = session.id === activeExam.id;
                      const isEditing = editingExamId === session.id;

                      if (isEditing) {
                        return (
                          <form
                            key={session.id}
                            onSubmit={(e) => handleRenameSubmit(session.id, e)}
                            className="flex items-center gap-1.5 p-1 bg-paper-cardElevated dark:bg-night-cardElevated rounded-xl border border-emerald-500"
                          >
                            <input
                              type="text"
                              value={editingExamName}
                              onChange={(e) => setEditingExamName(e.target.value)}
                              autoFocus
                              className="flex-1 px-2 py-1 text-xs bg-transparent text-paper-ink dark:text-night-text focus:outline-none font-bold"
                            />
                            <button type="submit" className="p-1 text-emerald-500 hover:text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setEditingExamId(null)} className="p-1 text-paper-muted">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={session.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'border-paper-border dark:border-night-border hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated text-paper-ink dark:text-night-text'
                          }`}
                        >
                          <div 
                            onClick={() => {
                              onSelectExam(session.id);
                              setIsExamDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                          >
                            <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : 'text-paper-muted'}`} />
                            <span className="text-xs truncate">{session.name}</span>
                            {isSelected && <span className="text-[10px] text-emerald-500 font-mono">✓ Active</span>}
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingExamId(session.id);
                                setEditingExamName(session.name);
                              }}
                              className="p-1 rounded text-paper-muted hover:text-paper-ink dark:text-night-muted"
                              title="Rename Exam"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {examSessions.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteExamClick(session.id, session.name);
                                }}
                                className="p-1 rounded text-paper-muted hover:text-red-500"
                                title="Delete Exam"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* + New Exam Form */}
                  {isCreatingExam ? (
                    <form onSubmit={handleCreateExamSubmit} className="pt-2 border-t border-paper-border dark:border-night-border space-y-2">
                      <input
                        type="text"
                        placeholder="e.g. End Sem or GATE 2026..."
                        value={newExamName}
                        onChange={(e) => setNewExamName(e.target.value)}
                        autoFocus
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCreatingExam(false)}
                          className="px-2.5 py-1 text-[11px] text-paper-muted hover:text-paper-ink"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg"
                        >
                          Add Exam
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingExam(true)}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New Exam Session</span>
                    </button>
                  )}

                </div>
              )}
              {/* Search Input (Width: 180px - 220px on desktop) */}
              <GlobalSearchBar
                activeExamId={activeExamId}
                examSessions={examSessions}
                subjects={subjects}
                topics={topics}
                questions={questions}
                tasks={tasks}
                videos={videos}
                pdfs={pdfs}
                flashcards={flashcards}
                files={files}
                onNavigateToSearchResult={handleSearchResultNavigation}
                className="hidden xl:block relative w-[180px] 2xl:w-[220px] shrink-0 ml-1"
              />

            </div>

          </div>

          {/* ZONE 2: CENTER (flex: 1, justify-center, gap: 6px, min-width: 0) - Tactile Segmented Pill Dock */}
          <nav className="hidden lg:flex flex-1 justify-center items-center py-0.5 min-w-0 flex-nowrap">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-paper-well/70 dark:bg-night-well/80 border border-paper-borderWell dark:border-night-borderWell shadow-inner">
              {navItems.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 btn-tactile whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-glow-emerald dark:from-emerald-500 dark:to-emerald-400 dark:text-night-bg btn-hardware'
                        : 'text-paper-secondary dark:text-night-secondary hover:text-paper-ink dark:hover:text-night-text hover:bg-paper-cardElevated/80 dark:hover:bg-night-cardElevated/80'
                    }`}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ZONE 3: RIGHT (flex-shrink: 0, gap: 8px) - Multi-Device Sync, Install App, Backup & 3-Mode Visual Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Real-Time Multi-Device Sync Button */}
            {onOpenSyncDevices && (
              <button
                type="button"
                onClick={onOpenSyncDevices}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 font-bold transition-all btn-tactile flex items-center gap-1.5 shadow-sm active:scale-95 text-xs"
                title="P2P WebRTC Multi-Device Sync (iPhone, Android, PC)"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline whitespace-nowrap">Sync</span>
                {syncPeersCount > 1 && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center">
                    {syncPeersCount}
                  </span>
                )}
              </button>
            )}

            {/* Smart Device-Aware Install App Button */}
            {onOpenInstallApp && (
              <button
                type="button"
                onClick={onOpenInstallApp}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold transition-all btn-tactile flex items-center gap-1.5 shadow-sm active:scale-95 text-xs"
                title="Download / Install Native App"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="hidden lg:inline whitespace-nowrap">Install</span>
              </button>
            )}

            {/* Backup Button */}
            <button
              onClick={onOpenBackup}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition-all btn-tactile flex items-center gap-1.5 shadow-sm active:scale-95"
              title="1-Click Data Backup & Restore (JSON)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold hidden xl:inline whitespace-nowrap">Backup</span>
            </button>

            {/* 3-Mode Liquid Glass Switcher: "💧 Liquid Glass" / "☀️ Daylight" / "⚡ Cyber" */}
            <button
              type="button"
              onClick={() => {
                if (themeMode === 'liquid-dark') setThemeMode('liquid-light');
                else if (themeMode === 'liquid-light') setThemeMode('pro-cyber');
                else setThemeMode('liquid-dark');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all btn-hardware flex items-center gap-1.5 active:scale-95 whitespace-nowrap bg-paper-cardElevated/90 dark:bg-night-cardElevated/90 border-paper-border dark:border-night-border text-paper-ink dark:text-night-text hover:border-cyan-500/50 shadow-sm"
              title={`Active Mode: ${themeMode}. Click to switch modes.`}
            >
              {themeMode === 'liquid-light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="tracking-wide hidden xs:inline">☀️ Daylight</span>
                </>
              ) : themeMode === 'pro-cyber' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="tracking-wide hidden xs:inline">⚡ Cyber</span>
                </>
              ) : (
                <>
                  <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="tracking-wide hidden xs:inline">💧 Liquid Glass</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar Row (Requirement 1: Visible at top on every page) */}
        <div className="pb-3 md:hidden">
          <GlobalSearchBar
            activeExamId={activeExamId}
            examSessions={examSessions}
            subjects={subjects}
            topics={topics}
            questions={questions}
            tasks={tasks}
            videos={videos}
            pdfs={pdfs}
            flashcards={flashcards}
            files={files}
            onNavigateToSearchResult={handleSearchResultNavigation}
            isMobile={true}
          />
        </div>

      </div>

      {/* Delete Exam Confirmation Modal (Requirement 12) */}
      <ConfirmModal
        isOpen={!!examToDelete}
        title="Delete Exam?"
        message={`Are you sure you want to delete "${examToDelete?.name}"? All its subjects, units, topics, notes, and files will be removed. This action cannot be undone.`}
        confirmLabel="Delete Exam"
        isDanger={true}
        onCancel={() => setExamToDelete(null)}
        onConfirm={() => {
          if (examToDelete) {
            onDeleteExam(examToDelete.id);
            setExamToDelete(null);
          }
        }}
      />
    </header>
  );
};
