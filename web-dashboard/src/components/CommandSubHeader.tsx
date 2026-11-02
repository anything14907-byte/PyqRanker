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
import { 
  GraduationCap, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Sparkles,
  ChevronDown,
  Layers,
  Search
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { SearchIndexItem } from '../utils/searchService';
import { ConfirmModal } from './ConfirmModal';

interface CommandSubHeaderProps {
  examSessions: ExamSession[];
  activeExamId: string;
  onSelectExam: (examId: string) => void;
  onAddExam: (name: string) => void;
  onRenameExam: (examId: string, newName: string) => void;
  onDeleteExam: (examId: string) => void;
  subjects: SubjectMeta[];
  topics?: SyllabusTopic[];
  questions?: PYQQuestion[];
  tasks?: StudyTask[];
  videos?: VideoResource[];
  pdfs?: PdfResource[];
  flashcards?: Flashcard[];
  files?: SubjectFile[];
  onNavigateToSearchResult: (item: SearchIndexItem) => void;
}

export const CommandSubHeader: React.FC<CommandSubHeaderProps> = ({
  examSessions,
  activeExamId,
  onSelectExam,
  onAddExam,
  onRenameExam,
  onDeleteExam,
  subjects,
  topics = [],
  questions = [],
  tasks = [],
  videos = [],
  pdfs = [],
  flashcards = [],
  files = [],
  onNavigateToSearchResult
}) => {
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingExamName, setEditingExamName] = useState('');
  const [examToDelete, setExamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);

  const activeExam = examSessions.find(e => e.id === activeExamId) || examSessions[0] || { id: 'mid-sem', name: 'Mid Sem' };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;
    onAddExam(newExamName.trim());
    setNewExamName('');
    setIsCreatingExam(false);
  };

  const handleRenameSubmit = (examId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExamName.trim()) return;
    onRenameExam(examId, editingExamName.trim());
    setEditingExamId(null);
  };

  const handleDeleteClick = (examId: string, name: string) => {
    if (examSessions.length <= 1) {
      alert('You must keep at least one exam session.');
      return;
    }
    setExamToDelete({ id: examId, name });
  };

  return (
    <div className="w-full px-4 sm:px-7 py-2.5 border-b border-paper-border/60 dark:border-white/10 bg-paper-card/60 dark:bg-black/25 backdrop-blur-xl transition-colors">
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* LEFT: Exam Type Segmented Glass Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-paper-well/60 dark:bg-white/5 border border-paper-borderWell dark:border-white/10 shadow-xs">
            {examSessions.map(session => {
              const isActive = session.id === activeExamId;
              const isEditing = editingExamId === session.id;

              if (isEditing) {
                return (
                  <form
                    key={session.id}
                    onSubmit={(e) => handleRenameSubmit(session.id, e)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-paper-cardElevated dark:bg-black/60 border border-emerald-500"
                  >
                    <input
                      type="text"
                      value={editingExamName}
                      onChange={(e) => setEditingExamName(e.target.value)}
                      autoFocus
                      className="w-24 sm:w-28 text-xs font-bold bg-transparent text-paper-ink dark:text-white focus:outline-none"
                    />
                    <button type="submit" className="p-0.5 text-emerald-500 hover:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingExamId(null)} className="p-0.5 text-paper-muted">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                );
              }

              return (
                <div key={session.id} className="relative group">
                  <button
                    onClick={() => onSelectExam(session.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-cyan-400 border border-emerald-500/40 dark:border-cyan-400/50 shadow-sm font-extrabold'
                        : 'text-paper-muted dark:text-slate-400 hover:text-paper-ink dark:hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500 dark:text-cyan-400' : 'text-paper-muted dark:text-slate-500'}`} />
                    <span>{session.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-cyan-400 shadow-glow-cyan" />
                    )}
                  </button>

                  {/* Hover action menu to Rename or Delete */}
                  <div className="hidden group-hover:flex absolute right-1 -top-2 items-center gap-0.5 bg-paper-card dark:bg-[#0c1222] border border-paper-border dark:border-white/20 rounded-lg p-0.5 shadow-md z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExamId(session.id);
                        setEditingExamName(session.name);
                      }}
                      className="p-1 rounded text-paper-muted hover:text-paper-ink dark:hover:text-white"
                      title="Rename Exam"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {examSessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session.id, session.name);
                        }}
                        className="p-1 rounded text-paper-muted hover:text-red-400"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* + New Exam Button / Form */}
            {isCreatingExam ? (
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-paper-cardElevated dark:bg-black/60 border border-cyan-500">
                <input
                  type="text"
                  placeholder="e.g. End Sem..."
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  autoFocus
                  className="w-24 sm:w-28 text-xs font-bold bg-transparent text-paper-ink dark:text-white focus:outline-none"
                />
                <button type="submit" className="p-0.5 text-cyan-400 hover:text-cyan-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setIsCreatingExam(false)} className="p-0.5 text-paper-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingExam(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-paper-muted dark:text-slate-400 hover:text-paper-ink dark:hover:text-cyan-400 hover:bg-white/5 border border-dashed border-paper-border dark:border-white/15 flex items-center gap-1 transition-all"
                title="Create New Exam Session"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Wide Spotlight-Style Global Search Bar */}
        <div className="flex-1 max-w-2xl relative w-full">
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
            onNavigateToSearchResult={onNavigateToSearchResult}
            className="w-full"
          />
        </div>

      </div>

      {/* Delete Exam Confirmation Modal */}
      <ConfirmModal
        isOpen={!!examToDelete}
        title="Delete Exam Session?"
        message={`Are you sure you want to delete "${examToDelete?.name}"? All its subjects, units, notes, and study progress will be removed. This action cannot be undone.`}
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
    </div>
  );
};
