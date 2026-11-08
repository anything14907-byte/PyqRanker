import React, { useState, useMemo } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  StudyTask, 
  Flashcard, 
  PomodoroSession,
  VideoResource
} from '../types';
import { 
  getExamUrgencyColor, 
  sortSubjectsByExamUrgency, 
  storageService,
  getSubjectTotalStudiedMinutes,
  formatStudiedTime
} from '../utils/storageService';
import { TactileSubjectBook } from './TactileSubjectBook';
import { LiveCountdown } from './LiveCountdown';
import { EditExamDateModal } from './EditExamDateModal';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Calendar, 
  BookOpen, 
  Layers, 
  ArrowRight, 
  Timer, 
  Brain,
  Plus,
  Flame,
  Clock,
  Sparkles,
  ArrowUpDown,
  ShieldCheck,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

interface TodayScreenProps {
  subjects: SubjectMeta[];
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
  tasks: StudyTask[];
  flashcards: Flashcard[];
  pomodoroLogs: PomodoroSession[];
  videos?: VideoResource[];
  onToggleTopicCompleted: (topicId: string) => void;
  onSelectSubject: (subjectId: string, unitId?: string) => void;
  onNavigateView: (view: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenAddSubject?: () => void;
  onEditSubject?: (subject: SubjectMeta) => void;
  onOpenBackup?: () => void;
  onReorderSubjects?: (subjects: SubjectMeta[]) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  subjects,
  topics,
  questions,
  tasks,
  flashcards,
  pomodoroLogs,
  videos = [],
  onToggleTopicCompleted,
  onSelectSubject,
  onNavigateView,
  onShowToast,
  onOpenAddSubject,
  onEditSubject,
  onOpenBackup,
  onReorderSubjects
}) => {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';

  // Exam date modal state
  const [editingDateSubject, setEditingDateSubject] = useState<SubjectMeta | null>(null);

  // Sorting mode: date (closest exam first) or custom
  const [sortMode, setSortMode] = useState<'date' | 'custom'>('date');

  // Sorted subjects: automatically sorted by time remaining (closest exam first)
  const displaySubjects = useMemo(() => {
    if (sortMode === 'date') {
      return sortSubjectsByExamUrgency(subjects);
    }
    return subjects;
  }, [subjects, sortMode]);

  // Overall syllabus stats
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Flashcards due today
  const todayStr = new Date().toISOString().split('T')[0];
  const dueFlashcards = flashcards.filter(c => !c.nextReviewDate || c.nextReviewDate <= todayStr);

  // Focus time today
  const todayMinutes = pomodoroLogs
    .filter(l => l.date === todayStr)
    .reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);

  // Find priority next exam
  const nextSubject = useMemo(() => {
    return sortSubjectsByExamUrgency(subjects).find(s => {
      if (!s.examDate || !s.examDate.trim()) return false;
      const u = getExamUrgencyColor(s.examDate);
      return u.hasDate && u.fractionalDays > 0;
    });
  }, [subjects]);

  // Handle color update directly on book
  const handleUpdateSubjectColor = (subjectId: string, colorHex: string) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        return { ...s, accentColor: colorHex };
      }
      return s;
    });
    storageService.saveSubjects(updated);
    if (onReorderSubjects) {
      onReorderSubjects(updated);
    }
    onShowToast('Book cover cloth updated! 🎨', 'success');
  };

  // Handle save exam date from modal
  const handleSaveExamDate = (newDate: string) => {
    if (!editingDateSubject) return;
    const updated = subjects.map(s => {
      if (s.id === editingDateSubject.id) {
        return { ...s, examDate: newDate };
      }
      return s;
    });
    storageService.saveSubjects(updated);
    if (onReorderSubjects) {
      onReorderSubjects(updated);
    }
    setEditingDateSubject(null);
    onShowToast('Exam target date saved! 📅', 'success');
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-16 select-none">
      
      {/* 1. TOP STUDIO DESK HEADER & PRIORITY HERO BANNER */}
      <div 
        className="w-full rounded-2xl p-5 sm:p-7 border shadow-xl relative overflow-hidden transition-colors"
        style={{
          backgroundColor: isLight ? '#FAF7F0' : '#10131A',
          borderColor: isLight ? '#DCD7CE' : '#222733'
        }}
      >
        {/* Fine Architectural Desk Grid Accent */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          {/* Left: Studio Desk Overview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Architectural Studio Desk
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                {subjects.length} Hardcover Books on Shelf
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
              Personal Academic Command Center
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl font-sans leading-relaxed">
              Tactile 3D Hardcover volumes arranged by exam proximity. Click any book to open its chapters, checklists, video lectures, and paperclipped PDF dossiers.
            </p>
          </div>

          {/* Right: Next Priority Countdown & Quick Desk Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            {nextSubject && (
              <div 
                onClick={() => onSelectSubject(nextSubject.id)}
                className="p-3.5 rounded-xl border cursor-pointer hover:border-amber-500 transition-all shadow-md flex items-center gap-3 bg-stone-100/90 dark:bg-stone-900/90 border-stone-300 dark:border-stone-800"
                title="Click to open next priority exam book"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500 text-stone-950 font-bold flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Priority #1 • Next Exam
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                    {nextSubject.name}
                  </div>
                  <LiveCountdown examDate={nextSubject.examDate} compact={true} className="mt-1" />
                </div>
              </div>
            )}

            {/* Quick Metrics Ticker */}
            <div className="flex items-center gap-2">
              <div className="p-3 rounded-xl border bg-stone-100/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-800 text-center min-w-[72px]">
                <div className="text-base font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  {overallPercent}%
                </div>
                <div className="text-[10px] font-mono opacity-70">Syllabus</div>
              </div>

              <div 
                onClick={() => onNavigateView('timer')}
                className="p-3 rounded-xl border bg-stone-100/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-800 text-center min-w-[72px] cursor-pointer hover:border-amber-500 transition-colors"
                title="Focus Timer"
              >
                <div className="text-base font-mono font-extrabold text-stone-900 dark:text-stone-100">
                  {todayMinutes}m
                </div>
                <div className="text-[10px] font-mono opacity-70">Focus</div>
              </div>

              <div 
                onClick={() => onNavigateView('flashcards')}
                className="p-3 rounded-xl border bg-stone-100/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-800 text-center min-w-[72px] cursor-pointer hover:border-amber-500 transition-colors"
                title="Review Flashcards"
              >
                <div className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {dueFlashcards.length}
                </div>
                <div className="text-[10px] font-mono opacity-70">Due Cards</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE 3D BOOKSHELF / DESK CONTROLS */}
      <div className="w-full flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>Hardcover Subject Library</span>
          </span>
          <span className="text-xs font-mono opacity-60">
            (Sorted by Closest Exam First)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* + Add Subject Book */}
          {onOpenAddSubject && (
            <button
              type="button"
              onClick={onOpenAddSubject}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-500" />
              <span>+ Add Subject Book</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. WIDESCREEN GRID OF 3D HARDCOVER BOOKS */}
      {displaySubjects.length === 0 ? (
        <div 
          className="w-full p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 transition-colors"
          style={{
            backgroundColor: isLight ? '#FAF7F0' : '#10131A',
            borderColor: isLight ? '#DCD7CE' : '#222733'
          }}
        >
          <BookOpen className="w-12 h-12 text-amber-500 opacity-60" />
          <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
            No Subject Books on Shelf Yet
          </h3>
          <p className="text-xs text-stone-500 max-w-sm">
            Add your university subjects to create 3D Hardcover volumes with chapters, past exam questions, and video attachments.
          </p>
          {onOpenAddSubject && (
            <button
              type="button"
              onClick={onOpenAddSubject}
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 shadow-md transition-all active:scale-95 mt-2"
            >
              + Create First Subject Book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-7 sm:gap-9 pt-4">
          {displaySubjects.map((subject, idx) => (
            <TactileSubjectBook
              key={subject.id}
              subject={subject}
              volumeIndex={idx}
              topics={topics}
              onOpenBook={(subId, unitId) => onSelectSubject(subId, unitId)}
              onEditExamDate={(sub) => setEditingDateSubject(sub)}
              onEditSubject={onEditSubject}
              onUpdateSubjectColor={handleUpdateSubjectColor}
            />
          ))}
        </div>
      )}

      {/* 4. MODAL: EDIT EXAM TARGET DATE */}
      {editingDateSubject && (
        <EditExamDateModal
          subject={editingDateSubject}
          isOpen={!!editingDateSubject}
          onClose={() => setEditingDateSubject(null)}
          onSave={handleSaveExamDate}
        />
      )}
    </div>
  );
};
