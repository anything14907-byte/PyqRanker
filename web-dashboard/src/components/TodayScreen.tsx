import React, { useState, useMemo } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  StudyTask, 
  Flashcard, 
  PomodoroSession,
  VideoResource,
  PdfResource
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
  FolderOpen,
  Zap
} from 'lucide-react';

interface TodayScreenProps {
  subjects: SubjectMeta[];
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
  tasks: StudyTask[];
  flashcards: Flashcard[];
  pomodoroLogs: PomodoroSession[];
  videos?: VideoResource[];
  pdfs?: PdfResource[];
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
  pdfs = [],
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

  // Sorted subjects: automatically sorted strictly by live exam time remaining (closest exam first = VOLUME 01)
  const displaySubjects = useMemo(() => {
    return sortSubjectsByExamUrgency(subjects);
  }, [subjects]);

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

  // Today's Smart 3-Step Study Queue (Top 3 most urgent study tasks across all books)
  const priorityMissions = useMemo(() => {
    const missions: Array<{
      stepNumber: string;
      subjectId: string;
      subjectName: string;
      accentColor: string;
      unitId?: string;
      unitTitle: string;
      title: string;
      reason: string;
      badge: string;
      actionText: string;
    }> = [];

    if (displaySubjects.length === 0) return missions;

    // Mission 1: Nearest Exam Subject with Weakest Topics
    const urgentSub = displaySubjects[0];
    const urgentTopics = topics.filter(t => t.subjectId === urgentSub.id);
    const urgentUnits = urgentSub.units || [];
    
    let bestUnit1: { unitId?: string; title: string; weakCount: number } = {
      unitId: urgentUnits[0]?.id,
      title: urgentUnits[0]?.title || 'Core Chapter 1',
      weakCount: 0
    };

    urgentUnits.forEach(u => {
      const uTopics = urgentTopics.filter(t => t.unitId === u.id || t.unitNumber === u.unit);
      const weak = uTopics.filter(t => t.mastery === 'weak' || !t.completed).length;
      if (weak >= bestUnit1.weakCount) {
        bestUnit1 = { unitId: u.id, title: u.title, weakCount: weak };
      }
    });

    const urgentDays = urgentSub.examDate ? Math.max(0, Math.ceil((new Date(urgentSub.examDate).getTime() - Date.now()) / (1000 * 3600 * 24))) : null;
    const daysLabel = urgentDays !== null ? `Exam in ${urgentDays}d` : 'Target Exam';

    missions.push({
      stepNumber: '01',
      subjectId: urgentSub.id,
      subjectName: urgentSub.name,
      accentColor: urgentSub.accentColor,
      unitId: bestUnit1.unitId,
      unitTitle: bestUnit1.title,
      title: `${urgentSub.name} • ${bestUnit1.title}`,
      reason: `${bestUnit1.weakCount > 0 ? `${bestUnit1.weakCount} Weak Topics` : 'High Priority'} • ${daysLabel}`,
      badge: '🚨 Exam Proximity',
      actionText: 'Study Chapter →'
    });

    // Mission 2: High-Probability PYQ Practice or Second Subject
    const highProbQuestions = questions.filter(q => q.isHighProbability && q.userStatus !== 'mastered');
    const targetQ = highProbQuestions[0] || questions.find(q => q.userStatus !== 'mastered');

    if (targetQ) {
      const qSub = subjects.find(s => s.id === targetQ.subjectId) || urgentSub;
      missions.push({
        stepNumber: '02',
        subjectId: qSub.id,
        subjectName: qSub.name,
        accentColor: qSub.accentColor,
        unitId: targetQ.unitId,
        unitTitle: targetQ.unitTitle || 'University PYQs',
        title: `University PYQ: ${targetQ.question.slice(0, 42)}...`,
        reason: `${targetQ.marks} Marks • Asked ${targetQ.repeatCount}x in Exams`,
        badge: '🔥 Repeat PYQ',
        actionText: 'Practice PYQs →'
      });
    } else {
      const secondSub = displaySubjects[1] || displaySubjects[0];
      missions.push({
        stepNumber: '02',
        subjectId: secondSub.id,
        subjectName: secondSub.name,
        accentColor: secondSub.accentColor,
        unitId: secondSub.units?.[0]?.id,
        unitTitle: secondSub.units?.[0]?.title || 'Chapter 1',
        title: `${secondSub.name} Core Revision`,
        reason: 'Master standard definitions & rubric keywords',
        badge: '🔥 Core Revision',
        actionText: 'Open Chapter →'
      });
    }

    // Mission 3: Uploaded PDF Dossier or Flashcard Sprint
    const unreadPdf = (pdfs || []).find(p => !p.isRead) || (pdfs || [])[0];
    if (unreadPdf) {
      const pdfSub = subjects.find(s => s.id === unreadPdf.subjectId) || urgentSub;
      missions.push({
        stepNumber: '03',
        subjectId: pdfSub.id,
        subjectName: pdfSub.name,
        accentColor: pdfSub.accentColor,
        unitId: unreadPdf.unitId,
        unitTitle: unreadPdf.fileName,
        title: `Dossier: ${unreadPdf.fileName}`,
        reason: `${unreadPdf.fileSize} • 5 Key Exam Points & Revision Notes`,
        badge: '📄 Chapter PDF',
        actionText: 'Read PDF →'
      });
    } else {
      const thirdSub = displaySubjects[2] || displaySubjects[0];
      missions.push({
        stepNumber: '03',
        subjectId: thirdSub.id,
        subjectName: thirdSub.name,
        accentColor: thirdSub.accentColor,
        unitId: thirdSub.units?.[1]?.id || thirdSub.units?.[0]?.id,
        unitTitle: thirdSub.units?.[1]?.title || 'Chapter 2',
        title: 'Active Recall Flashcard Sprint',
        reason: `${dueFlashcards.length} Cards Due for Review Today`,
        badge: '🃏 Flashcards',
        actionText: 'Review Cards →'
      });
    }

    return missions.slice(0, 3);
  }, [displaySubjects, topics, questions, pdfs, subjects, dueFlashcards.length]);

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

      {/* ⚡ TODAY'S SMART 3-STEP STUDY QUEUE STRIP */}
      {priorityMissions.length > 0 && (
        <div 
          className="w-full rounded-2xl p-4 sm:p-5 border shadow-md transition-colors space-y-3"
          style={{
            backgroundColor: isLight ? '#FAF7F0' : '#10131A',
            borderColor: isLight ? '#DCD7CE' : '#222733'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Today's Priority Study Queue
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                High-Impact Exam Crunch
              </span>
            </div>
            <span className="text-[11px] font-mono opacity-60">
              3 Targeted Missions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {priorityMissions.map((mission) => (
              <div 
                key={mission.stepNumber}
                onClick={() => onSelectSubject(mission.subjectId, mission.unitId)}
                className="p-3.5 rounded-xl border cursor-pointer hover:border-amber-500 transition-all shadow-xs flex flex-col justify-between gap-3 group bg-stone-100/90 dark:bg-stone-900/90 border-stone-300 dark:border-stone-800"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      STEP {mission.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {mission.badge}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {mission.title}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 font-mono">
                    {mission.reason}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800/80 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="text-[11px] font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mission.accentColor }} />
                    {mission.subjectName}
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[11px]">
                    {mission.actionText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {/* + Add Subject */}
          {onOpenAddSubject && (
            <button
              type="button"
              onClick={onOpenAddSubject}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Add Subject</span>
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
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 shadow-md transition-all active:scale-95 mt-2 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-stone-950" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      ) : (
        <div 
          className="grid gap-7 sm:gap-9 pt-4 items-stretch"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))' }}
        >
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
