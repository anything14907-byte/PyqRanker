import React, { useState } from 'react';
import { SubjectFile, FileCategory } from '../types';
import { X, Check, FolderInput, Edit2 } from 'lucide-react';

interface RenameFileModalProps {
  isOpen: boolean;
  file: SubjectFile | null;
  onClose: () => void;
  onSave: (updatedFile: SubjectFile) => void;
}

export const RenameFileModal: React.FC<RenameFileModalProps> = ({
  isOpen,
  file,
  onClose,
  onSave
}) => {
  if (!isOpen || !file) return null;

  const [name, setName] = useState(file.name);
  const [year, setYear] = useState(file.year || '2024');
  const [examType, setExamType] = useState(file.examType || 'End Sem');
  const [date, setDate] = useState(file.date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...file,
      name: name.trim(),
      year: file.category === 'pyq' ? year.trim() : file.year,
      examType: file.category === 'pyq' ? examType.trim() : file.examType,
      date: file.category === 'notes' ? date.trim() : file.date
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-2xl p-6 space-y-5 animate-scale-up">
        
        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              Rename File
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1.5">
              File Name / Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {file.category === 'pyq' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1.5">
                  Exam Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1.5">
                  Exam Type
                </label>
                <input
                  type="text"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  placeholder="e.g. End Sem / Mid Sem"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {file.category === 'notes' && (
            <div>
              <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1.5">
                Note / Lecture Date (Optional)
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Oct 24, 2026 or Unit 2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text border border-paper-border dark:border-night-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400 shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

interface MoveFileModalProps {
  isOpen: boolean;
  file: SubjectFile | null;
  onClose: () => void;
  onMove: (fileId: string, newCategory: FileCategory) => void;
}

export const MoveFileModal: React.FC<MoveFileModalProps> = ({
  isOpen,
  file,
  onClose,
  onMove
}) => {
  if (!isOpen || !file) return null;

  const [category, setCategory] = useState<FileCategory>(file.category);

  const categories: { id: FileCategory; label: string; desc: string }[] = [
    { id: 'pyq', label: 'PYQ Papers', desc: 'University previous year question papers with year tags' },
    { id: 'notes', label: 'Teacher Notes', desc: 'Faculty PDFs, class handouts and lecture materials' },
    { id: 'images', label: 'Images Gallery', desc: 'Whiteboards, handwritten diagrams and formula charts' }
  ];

  const handleConfirm = () => {
    onMove(file.id, category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-2xl p-6 space-y-5 animate-scale-up">
        
        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
          <div className="flex items-center gap-2">
            <FolderInput className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              Move to Another Section
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-paper-muted dark:text-night-muted">
          Select which tab <span className="font-bold text-paper-ink dark:text-night-text">"{file.name}"</span> should belong to:
        </p>

        <div className="space-y-2">
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-paper-border dark:border-night-border hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated text-paper-ink dark:text-night-text'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-paper-muted dark:border-night-muted'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-night-bg" />}
                </div>
                <div>
                  <div className="text-sm font-bold">{cat.label}</div>
                  <div className="text-[11px] text-paper-muted dark:text-night-muted">{cat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text border border-paper-border dark:border-night-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400 shadow-sm"
          >
            Move File
          </button>
        </div>

      </div>
    </div>
  );
};
