import React, { useState } from 'react';
import { SubjectMeta, PYQQuestion, StudyTask } from '../types';
import { getExamUrgencyColor, sortSubjectsByExamUrgency, ACCENT_PALETTE, formatUnitDisplayName, storageService } from '../utils/storageService';
import { EditExamDateModal } from './EditExamDateModal';
import { EditUnitsModal } from './EditUnitsModal';
import { 
  Clock, Calendar, Plus, ArrowRight, Trash2, Palette, 
  Cpu, Database, Network, Code, BookOpen, AlertCircle, Layers,
  ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';

interface CommandCenterOverviewProps {
  subjects: SubjectMeta[];
  questions: PYQQuestion[];
  tasks: StudyTask[];
  onSelectSubject: (id: string, unitId?: string) => void;
  onOpenAddSubject: () => void;
  onUpdateSubject: (subject: SubjectMeta) => void;
  onDeleteSubject: (id: string) => void;
  onReorderSubjects?: (subjects: SubjectMeta[]) => void;
}

export const CommandCenterOverview: React.FC<CommandCenterOverviewProps> = ({
  subjects,
  questions,
  tasks,
  onSelectSubject,
  onOpenAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onReorderSubjects
}) => {
  const [editingDateSubject, setEditingDateSubject] = useState<SubjectMeta | null>(null);
  const [editingUnitsSubject, setEditingUnitsSubject] = useState<SubjectMeta | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [activeColorPickerSubjectId, setActiveColorPickerSubjectId] = useState<string | null>(null);

  // Switch: "Sort: by exam date / my own order"
  const [sortMode, setSortMode] = useState<'date' | 'custom'>(() => {
    return (localStorage.getItem('pyq_subject_sort_mode') as 'date' | 'custom') || 'date';
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleSetSortMode = (mode: 'date' | 'custom') => {
    setSortMode(mode);
    localStorage.setItem('pyq_subject_sort_mode', mode);
  };

  // Only subjects with valid dates, sorted by urgency
  const subjectsWithDate = React.useMemo(() => {
    return sortSubjectsByExamUrgency(subjects.filter(s => s.examDate && s.examDate.trim().length > 0));
  }, [subjects]);

  // Displayed subjects list depending on sortMode
  const displaySubjects = React.useMemo(() => {
    if (sortMode === 'date') {
      return sortSubjectsByExamUrgency(subjects);
    }
    return subjects;
  }, [subjects, sortMode]);

  // Find the single nearest upcoming exam with a date for the hero header
  const nearestSubjectWithUrgency = React.useMemo(() => {
    if (subjectsWithDate.length === 0) return null;
    const top = subjectsWithDate[0];
    const urgency = getExamUrgencyColor(top.examDate);
    if (!urgency.hasDate || urgency.fractionalDays <= 0) return null;
    return {
      subject: top,
      urgency
    };
  }, [subjectsWithDate]);

  const handleMoveSubject = (idx: number, offset: number) => {
    const target = idx + offset;
    if (target < 0 || target >= displaySubjects.length) return;
    const reordered = [...displaySubjects];
    const [removed] = reordered.splice(idx, 1);
    reordered.splice(target, 0, removed);
    storageService.saveSubjects(reordered);
    if (onReorderSubjects) {
      onReorderSubjects(reordered);
    } else {
      onUpdateSubject(reordered[0]);
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
    } else {
      onUpdateSubject(reordered[0]);
    }
  };

  const getSubjectIcon = (name: string) => {
    switch (name) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Network': return <Network className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const handleQuickColorChange = (subject: SubjectMeta, hex: string) => {
    onUpdateSubject({ ...subject, accentColor: hex });
    setActiveColorPickerSubjectId(null);
  };

  return (
    <div className="space-y-8 animate-fade-slide-up">
      
      {/* 1. TOP HERO: NEAREST UPCOMING EXAM */}
      {nearestSubjectWithUrgency && (
        <div 
          className={`p-6 sm:p-7 rounded-3xl bg-paper-card dark:bg-night-card border transition-all duration-700 shadow-paper-card dark:shadow-night-card relative overflow-hidden ${nearestSubjectWithUrgency.urgency.isUrgent ? 'pulse-urgent-exam' : ''}`}
          style={{ 
            borderColor: nearestSubjectWithUrgency.subject.accentColor,
            borderTopWidth: '5px'
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Exam Info & Exact Date */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-500"
                  style={{ 
                    color: nearestSubjectWithUrgency.urgency.hslColor,
                    backgroundColor: `${nearestSubjectWithUrgency.urgency.hslColor}18`
                  }}
                >
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>🚨 Priority #1 • Closest Exam</span>
                </span>

                <span className="text-xs text-paper-muted dark:text-night-muted font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{nearestSubjectWithUrgency.urgency.formattedExamDate}</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-paper-ink dark:text-night-text tracking-tight">
                {nearestSubjectWithUrgency.subject.name}
              </h2>

              <p className="text-xs sm:text-sm text-paper-body dark:text-night-muted mt-1 max-w-xl">
                {nearestSubjectWithUrgency.urgency.fractionalDays <= 5 
                  ? '🚨 Urgent revision window! Focus strictly on the highest-repeated past questions.'
                  : 'Prepare comfortably with unit-by-unit study checklist and video lectures.'}
              </p>
            </div>

            {/* Right: Live Ticking Countdown HUD & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              
              {/* Ticking Timer Box with Urgency Shift */}
              <div 
                className="p-4 rounded-2xl border transition-colors duration-500 shadow-sm"
                style={{ 
                  backgroundColor: `${nearestSubjectWithUrgency.urgency.hslColor}12`,
                  borderColor: `${nearestSubjectWithUrgency.urgency.hslColor}35`
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted mb-1 flex items-center gap-1">
                  <span>Time Remaining:</span>
                </div>
                
                <div 
                  className="text-2xl sm:text-3xl font-extrabold countdown-digit"
                  style={{ color: nearestSubjectWithUrgency.urgency.hslColor }}
                >
                  {nearestSubjectWithUrgency.urgency.formattedCountdown}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onSelectSubject(nearestSubjectWithUrgency.subject.id)}
                  className="px-5 py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm btn-tactile btn-shimmer"
                  style={{ backgroundColor: nearestSubjectWithUrgency.subject.accentColor }}
                >
                  <span>Open Subject</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setEditingDateSubject(nearestSubjectWithUrgency.subject)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:border-emerald-500 transition-colors btn-tactile text-center"
                >
                  Change Date
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. SUBJECT CARDS GRID */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
              <span>Your Subjects</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted font-bold font-mono">
                {displaySubjects.length} Active
              </span>
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted mt-0.5">
              {sortMode === 'date' 
                ? 'Sorted by upcoming exam date (closest exam first).' 
                : 'My own order: drag cards or use arrows to reorder subjects.'}
            </p>
          </div>

          {/* Switch: "Sort: by exam date / my own order" */}
          <div className="flex items-center gap-1.5 p-1 bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border rounded-xl self-start sm:self-auto shadow-xs">
            <span className="text-xs font-semibold px-2 text-paper-muted dark:text-night-muted">Sort:</span>
            <button
              type="button"
              onClick={() => handleSetSortMode('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-tactile ${
                sortMode === 'date'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card'
              }`}
            >
              by exam date
            </button>
            <button
              type="button"
              onClick={() => handleSetSortMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-tactile ${
                sortMode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card'
              }`}
            >
              my own order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {displaySubjects.map((subject, idx) => {
            const urgency = getExamUrgencyColor(subject.examDate);
            const subQuestions = questions.filter(q => q.subjectId === subject.id);
            const subTasks = tasks.filter(t => t.subjectId === subject.id);
            const isColorPickerOpen = activeColorPickerSubjectId === subject.id;

            // Priority label: ONLY compares subjects that have an exam date! Fits on 1 line!
            let priorityBadge = 'Set exam date';
            if (subject.examDate && urgency.hasDate) {
              if (urgency.fractionalDays <= 0) {
                priorityBadge = 'Exam passed';
              } else {
                const dateRank = subjectsWithDate.findIndex(s => s.id === subject.id);
                if (dateRank === 0) {
                  priorityBadge = '#1 Closest exam';
                } else if (dateRank > 0) {
                  priorityBadge = `#${dateRank + 1} Priority`;
                } else {
                  priorityBadge = 'Scheduled';
                }
              }
            }

            return (
              <div
                key={subject.id}
                draggable={sortMode === 'custom'}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md relative group ${
                  draggedIdx === idx ? 'opacity-50 ring-2 ring-emerald-500 scale-[0.98]' : ''
                } ${sortMode === 'custom' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{ 
                  borderTop: `4px solid ${subject.accentColor}`
                }}
              >
                <div>
                  
                  {/* Priority Rank Tag with Urgency Color (1 Line Guarantee) */}
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 whitespace-nowrap shrink-0 overflow-hidden text-ellipsis max-w-[65%]"
                      style={{ 
                        color: urgency.hasDate ? urgency.hslColor : '#5B6573',
                        backgroundColor: urgency.hasDate ? `${urgency.hslColor}16` : '#5B657316'
                      }}
                      title={priorityBadge}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{priorityBadge}</span>
                    </span>

                    {/* Header Controls: Reorder arrows (in custom mode), Quick Color Picker & Delete */}
                    <div className="flex items-center gap-1 relative shrink-0">
                      
                      {sortMode === 'custom' && (
                        <div className="flex items-center gap-0.5 mr-1 bg-paper-cardElevated/70 dark:bg-night-cardElevated/70 rounded-lg p-0.5 border border-paper-border dark:border-night-border">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubject(idx, -1);
                            }}
                            className="p-1 rounded text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text disabled:opacity-20 disabled:cursor-not-allowed btn-tactile"
                            title="Move subject up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === displaySubjects.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubject(idx, 1);
                            }}
                            className="p-1 rounded text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text disabled:opacity-20 disabled:cursor-not-allowed btn-tactile"
                            title="Move subject down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* 🎨 Quick Color Swatch Popover Trigger */}
                      <button
                        onClick={() => setActiveColorPickerSubjectId(isColorPickerOpen ? null : subject.id)}
                        className="p-1.5 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated transition-colors btn-tactile"
                        title="Change card accent color"
                      >
                        <Palette className="w-3.5 h-3.5" style={{ color: subject.accentColor }} />
                      </button>

                      {/* Color Picker Dropdown Popover */}
                      {isColorPickerOpen && (
                        <div className="absolute right-0 top-8 z-30 p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-xl grid grid-cols-5 gap-1.5 w-44 animate-fade-slide-up">
                          {ACCENT_PALETTE.map(c => (
                            <button
                              key={c.hex}
                              onClick={() => handleQuickColorChange(subject, c.hex)}
                              title={c.name}
                              className={`w-6 h-6 rounded-full transition-transform btn-tactile ${subject.accentColor === c.hex ? 'scale-125 ring-2 ring-emerald-500' : 'opacity-80 hover:opacity-100'}`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Delete Subject Button */}
                      <button
                        onClick={() => setSubjectToDelete(subject.id)}
                        className="p-1.5 text-paper-muted dark:text-night-muted hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors btn-tactile"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Title & Icon - 2 lines wrap with min-height & full name on hover */}
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                      style={{ 
                        backgroundColor: `${subject.accentColor}18`,
                        color: subject.accentColor
                      }}
                    >
                      {getSubjectIcon(subject.iconName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        onClick={() => onSelectSubject(subject.id)}
                        className="text-base font-bold text-paper-ink dark:text-night-text cursor-pointer transition-colors line-clamp-2 min-h-[3rem] leading-snug break-words"
                        title={subject.name}
                      >
                        {subject.name}
                      </h4>
                      <span className="text-[11px] text-paper-muted dark:text-night-muted font-medium">
                        {subject.units.length} Units • {subQuestions.length} PYQs
                      </span>
                    </div>
                  </div>

                  {/* 1. Visible Exam Date with 1-Click "Change Date" Picker */}
                  <div className="my-2.5 p-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-paper-body dark:text-night-text min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-paper-muted dark:text-night-muted shrink-0" />
                      <span className="font-semibold text-[11px] truncate">
                        {urgency.hasDate ? urgency.formattedExamDate : 'No exam date set'}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingDateSubject(subject)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 btn-tactile"
                    >
                      {urgency.hasDate ? 'Change Date' : 'Set Date'}
                    </button>
                  </div>

                  {/* 2. Live Countdown Timer OR "Set exam date" prompt */}
                  {subject.examDate && urgency.hasDate ? (
                    <div 
                      className="p-3 rounded-xl mb-3 text-center border transition-all duration-600 min-h-[64px] flex flex-col justify-center"
                      style={{ 
                        backgroundColor: `${urgency.hslColor}10`,
                        borderColor: `${urgency.hslColor}35`
                      }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted mb-0.5">
                        Time Remaining
                      </div>
                      <div 
                        className="text-lg font-extrabold countdown-digit"
                        style={{ color: urgency.hslColor }}
                      >
                        {urgency.formattedCountdown}
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingDateSubject(subject)}
                      className="p-3 rounded-xl mb-3 text-center border border-dashed border-paper-border dark:border-night-border hover:border-emerald-500 cursor-pointer transition-all bg-paper-cardElevated/40 dark:bg-night-cardElevated/40 min-h-[64px] flex flex-col justify-center btn-tactile group/btn"
                    >
                      <div className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center justify-center gap-1.5 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400">
                        <Calendar className="w-3.5 h-3.5 text-paper-muted" />
                        <span>Set exam date</span>
                      </div>
                      <div className="text-[10px] text-paper-muted dark:text-night-muted mt-0.5">
                        Click to schedule countdown
                      </div>
                    </div>
                  )}

                  {/* 3. UNITS PILL TAGS ON FRONT PAGE - wraps 2 lines, formatUnitDisplayName */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Syllabus Units ({subject.units.length}):</span>
                      </span>
                      <button
                        onClick={() => setEditingUnitsSubject(subject)}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline btn-tactile"
                      >
                        + Add / Edit
                      </button>
                    </div>

                    {/* Clickable Unit Pills */}
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {subject.units.map(u => (
                        <button
                          key={u.id}
                          onClick={() => onSelectSubject(subject.id, u.id)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all btn-tactile text-left line-clamp-2 leading-tight break-words max-w-full"
                          style={{
                            backgroundColor: `${subject.accentColor}10`,
                            borderColor: `${subject.accentColor}30`,
                            color: subject.accentColor
                          }}
                          title={formatUnitDisplayName(u)}
                        >
                          {formatUnitDisplayName(u)}
                        </button>
                      ))}

                      {subject.units.length === 0 && (
                        <button
                          onClick={() => setEditingUnitsSubject(subject)}
                          className="text-[11px] text-paper-muted dark:text-night-muted italic hover:underline"
                        >
                          + Click to add your first syllabus unit
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Open Subject Button with Subject Accent Color */}
                <button
                  onClick={() => onSelectSubject(subject.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm btn-tactile btn-shimmer transition-transform mt-2"
                  style={{ backgroundColor: subject.accentColor }}
                >
                  <span>Open Subject</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Date Modal */}
      {editingDateSubject && (
        <EditExamDateModal
          subject={editingDateSubject}
          isOpen={!!editingDateSubject}
          onClose={() => setEditingDateSubject(null)}
          onSave={(newDate) => {
            onUpdateSubject({ ...editingDateSubject, examDate: newDate });
          }}
        />
      )}

      {/* Edit Units Modal */}
      {editingUnitsSubject && (
        <EditUnitsModal
          subject={editingUnitsSubject}
          isOpen={!!editingUnitsSubject}
          onClose={() => setEditingUnitsSubject(null)}
          onSaveUnits={(updatedUnits) => {
            onUpdateSubject({ ...editingUnitsSubject, units: updatedUnits });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {subjectToDelete && (() => {
        const targetSub = subjects.find(s => s.id === subjectToDelete);
        const subTopicsCount = storageService.getTopics(subjectToDelete).length;
        const subPyqsCount = questions.filter(q => q.subjectId === subjectToDelete).length;
        const subTasksCount = tasks.filter(t => t.subjectId === subjectToDelete).length;
        const subCardsCount = storageService.getFlashcards(subjectToDelete).length;
        const totalItemsLost = subTopicsCount + subPyqsCount + subTasksCount + subCardsCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-xl">
              <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-base font-bold">Delete Subject?</h3>
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted mb-5 leading-relaxed">
                Permanently delete <strong className="text-paper-ink dark:text-night-text">{targetSub?.name || 'this subject'}</strong>?
                {' '}<strong>{totalItemsLost} item(s)</strong> will be lost ({subTopicsCount} topics, {subPyqsCount} questions, {subTasksCount} tasks, {subCardsCount} flashcards). This action cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSubjectToDelete(null)}
                  className="flex-1 py-2 rounded-xl border border-paper-border dark:border-night-border text-xs font-semibold text-paper-body dark:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteSubject(subjectToDelete);
                    setSubjectToDelete(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 btn-tactile"
                >
                  Delete ({totalItemsLost} items)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
