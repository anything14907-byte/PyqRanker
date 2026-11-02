import React from 'react';
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
  calculateUnitReadiness,
  getSubjectTotalStudiedMinutes,
  formatStudiedTime,
  formatUnitDisplayName
} from '../utils/storageService';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  Layers, 
  ArrowRight, 
  Timer, 
  Brain,
  Plus,
  Edit3,
  Database,
  Download,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Flame,
  FileText,
  CheckCircle2,
  Target,
  Zap,
  Award,
  Sparkles
} from 'lucide-react';

const SubjectPlanetEmblem: React.FC<{ accentColor: string; name: string; index: number }> = ({ accentColor, name, index }) => {
  const variant = index % 4;

  if (variant === 0) {
    // Ringed Saturn Gas Giant
    return (
      <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0 drop-shadow-xs mt-0.5">
        <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke={accentColor} strokeWidth="2" transform="rotate(-25 16 16)" opacity="0.9" />
        <circle cx="16" cy="16" r="8" fill={accentColor} />
        <circle cx="14" cy="13" r="2.5" fill="#FFFFFF" opacity="0.35" />
      </svg>
    );
  } else if (variant === 1) {
    // Ocean Terra Exoplanet with Moon
    return (
      <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0 drop-shadow-xs mt-0.5">
        <circle cx="15" cy="16" r="8" fill={accentColor} />
        <path d="M 11 15 Q 13 13, 16 15 T 19 16 Z" fill="#FFFFFF" opacity="0.4" />
        <circle cx="26" cy="11" r="2.5" fill="#F8FAFC" stroke={accentColor} strokeWidth="1" />
      </svg>
    );
  } else if (variant === 2) {
    // Cratered Mars / Solar Planet
    return (
      <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0 drop-shadow-xs mt-0.5">
        <circle cx="16" cy="16" r="8.5" fill={accentColor} />
        <circle cx="13" cy="14" r="1.8" fill="#000000" opacity="0.3" />
        <circle cx="18" cy="17" r="2.2" fill="#000000" opacity="0.25" />
        <circle cx="14" cy="19" r="1.3" fill="#000000" opacity="0.3" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
      </svg>
    );
  } else {
    // Striped Jupiter Sphere
    return (
      <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0 drop-shadow-xs mt-0.5">
        <circle cx="16" cy="16" r="8.5" fill={accentColor} />
        <line x1="8" y1="13" x2="24" y2="13" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.4" />
        <line x1="7.5" y1="16" x2="24.5" y2="16" stroke="#000000" strokeWidth="1.4" opacity="0.25" />
        <line x1="8.5" y1="19" x2="23.5" y2="19" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.35" />
      </svg>
    );
  }
};

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
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rocket boost state when user clicks study actions
  const [isBoosting, setIsBoosting] = React.useState(false);
  const triggerRocketBoost = () => {
    setIsBoosting(true);
    setTimeout(() => setIsBoosting(false), 1400);
  };

  const [dismissedBackupReminder, setDismissedBackupReminder] = React.useState(false);
  const lastBackupTs = Number(localStorage.getItem('pyq_last_backup_export_ts') || 0);
  const daysSinceBackup = lastBackupTs > 0 ? (Date.now() - lastBackupTs) / (1000 * 60 * 60 * 24) : 999;
  const showBackupReminder = !dismissedBackupReminder && daysSinceBackup >= 7;

  // Sorting: by date (closest exam first) or custom order (saved)
  const [sortMode, setSortMode] = React.useState<'date' | 'custom'>(() => {
    return (localStorage.getItem('pyq_subject_sort_mode') as 'date' | 'custom') || 'date';
  });
  const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null);

  const displaySubjects = React.useMemo(() => {
    if (sortMode === 'date') {
      return sortSubjectsByExamUrgency(subjects);
    }
    return subjects;
  }, [subjects, sortMode]);

  const handleMoveSubject = (idx: number, offset: number) => {
    const target = idx + offset;
    if (target < 0 || target >= displaySubjects.length) return;
    const reordered = [...displaySubjects];
    const [removed] = reordered.splice(idx, 1);
    reordered.splice(target, 0, removed);
    storageService.saveSubjects(reordered);
    if (onReorderSubjects) {
      onReorderSubjects(reordered);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (sortMode !== 'custom') return;
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (sortMode !== 'custom') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (sortMode !== 'custom' || draggedIdx === null || draggedIdx === targetIndex) return;
    e.preventDefault();
    const reordered = [...displaySubjects];
    const [removed] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIndex, 0, removed);
    setDraggedIdx(null);
    storageService.saveSubjects(reordered);
    if (onReorderSubjects) {
      onReorderSubjects(reordered);
    }
  };

  const sortedSubjectsForNext = React.useMemo(() => sortSubjectsByExamUrgency(subjects), [subjects]);
  const nextSubject = sortedSubjectsForNext.find(s => {
    if (!s.examDate || !s.examDate.trim()) return false;
    const u = getExamUrgencyColor(s.examDate);
    return u.hasDate && u.fractionalDays > 0;
  });

  const nextUrgency = nextSubject ? getExamUrgencyColor(nextSubject.examDate) : null;

  // Exam Readiness & Mastery Pipeline Metrics for nextSubject
  const masteryMetrics = React.useMemo(() => {
    if (!nextSubject) return null;
    const subTopics = topics.filter(t => t.subjectId === nextSubject.id);
    const completedTopics = subTopics.filter(t => t.completed).length;
    const totalTopics = subTopics.length;
    const syllabusPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const subQuestions = questions.filter(q => q.subjectId === nextSubject.id);
    const masteredQuestions = subQuestions.filter(q => q.userStatus === 'mastered' || q.bookmarked).length;
    const totalQuestions = subQuestions.length;
    const pyqPct = totalQuestions > 0 ? Math.round((masteredQuestions / totalQuestions) * 100) : 0;

    const subTasks = tasks.filter(t => t.subjectId === nextSubject.id);
    const completedTasks = subTasks.filter(t => t.completed).length;
    const totalTasks = subTasks.length;
    const tasksPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overallReadiness = Math.min(100, Math.round(
      (syllabusPct * 0.45) + (pyqPct * 0.35) + (tasksPct * 0.20)
    ));

    const nextUncompletedTopic = subTopics.find(t => !t.completed) || subTopics[0];

    return {
      completedTopics,
      totalTopics,
      syllabusPct,
      masteredQuestions,
      totalQuestions,
      pyqPct,
      completedTasks,
      totalTasks,
      tasksPct,
      overallReadiness,
      nextUncompletedTopic
    };
  }, [nextSubject, topics, questions, tasks]);

  // Flashcards due today
  const todayStr = new Date().toISOString().split('T')[0];
  const dueFlashcards = flashcards.filter(c => !c.nextReviewDate || c.nextReviewDate <= todayStr);

  // Focus time today
  const todayMinutes = pomodoroLogs
    .filter(l => l.date === todayStr)
    .reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);

  // Overall syllabus progress
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-slide-up pb-16">
      
      {/* 1. EXAM READINESS & MOMENTUM COMMAND CENTER (100% Widescreen Liquid Glass Card) */}
      {nextSubject && nextUrgency && nextUrgency.hasDate && masteryMetrics && (
        <div 
          className="relative overflow-hidden rounded-3xl p-6 sm:p-7 hardware-card liquid-glass-card transition-all w-full space-y-6"
          style={{ 
            borderTop: '3px solid ' + nextSubject.accentColor,
            borderLeft: '4px solid ' + nextSubject.accentColor
          }}
        >
          {/* Subtle Ambient Color Glow */}
          <div 
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: nextSubject.accentColor }}
          />

          {/* TOP SECTION: Live Subject Info, Liquid Progress Ring & Urgency Chronometer, Smart Next Action */}
          <div className="relative z-10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 w-full">
            
            {/* Left: Priority #1 Subject & Target Exam Date */}
            <div className="space-y-2.5 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 shadow-sm"
                  style={{ 
                    color: nextUrgency.hslColor,
                    backgroundColor: nextUrgency.hslColor + '18',
                    border: '1px solid ' + nextUrgency.hslColor + '35'
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Priority #1 • {nextUrgency.statusLabel}</span>
                </span>

                <span className="text-xs font-semibold text-paper-muted dark:text-slate-300 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target: {nextUrgency.formattedExamDate}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h1 
                  onClick={() => onSelectSubject(nextSubject.id)}
                  className="text-2xl sm:text-3xl font-black text-paper-ink dark:text-white tracking-tight cursor-pointer hover:text-cyan-400 transition-colors"
                  title="Open Subject Workspace"
                >
                  {nextSubject.name}
                </h1>
                {onEditSubject && (
                  <button
                    onClick={() => onEditSubject(nextSubject)}
                    className="p-1.5 rounded-xl border border-paper-border dark:border-white/15 text-paper-muted hover:text-paper-ink dark:text-slate-300 dark:hover:text-white hover:bg-white/10 btn-tactile transition-colors"
                    title="Edit Subject Name & Exam Date"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-paper-muted dark:text-slate-300">
                <span>⏱️ Studied: <strong className="text-paper-ink dark:text-white">{formatStudiedTime(getSubjectTotalStudiedMinutes(nextSubject.id, pomodoroLogs))}</strong></span>
                <span>•</span>
                <span>{nextSubject.units.length} Units</span>
                {nextSubject.code && (
                  <>
                    <span>•</span>
                    <span className="font-mono uppercase font-bold text-cyan-400">{nextSubject.code}</span>
                  </>
                )}
              </div>
            </div>

            {/* Center: Live Circular Liquid Progress Ring & Urgency Chronometer */}
            <div className="flex items-center justify-center gap-5 sm:gap-6 px-6 py-4 rounded-2xl instrument-well transition-all shrink-0">
              {/* SVG Circular Liquid Progress Ring */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="7"
                  />
                  {/* Glowing Animated Liquid Progress Stroke */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={nextSubject.accentColor || '#06B6D4'}
                    strokeWidth="7"
                    strokeDasharray={251.3}
                    strokeDashoffset={251.3 - (251.3 * masteryMetrics.overallReadiness) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: 'drop-shadow(0 0 6px ' + (nextSubject.accentColor || '#06B6D4') + ')'
                    }}
                  />
                </svg>
                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black font-mono text-paper-ink dark:text-white leading-none">
                    {masteryMetrics.overallReadiness}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-paper-muted dark:text-slate-400 mt-0.5">
                    Readiness
                  </span>
                </div>
              </div>

              {/* Countdown Numbers and Status Label */}
              <div className="flex flex-col justify-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-paper-muted dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: nextUrgency.hslColor }} />
                  <span>Countdown</span>
                </div>
                <div 
                  className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-wider countdown-digit"
                  style={{ color: nextUrgency.hslColor }}
                >
                  {nextUrgency.formattedCountdown}
                </div>
                <div className="text-[11px] font-semibold mt-1 flex items-center gap-1.5 text-paper-muted dark:text-slate-300">
                  <span className={'w-2 h-2 rounded-full ' + (nextUrgency.fractionalDays <= 5 ? 'bg-red-500 animate-ping' : nextUrgency.fractionalDays <= 15 ? 'bg-amber-400' : 'bg-emerald-400')} />
                  <span>
                    {nextUrgency.days}d {nextUrgency.hours}h Remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Instant Smart Action & Streak Momentum Button */}
            <div className="flex flex-col gap-2.5 xl:min-w-[310px] shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-paper-muted dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Smart Study Action</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  High Momentum
                </span>
              </div>

              {/* 🎯 Resume Next High-Weightage Topic Button */}
              <button
                onClick={() => {
                  if (masteryMetrics.nextUncompletedTopic) {
                    onSelectSubject(nextSubject.id, masteryMetrics.nextUncompletedTopic.unitId);
                  } else {
                    onSelectSubject(nextSubject.id);
                  }
                  onNavigateView('syllabus');
                  onShowToast('Resumed ' + (masteryMetrics.nextUncompletedTopic?.title || nextSubject.name), 'success');
                }}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-between gap-2 shadow-glow-cyan transition-all transform active:scale-98 group"
                title="Jump directly to the next high-yield topic"
              >
                <div className="flex items-center gap-2 text-left truncate">
                  <Target className="w-4 h-4 text-white shrink-0 group-hover:rotate-45 transition-transform" />
                  <div className="truncate">
                    <div>Resume Next Topic</div>
                    <div className="text-[10px] font-medium opacity-90 truncate max-w-[190px]">
                      {masteryMetrics.nextUncompletedTopic?.title || 'Review Syllabus'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateView('timer')}
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-paper-ink dark:text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Focus (25m)</span>
                </button>
                <button
                  onClick={() => onSelectSubject(nextSubject.id)}
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                  style={{ backgroundColor: nextSubject.accentColor + 'cc' }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span>Workspace</span>
                </button>
              </div>
            </div>

          </div>

          {/* CENTER & BOTTOM: Interactive 4-Stage Exam Mastery Pipeline */}
          <div className="relative z-10 w-full pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold tracking-wide uppercase font-mono text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Exam Mastery & Readiness Pipeline</span>
              </span>
              <span className="text-[11px] font-bold text-paper-muted dark:text-slate-400">
                {masteryMetrics.overallReadiness}% Goal Locked • Next Exam: {nextSubject.name}
              </span>
            </div>

            {/* Glowing Energy Wave Connecting Track */}
            <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 shadow-glow-cyan transition-all duration-700 relative"
                style={{ width: Math.max(5, masteryMetrics.overallReadiness) + '%' }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none" />
              </div>
            </div>

            {/* 4 Clickable Milestone Nodes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {/* Node 1: Syllabus Core */}
              <button
                onClick={() => {
                  onSelectSubject(nextSubject.id);
                  onNavigateView('syllabus');
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all btn-tactile group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-paper-ink dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Syllabus Core</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {masteryMetrics.syllabusPct}%
                  </span>
                </div>
                <div className="text-[11px] text-paper-muted dark:text-slate-400">
                  {masteryMetrics.completedTopics}/{masteryMetrics.totalTopics} Topics Covered
                </div>
              </button>

              {/* Node 2: High-Yield PYQs */}
              <button
                onClick={() => {
                  onSelectSubject(nextSubject.id);
                  onNavigateView('syllabus');
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all btn-tactile group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-paper-ink dark:text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>High-Yield PYQs</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    {masteryMetrics.pyqPct}%
                  </span>
                </div>
                <div className="text-[11px] text-paper-muted dark:text-slate-400">
                  {masteryMetrics.masteredQuestions}/{masteryMetrics.totalQuestions} Questions Mastered
                </div>
              </button>

              {/* Node 3: Notes & Formulae */}
              <button
                onClick={() => onNavigateView('pdf')}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all btn-tactile group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-paper-ink dark:text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Notes & Formulae</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {masteryMetrics.tasksPct}%
                  </span>
                </div>
                <div className="text-[11px] text-paper-muted dark:text-slate-400">
                  {masteryMetrics.completedTasks}/{masteryMetrics.totalTasks} Review Tasks Done
                </div>
              </button>

              {/* Node 4: Exam Ready */}
              <div 
                className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/15 via-emerald-500/10 to-indigo-500/15 border border-cyan-400/30 text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-paper-ink dark:text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Exam Ready</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {masteryMetrics.overallReadiness}%
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-cyan-300">
                  {masteryMetrics.overallReadiness >= 80 ? '🎯 Ready to Ace' : masteryMetrics.overallReadiness >= 50 ? '⚡ Strong Momentum' : '🔥 Focus on Weak Units'}
                </div>
              </div>
            </div>

            {/* Quick Unit Jump Track */}
            {nextSubject.units.length > 0 && (
              <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[10px] font-mono uppercase font-bold text-paper-muted dark:text-slate-400 shrink-0">
                  Quick Jump:
                </span>
                {nextSubject.units.map(unit => {
                  const readiness = calculateUnitReadiness(unit, tasks, videos, questions, topics);
                  return (
                    <button
                      key={unit.id}
                      onClick={() => onSelectSubject(nextSubject.id, unit.id)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-paper-ink dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                    >
                      <span>{formatUnitDisplayName(unit)}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{readiness.percentage}%</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SLEEK COMPACT 3-COLUMN STATS STRIP (~64px-70px height) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        {/* Stat 1: Syllabus Progress */}
        <div 
          onClick={() => onNavigateView('syllabus')}
          className="p-2.5 sm:p-3.5 rounded-2xl hardware-card hover:border-cyan-500/60 cursor-pointer transition-all flex items-center gap-2 sm:gap-3 group active:scale-[0.98] select-none"
          title="Open Syllabus to track unit & topic progress"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-base sm:text-xl font-black text-paper-ink dark:text-white leading-tight font-mono">
                {overallPercent}%
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-cyan-500 dark:text-cyan-400 hidden xs:inline">
                Syllabus
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-paper-muted dark:text-slate-400 truncate">
              <span className="xs:hidden">Syllabus • </span>{completedTopics}/{totalTopics} <span className="hidden sm:inline">done</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Focus Time Today */}
        <div 
          onClick={() => onNavigateView('timer')}
          className="p-2.5 sm:p-3.5 rounded-2xl hardware-card hover:border-emerald-500/60 cursor-pointer transition-all flex items-center gap-2 sm:gap-3 group active:scale-[0.98] select-none"
          title="Open Pomodoro Focus Timer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-base sm:text-xl font-black text-paper-ink dark:text-white leading-tight font-mono">
                {todayMinutes}m
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-500 dark:text-emerald-400 hidden xs:inline">
                Focus
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-paper-muted dark:text-slate-400 truncate">
              <span className="xs:hidden">Focus • </span>Today
            </div>
          </div>
        </div>

        {/* Stat 3: Spaced Repetition Due Today */}
        <div 
          onClick={() => onNavigateView('flashcards')}
          className="p-2.5 sm:p-3.5 rounded-2xl hardware-card hover:border-amber-500/60 cursor-pointer transition-all flex items-center gap-2 sm:gap-3 group active:scale-[0.98] select-none"
          title="Open Spaced Repetition Flashcards"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-base sm:text-xl font-black text-paper-ink dark:text-white leading-tight font-mono">
                {dueFlashcards.length}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-500 dark:text-amber-400 hidden xs:inline">
                Cards
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-paper-muted dark:text-slate-400 truncate">
              <span className="xs:hidden">Cards • </span>{dueFlashcards.length > 0 ? 'Due Today' : 'All done 🎉'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS SUMMARY FOR EACH SUBJECT (WITH DASHBOARD + ADD SUBJECT BUTTON) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Subject Progress Summary</span>
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted mt-0.5">
              Live syllabus progress, weak vs strong breakdown, and exam status across your subjects.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort: by exam date / my own order */}
            <div className="flex items-center gap-1 bg-paper-cardElevated dark:bg-night-cardElevated p-1 rounded-xl border border-paper-border dark:border-night-border text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSortMode('date');
                  localStorage.setItem('pyq_subject_sort_mode', 'date');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortMode === 'date' ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg font-bold shadow-sm' : 'text-paper-muted dark:text-night-muted hover:text-paper-ink'}`}
              >
                By Date
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortMode('custom');
                  localStorage.setItem('pyq_subject_sort_mode', 'custom');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortMode === 'custom' ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg font-bold shadow-sm' : 'text-paper-muted dark:text-night-muted hover:text-paper-ink'}`}
              >
                My Order
              </button>
            </div>

            {/* REQUIREMENT 2: Single "+ Add Subject" button on Dashboard */}
            {onOpenAddSubject && (
              <button
                onClick={onOpenAddSubject}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 btn-tactile shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            )}

            <button
              onClick={() => onNavigateView('syllabus')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline btn-tactile px-2 py-1"
            >
              Manage Syllabus →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
          {displaySubjects.map((sub, idx) => {
            const urgency = getExamUrgencyColor(sub.examDate);
            const progress = storageService.getSubjectProgress(sub.id, topics);
            const subPyqs = questions.filter(q => q.subjectId === sub.id);
            const masteredPyqs = subPyqs.filter(q => q.userStatus === 'mastered').length;
            const totalMinutesStudied = getSubjectTotalStudiedMinutes(sub.id, pomodoroLogs);

            return (
              <div
                key={sub.id}
                draggable={sortMode === 'custom'}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`p-5 rounded-2xl hardware-card flex flex-col justify-between transition-all group ${draggedIdx === idx ? 'opacity-40 scale-95 border-dashed border-emerald-500' : ''}`}
                style={{ 
                  borderTop: `4px solid ${sub.accentColor}`,
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div>
                  {/* Header: Title & Action Controls */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <SubjectPlanetEmblem accentColor={sub.accentColor} name={sub.name} index={idx} />
                      <h4 
                        onClick={() => onSelectSubject(sub.id)}
                        className="text-base font-extrabold text-paper-ink dark:text-night-text cursor-pointer hover:underline leading-snug break-words"
                        title={sub.name}
                      >
                        {sub.name}
                      </h4>
                      {onEditSubject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSubject(sub);
                          }}
                          className="p-1 rounded-md text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text opacity-70 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                          title="Edit subject name & exam date"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {sortMode === 'custom' && (
                        <div className="flex items-center gap-0.5 text-paper-muted shrink-0 mt-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubject(idx, -1);
                            }}
                            className="p-1 rounded hover:text-paper-ink dark:hover:text-night-text disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Move subject left"
                          >
                            <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === displaySubjects.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubject(idx, 1);
                            }}
                            className="p-1 rounded hover:text-paper-ink dark:hover:text-night-text disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Move subject right"
                          >
                            <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REQUIREMENT 2: Exact Formatted Exam Date + Smooth Color-Coded Urgency Badge */}
                  <div 
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border text-[11px] font-semibold my-2.5 transition-all"
                    style={{
                      backgroundColor: urgency.hasDate ? `${urgency.hslColor}10` : 'rgba(91, 101, 115, 0.08)',
                      borderColor: urgency.hasDate ? `${urgency.hslColor}35` : 'rgba(91, 101, 115, 0.2)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: urgency.hslColor }} />
                      <span className="truncate text-paper-ink dark:text-night-text font-medium">
                        {urgency.hasDate ? urgency.formattedExamDate : 'No exam date set'}
                      </span>
                    </div>
                    <div 
                      className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0 shadow-xs flex items-center gap-1"
                      style={{ 
                        backgroundColor: urgency.hasDate ? `${urgency.hslColor}25` : 'rgba(91, 101, 115, 0.15)',
                        color: urgency.hasDate ? urgency.hslColor : '#5B6573'
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {urgency.hasDate 
                          ? (urgency.fractionalDays > 0 ? `${urgency.days}d ${urgency.hours}h` : 'Exam Passed')
                          : 'Set Date'}
                      </span>
                    </div>
                  </div>

                  {/* Total Studied Time & Code */}
                  <div className="flex items-center gap-2 mb-3 text-[11px] text-paper-muted dark:text-night-muted flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border font-medium flex items-center gap-1">
                      <span>⏱️</span>
                      <span>Total Studied: <strong className="text-paper-ink dark:text-night-text">{formatStudiedTime(totalMinutesStudied)}</strong></span>
                    </span>
                    {sub.code && (
                      <span className="font-mono text-[10px] uppercase font-bold text-paper-muted dark:text-night-muted">
                        {sub.code}
                      </span>
                    )}
                  </div>

                  {/* Syllabus Progress bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-paper-body dark:text-night-text">Syllabus Completion</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{progress.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full instrument-well overflow-hidden p-0.5">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progress.percentage}%`,
                          background: `linear-gradient(90deg, ${sub.accentColor}, #10B981)`,
                          boxShadow: `0 0 10px ${sub.accentColor}80`
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-paper-muted dark:text-night-muted flex items-center justify-between">
                      <span>{progress.completed} of {progress.total} topics</span>
                      <span>{masteredPyqs}/{subPyqs.length} PYQs mastered</span>
                    </div>
                  </div>

                  {/* Topic Mastery Tags Breakdown (Weak / Okay / Strong - Sunken Instrument Wells) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold mb-3">
                    <div className="p-2 rounded-xl instrument-well text-rose-600 dark:text-rose-400">
                      <div className="text-sm font-extrabold font-mono">{progress.weakCount}</div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">Weak</div>
                    </div>
                    <div className="p-2 rounded-xl instrument-well text-amber-600 dark:text-amber-400">
                      <div className="text-sm font-extrabold font-mono">{progress.okayCount}</div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">Okay</div>
                    </div>
                    <div className="p-2 rounded-xl instrument-well text-emerald-600 dark:text-emerald-400">
                      <div className="text-sm font-extrabold font-mono">{progress.strongCount}</div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">Strong</div>
                    </div>
                  </div>

                  {/* REQUIREMENT 2.3: Clickable Unit / Top Topic Pills Below Mastery Counters */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider">
                      <span>Units & Topics</span>
                      <span className="font-mono">{sub.units.length} Units</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {sub.units.map(unit => {
                        const readiness = calculateUnitReadiness(unit, tasks, videos, questions, topics);
                        return (
                          <div
                            key={unit.id}
                            className="inline-flex items-center rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border hover:border-emerald-500/50 transition-all text-[11px] overflow-hidden group/pill"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSubject(sub.id, unit.id);
                              }}
                              className="px-2.5 py-1 font-bold text-paper-ink dark:text-night-text hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 btn-tactile"
                              title={`Jump to ${formatUnitDisplayName(unit)} in Syllabus (${readiness.percentage}% ready)`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub.accentColor }} />
                              <span className="truncate max-w-[95px]">{formatUnitDisplayName(unit)}</span>
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400">
                                {readiness.percentage}%
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSubject(sub.id, unit.id);
                              }}
                              className="px-1.5 py-1 text-[10px] font-semibold text-paper-muted hover:text-cyan-600 dark:hover:text-cyan-400 border-l border-paper-border dark:border-night-border hover:bg-black/5 dark:hover:bg-white/5"
                              title={`Quick Add Video or PDF in ${formatUnitDisplayName(unit)}`}
                            >
                              +Add
                            </button>
                          </div>
                        );
                      })}
                      {sub.units.length === 0 && (
                        <span className="text-[11px] text-paper-muted dark:text-night-muted italic">
                          No units added yet. Open subject to configure syllabus units.
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Bottom Action Buttons: Direct 1-Tap Open Syllabus & Practice PYQs */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-paper-border/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubject(sub.id);
                      onNavigateView('syllabus');
                    }}
                    className="w-full py-2 px-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 btn-hardware transition-all active:scale-95 shadow-sm"
                    style={{ 
                      backgroundColor: sub.accentColor,
                      boxShadow: 'var(--shadow-btn)'
                    }}
                    title={`Open Syllabus for ${sub.name}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Open Syllabus →</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubject(sub.id);
                      onNavigateView('syllabus');
                    }}
                    className="w-full py-2 px-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    title={`Practice ${subPyqs.length} PYQs for ${sub.name}`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="truncate">Practice PYQs →</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
