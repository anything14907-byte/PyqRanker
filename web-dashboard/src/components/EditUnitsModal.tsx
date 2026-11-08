import React, { useState, useEffect } from 'react';
import { SubjectMeta, SubjectUnit } from '../types';
import { X, Plus, Trash2, BookOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { formatUnitDisplayName } from '../utils/storageService';

interface EditUnitsModalProps {
  subject: SubjectMeta;
  isOpen: boolean;
  onClose: () => void;
  onSaveUnits: (updatedUnits: SubjectUnit[]) => void;
}

export const EditUnitsModal: React.FC<EditUnitsModalProps> = ({
  subject,
  isOpen,
  onClose,
  onSaveUnits
}) => {
  const [units, setUnits] = useState<SubjectUnit[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (subject && subject.units) {
      setUnits(subject.units.map((u, idx) => {
        let label = (u.unitLabel || '').trim();
        let title = (u.title || u.name || '').trim();

        if (!label) {
          const match = title.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
          if (match) {
            label = match[1].trim();
            title = match[2].trim();
          } else if (u.unitNumber) {
            label = String(u.unitNumber).trim();
          } else if (u.unit) {
            label = `Unit ${u.unit}`;
          } else {
            label = 'Unit';
          }
        } else {
          const prefixRegex = new RegExp('^(' + label.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '|unit\\s*\\d+)[:\\s\\-\\–]*', 'i');
          title = title.replace(prefixRegex, '').trim();
        }

        return {
          ...u,
          unitLabel: label,
          title: title || label
        };
      }));
    }
  }, [subject, isOpen]);

  if (!isOpen) return null;

  const handleLabelChange = (id: string, label: string) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, unitLabel: label, unitNumber: label } : u));
  };

  const handleTitleChange = (id: string, title: string) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, title, name: title } : u));
  };

  const handleMoveUnit = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= units.length) return;
    const reordered = [...units];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setUnits(reordered);
  };

  const handleConfirmDelete = () => {
    if (deletingUnitId) {
      setUnits(prev => prev.filter(u => u.id !== deletingUnitId));
      setDeletingUnitId(null);
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newLabel.trim();
    const cleanTitle = newTitle.trim();
    if (!cleanLabel && !cleanTitle) return;

    const label = cleanLabel || `Unit ${units.length + 1}`;
    const title = cleanTitle || label;

    const newUnit: SubjectUnit = {
      id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      unitLabel: label,
      title: title,
      name: title,
      unitNumber: label
    };

    setUnits(prev => [...prev, newUnit]);
    setNewLabel('');
    setNewTitle('');
  };

  const handleSave = () => {
    const cleaned = units.filter(u => (u.title && u.title.trim().length > 0) || (u.unitLabel && u.unitLabel.trim().length > 0));
    onSaveUnits(cleaned.length > 0 ? cleaned : subject.units);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up">
      <div className="w-full max-w-xl p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
            style={{ backgroundColor: `${subject.accentColor}18`, color: subject.accentColor }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              Manage Subject Units
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              {subject.name} • Two separate fields: Unit Label & Unit Title
            </p>
          </div>
        </div>

        {/* Units List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {units.map((u, idx) => (
            <div 
              key={u.id}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border"
            >
              {/* Reorder Buttons (Up / Down) */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUnit(idx, 'up')}
                  className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move unit up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === units.length - 1}
                  onClick={() => handleMoveUnit(idx, 'down')}
                  className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move unit down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              {/* Field 1: Unit Label (e.g. "Unit 3") */}
              <input
                type="text"
                value={u.unitLabel || ''}
                onChange={e => handleLabelChange(u.id, e.target.value)}
                placeholder="Unit Label (e.g. Unit 3)"
                className="w-24 sm:w-28 px-2.5 py-1.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono font-bold text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 shrink-0"
              />

              {/* Field 2: Unit Title */}
              <input
                type="text"
                value={u.title}
                onChange={e => handleTitleChange(u.id, e.target.value)}
                placeholder="Unit Title (e.g. Continuous Distribution, Central Limit Theorem...)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-medium"
              />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setDeletingUnitId(u.id)}
                className="p-1.5 text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400 rounded-lg hover:bg-paper-card dark:hover:bg-night-card transition-colors shrink-0"
                title="Delete unit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {units.length === 0 && (
            <div className="text-center py-6 text-xs text-paper-muted dark:text-night-muted">
              No units defined yet. Add your first syllabus unit below.
            </div>
          )}
        </div>

        {/* Add New Unit Form with Two Separate Inputs */}
        <form onSubmit={handleAddUnit} className="mt-4 pt-3 border-t border-paper-border dark:border-night-border space-y-2">
          <div className="text-[11px] font-bold text-paper-muted dark:text-night-muted">
            + Add New Unit (Separate Label & Title)
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Label (e.g. Unit 3)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="w-28 sm:w-32 px-3 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono font-bold text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted focus:outline-none focus:border-emerald-500 shrink-0"
            />
            <input
              type="text"
              placeholder="Unit Title (e.g. Memory Management, Virtualization)..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted focus:outline-none focus:border-emerald-500 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 btn-tactile shadow-sm shrink-0"
              style={{ backgroundColor: subject.accentColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-4 mt-2 border-t border-paper-border dark:border-night-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs font-semibold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold btn-tactile shadow-sm"
          >
            Save Unit Changes
          </button>
        </div>

        {/* Unit Delete Confirmation */}
        <ConfirmModal
          isOpen={!!deletingUnitId}
          title="Delete Subject Unit?"
          message="Are you sure you want to delete this unit? Topics in this unit will be unassigned."
          confirmText="Yes, Delete Unit"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingUnitId(null)}
        />
      </div>
    </div>
  );
};
