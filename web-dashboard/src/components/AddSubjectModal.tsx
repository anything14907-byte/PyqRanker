import React, { useState } from 'react';
import { SubjectMeta, SubjectUnit } from '../types';
import { ACCENT_PALETTE, toDatetimeLocalString } from '../utils/storageService';
import { Plus, X, Calendar, BookOpen, Tag } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newSubject: SubjectMeta) => void;
}

const ICON_OPTIONS = ['Cpu', 'Database', 'Network', 'Code', 'BookOpen'];

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('5th Semester');
  const [accentColor, setAccentColor] = useState(ACCENT_PALETTE[0].hex);
  const [iconName, setIconName] = useState(ICON_OPTIONS[0]);
  const [examDate, setExamDate] = useState('');
  const [unitsInput, setUnitsInput] = useState('Unit 1: Fundamentals & Architecture\nUnit 2: Core Processing & Logic\nUnit 3: Optimization & Practice');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse units (Preserve user typed unit titles and labels)
    const parsedUnits: SubjectUnit[] = unitsInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const match = line.match(/^(unit\s*[\d\w]+|[a-z]+\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
        const label = match ? match[1].trim() : undefined;
        const title = match ? match[2].trim() : line;
        const numMatch = label?.match(/\d+/);
        return {
          id: `unit-${Date.now().toString(36)}-${idx}`,
          unitLabel: label,
          unit: numMatch ? Number(numMatch[0]) : (idx + 1),
          unitNumber: label || line,
          title: title,
          name: title
        };
      });

    const newId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const code = name.trim().split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();

    const newSubject: SubjectMeta = {
      id: newId,
      name: name.trim(),
      code: code || 'SUB',
      semester: semester.trim(),
      accentColor,
      iconName,
      examDate: examDate.trim() || undefined,
      units: parsedUnits.length > 0 ? parsedUnits : [
        { id: 'u1', unit: 1, title: 'Core Syllabus & Fundamentals', name: 'Core Syllabus & Fundamentals' }
      ]
    };

    onAdd(newSubject);
    setName('');
    setExamDate('');
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
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              + Add New Subject
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              Configure exam date, 10 card theme colors, and syllabus units
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
              placeholder="e.g. Software Engineering or Artificial Intelligence"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-paper-ink dark:text-night-text mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Exam Date & Starting Time</span>
              </span>
              <span className="text-[10px] text-paper-muted dark:text-night-muted font-normal">(Optional)</span>
            </label>
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
                <span>Card Accent Theme (10 Rich Colors)</span>
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
              <span className="text-[10px] text-paper-muted dark:text-night-muted">Auto-organized inside subject</span>
            </label>
            <textarea
              rows={3}
              value={unitsInput}
              onChange={e => setUnitsInput(e.target.value)}
              placeholder="Unit 1: Overview&#10;Unit 2: Deep Dive&#10;Unit 3: Applications"
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted focus:outline-none focus:border-emerald-500 text-xs font-mono resize-none"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs font-semibold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 btn-tactile shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
