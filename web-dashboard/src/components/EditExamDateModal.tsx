import React, { useState, useEffect } from 'react';
import { SubjectMeta, CountdownTime } from '../types';
import { calculateCountdown, getExamUrgencyColor } from '../utils/storageService';
import { Clock, Calendar, Check, X, Timer, Sparkles } from 'lucide-react';

interface EditExamDateModalProps {
  subject: SubjectMeta;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newDate: string) => void;
}

const toLocalDatetimeString = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const EditExamDateModal: React.FC<EditExamDateModalProps> = ({
  subject,
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedDate, setSelectedDate] = useState(subject.examDate || '');
  const [entryMode, setEntryMode] = useState<'calendar' | 'relative'>('calendar');
  
  // Relative inputs
  const [daysRemaining, setDaysRemaining] = useState<number>(() => {
    if (subject.examDate) {
      const diffMs = new Date(subject.examDate).getTime() - Date.now();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
    return 7;
  });

  const [hoursRemaining, setHoursRemaining] = useState<number>(() => {
    if (subject.examDate) {
      const diffMs = new Date(subject.examDate).getTime() - Date.now();
      const remMs = diffMs % (1000 * 60 * 60 * 24);
      return Math.max(0, Math.floor(remMs / (1000 * 60 * 60)));
    }
    return 12;
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(subject.examDate || '');
    }
  }, [isOpen, subject.examDate]);

  if (!isOpen) return null;

  const previewCountdown: CountdownTime = calculateCountdown(selectedDate);
  const previewUrgency = getExamUrgencyColor(selectedDate);

  const handleRelativeChange = (newDays: number, newHours: number) => {
    const d = Math.max(0, Math.min(365, newDays));
    const h = Math.max(0, Math.min(23, newHours));
    setDaysRemaining(d);
    setHoursRemaining(h);
    const targetMs = Date.now() + (d * 24 * 3600 * 1000) + (h * 3600 * 1000);
    setSelectedDate(toLocalDatetimeString(new Date(targetMs)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedDate.trim());
    onClose();
  };

  const handleClearDate = () => {
    onSave('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up select-none">
      <div className="w-full max-w-md p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ 
              backgroundColor: `${previewUrgency.hslColor}18`, 
              color: previewUrgency.hslColor 
            }}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              {subject.examDate ? 'Edit Exam Target Countdown' : 'Set Exam Target Countdown'}
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              {subject.name}
            </p>
          </div>
        </div>

        {/* Mode Switch Pills */}
        <div className="flex items-center p-1 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border mb-4">
          <button
            type="button"
            onClick={() => setEntryMode('calendar')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'calendar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Specific Date & Time</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntryMode('relative');
              handleRelativeChange(daysRemaining, hoursRemaining);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'relative'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-xs'
                : 'text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Days & Hours Remaining</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {entryMode === 'calendar' ? (
            <div>
              <label className="block text-xs font-semibold text-paper-ink dark:text-night-text mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Target Exam Date & Starting Time</span>
                </span>
                <span className="text-[10px] text-paper-muted dark:text-night-muted font-normal">
                  {subject.examDate ? '(Leave empty to clear)' : '(Optional)'}
                </span>
              </label>
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 text-sm font-medium font-mono"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-paper-ink dark:text-night-text flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Type Days & Hours Left Until Exam</span>
                </span>
                <span className="text-[10px] text-paper-muted font-mono">
                  Calculates target timestamp
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-paper-muted">Days (0–365)</span>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={daysRemaining}
                    onChange={(e) => handleRelativeChange(parseInt(e.target.value, 10) || 0, hoursRemaining)}
                    className="w-full text-center px-3 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-base font-black font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-paper-muted">Hours (0–23)</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hoursRemaining}
                    onChange={(e) => handleRelativeChange(daysRemaining, parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center px-3 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-base font-black font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Box with Urgency Shift */}
          <div 
            className="p-3.5 rounded-xl border flex items-center justify-between transition-colors duration-500"
            style={{ 
              backgroundColor: `${previewUrgency.hslColor}10`,
              borderColor: `${previewUrgency.hslColor}35`
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted block mb-0.5">
                Countdown Preview:
              </span>
              <span 
                className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                style={{ 
                  color: previewUrgency.hslColor,
                  backgroundColor: `${previewUrgency.hslColor}18`
                }}
              >
                {previewUrgency.statusLabel}
              </span>
            </div>

            <div className="text-right">
              <div 
                className="text-base sm:text-lg font-extrabold countdown-digit"
                style={{ color: previewUrgency.hslColor }}
              >
                {previewUrgency.hasDate ? previewUrgency.formattedCountdown : 'No countdown'}
              </div>
              <div className="text-[10px] text-paper-muted dark:text-night-muted mt-0.5 font-mono">
                {previewUrgency.hasDate ? previewUrgency.formattedExamDate : 'Set date above'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {subject.examDate && (
              <button
                type="button"
                onClick={handleClearDate}
                className="py-2.5 px-3 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/10 btn-tactile transition-colors"
                title="Remove exam date"
              >
                Clear Date
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs font-semibold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm btn-tactile"
              style={{ backgroundColor: previewUrgency.hasDate ? previewUrgency.hslColor : '#3F7D5F' }}
            >
              <Check className="w-4 h-4" />
              <span>Save Date</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
