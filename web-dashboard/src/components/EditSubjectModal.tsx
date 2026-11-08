import React, { useState, useEffect } from 'react';
import { SubjectMeta, SubjectUnit } from '../types';
import { ACCENT_PALETTE, formatUnitDisplayName, storageService } from '../utils/storageService';
import { Edit3, X, Trash2, Calendar, BookOpen, Tag, Check } from 'lucide-react';

interface EditSubjectModalProps {
  subject: SubjectMeta | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: SubjectMeta) => void;
  onDelete: (id: string) => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  subject,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_PALETTE[0].hex);
  const [examDate, setExamDate] = useState('');
  const [unitsInput, setUnitsInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setSemester(subject.semester || '5th Semester');
      setAccentColor(subject.accentColor || ACCENT_PALETTE[0].hex);
      setExamDate(subject.examDate || '');
      setUnitsInput(
        subject.units.map(u => formatUnitDisplayName(u)).join('\n')
      );
      setShowDeleteConfirm(false);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const topicsCount = storageService.getTopics(subject.id).length;
  const questionsCount = storageService.getQuestions().filter(q => q.subjectId === subject.id).length;
  const tasksCount = storageService.getTasks().filter(t => t.subjectId === subject.id).length;
  const flashcardsCount = storageService.getFlashcards(subject.id).length;
  const totalLost = topicsCount + questionsCount + tasksCount + flashcardsCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedUnits: SubjectUnit[] = unitsInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const match = line.match(/^(unit\s*[\d\w]+|[a-z]+\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
        const label = match ? match[1].trim() : (subject.units[idx]?.unitLabel || undefined);
        const title = match ? match[2].trim() : line;
        const numMatch = label?.match(/\d+/);
        return {
          id: subject.units[idx]?.id || `unit-${Date.now().toString(36)}-${idx}`,
          unitLabel: label,
          unit: numMatch ? Number(numMatch[0]) : (subject.units[idx]?.unit || (idx + 1)),
          unitNumber: label || title,
          title: title,
          name: title
        };
      });

    const updated: SubjectMeta = {
      ...subject,
      name: name.trim(),
      semester: semester.trim(),
      accentColor,
      examDate: examDate.trim() || undefined,
      units: parsedUnits.length > 0 ? parsedUnits : subject.units
    };

    onUpdate(updated);
    onClose();
  };

  const handleDelete = () => {
    onDelete(subject.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto animate-fade-slide-up">
      <div className="w-full max-w-lg p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              Edit Subject
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              {subject.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-paper-ink dark:text-night-text mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Subject Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Exam Date & Starting Time</span>
              </label>
              {examDate && (
                <button
                  type="button"
                  onClick={() => setExamDate('')}
                  className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Clear date
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* 10 Card Accent Theme Colors */}
          <div>
            <label className="block text-xs font-semibold text-paper-ink dark:text-night-text mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Card Accent Theme</span>
              </span>
              <span className="text-[11px] font-mono font-bold" style={{ color: accentColor }}>
                {ACCENT_PALETTE.find(c => c.hex === accentColor)?.name}
              </span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border">
              {ACCENT_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full transition-transform btn-tactile mx-auto ${accentColor === c.hex ? 'scale-125 ring-2 ring-emerald-500 shadow-sm' : 'opacity-75 hover:opacity-100'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-paper-ink dark:text-night-text mb-1 flex items-center justify-between">
              <span>Syllabus Units (1 per line)</span>
              <span className="text-[10px] text-paper-muted dark:text-night-muted">Organized inside subject</span>
            </label>
            <textarea
              rows={3}
              value={unitsInput}
              onChange={e => setUnitsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 text-xs font-mono resize-none"
            />
          </div>

          {/* Delete Section */}
          <div className="pt-2 border-t border-paper-border dark:border-night-border">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 btn-tactile transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Subject</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs font-semibold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg text-xs font-bold flex items-center gap-1.5 btn-tactile shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Trash2 className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Confirm deletion? {totalLost} item(s) will be lost</span>
                </div>
                <p className="text-[11px] text-paper-muted dark:text-night-muted leading-relaxed">
                  Permanently deletes <strong className="text-paper-ink dark:text-night-text">{subject.name}</strong> and all its associated data:
                  {' '}{topicsCount} topic(s), {questionsCount} question(s), {tasksCount} task(s), and {flashcardsCount} flashcard(s).
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs btn-tactile"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 btn-tactile transition-colors"
                  >
                    Yes, Delete ({totalLost} items)
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
