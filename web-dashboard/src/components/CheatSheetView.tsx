import React from 'react';
import { 
  Printer, 
  Flame, 
  Sparkles, 
  BookOpen, 
  Tag, 
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { SubjectMeta, PYQQuestion, SubjectId } from '../types';

interface CheatSheetViewProps {
  subjects: SubjectMeta[];
  activeSubjectId: SubjectId;
  onSelectSubject: (id: SubjectId) => void;
  questions: PYQQuestion[];
}

export const CheatSheetView: React.FC<CheatSheetViewProps> = ({
  subjects,
  activeSubjectId,
  onSelectSubject,
  questions
}) => {
  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];
  
  // Filter for high probability / repeated >= 3 times
  const cheatQuestions = questions
    .filter(q => q.subjectId === activeSubjectId && (q.repeatCount >= 3 || q.isHighProbability))
    .sort((a, b) => a.unit - b.unit || b.repeatCount - a.repeatCount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Control Toolbar (Hidden in Print) */}
      <div className="print:hidden p-4 sm:p-5 rounded-2xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            Night-Before Exam Cheat Sheet
          </h2>
          <p className="text-xs text-paper-muted dark:text-night-muted">
            {cheatQuestions.length} Guaranteed Repeat Questions for {activeSubject.name} with ideal exam answers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Subject Switcher */}
          <select
            value={activeSubjectId}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-input dark:bg-night-input text-xs font-bold text-paper-body dark:text-night-text outline-none focus:outline-none"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* 1-Click Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all btn-tactile"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Body */}
      <div className="p-6 sm:p-8 rounded-3xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-paper-body dark:text-night-text space-y-6 print:p-0 print:border-none print:shadow-none shadow-sm">
        
        {/* Document Header */}
        <div className="border-b-2 border-emerald-500 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                High-Yield University Revision
              </span>
              <h1 className="text-2xl font-black text-paper-ink dark:text-night-text uppercase mt-1">
                {activeSubject.name} ({activeSubject.code})
              </h1>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Compiled from 2021–2025 past papers • Key scoring bullet points & diagram tips
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-amber-500">
                {cheatQuestions.length} Must-Study PYQs
              </span>
              <div className="text-[10px] text-paper-muted dark:text-night-muted mt-0.5">Study OS</div>
            </div>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-5">
          {cheatQuestions.map((q, idx) => (
            <div 
              key={q.id}
              className="p-4 rounded-xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated space-y-3 break-inside-avoid"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-bold text-sm text-paper-ink dark:text-night-text leading-snug">
                  <span className="text-emerald-600 dark:text-emerald-400 mr-1.5">#{idx + 1}.</span>
                  {q.question}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-paper-input dark:bg-night-input text-paper-body dark:text-night-text">
                    {q.marks}M • U{q.unit}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Asked {q.repeatCount}x
                  </span>
                </div>
              </div>

              {/* 3-4 Bullets */}
              <div className="pl-3 border-l-2 border-emerald-500 space-y-1 text-xs text-paper-body dark:text-night-text">
                {q.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Diagram / Formula Tip */}
              {q.diagramFormulaTip && (
                <div className="text-[11px] bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-lg text-cyan-800 dark:text-cyan-300">
                  <strong>Exam Tip:</strong> {q.diagramFormulaTip}
                </div>
              )}

              {/* Keywords */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] font-bold text-paper-muted dark:text-night-muted mr-1">
                  Rubric Keys:
                </span>
                {q.expectedKeywords.map(k => (
                  <span 
                    key={k}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/25"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sheet Footer */}
        <div className="pt-4 border-t border-paper-border dark:border-night-border text-center text-xs text-paper-muted dark:text-night-muted">
          Study Strategy: Examiners grade by keywords. Hit all rubric keywords highlighted above to secure full marks.
        </div>

      </div>

    </div>
  );
};
