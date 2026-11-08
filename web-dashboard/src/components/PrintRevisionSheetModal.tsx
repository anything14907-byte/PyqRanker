import React, { useState } from 'react';
import { SubjectMeta, SubjectUnit, PYQQuestion, VideoResource, SubjectFile, PdfResource } from '../types';
import { getExamUrgencyColor, formatUnitDisplayName } from '../utils/storageService';
import { 
  Printer, 
  Copy, 
  X, 
  BookOpen, 
  FileText, 
  Video, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';

interface PrintRevisionSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectMeta;
  initialUnitId?: string;
  questions: PYQQuestion[];
  videos: VideoResource[];
  dbFiles: SubjectFile[];
  legacyPdfs: PdfResource[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PrintRevisionSheetModal: React.FC<PrintRevisionSheetModalProps> = ({
  isOpen,
  onClose,
  subject,
  initialUnitId = 'all',
  questions,
  videos,
  dbFiles,
  legacyPdfs,
  onShowToast
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId || 'all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const urgency = getExamUrgencyColor(subject.examDate);

  // Filter units to include
  const displayUnits = selectedUnitId === 'all' 
    ? subject.units 
    : subject.units.filter(u => u.id === selectedUnitId);

  // Helper to get items for a unit
  const getUnitContent = (unit: SubjectUnit) => {
    const unitQuestions = questions.filter(q => q.unitId === unit.id || q.unit === unit.unit);
    const unitVideos = videos.filter(v => v.unitId === unit.id || v.unit === unit.unit);
    const unitFiles = dbFiles.filter(f => f.unitId === unit.id);
    const unitPdfs = legacyPdfs.filter(p => p.unitId === unit.id || p.unit === unit.unit);
    return { unitQuestions, unitVideos, unitFiles, unitPdfs };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAll = () => {
    let md = `# QUICK REVISION SHEET: ${subject.name} (${subject.code || 'EXAM PREP'})\n`;
    if (urgency.hasDate) {
      md += `Target Exam: ${urgency.formattedExamDate} (${urgency.formattedCountdown} remaining)\n\n`;
    }

    displayUnits.forEach(u => {
      const { unitQuestions, unitVideos, unitFiles, unitPdfs } = getUnitContent(u);
      md += `\n---\n## ${formatUnitDisplayName(u)}\n\n`;

      if (unitFiles.length > 0 || unitPdfs.length > 0) {
        md += `### 📝 Key Notes & Formulas\n`;
        unitFiles.forEach(f => {
          md += `#### ${f.name}\n${f.description || ''}\n\n`;
        });
        unitPdfs.forEach(p => {
          md += `#### ${p.fileName}\n${p.summary || ''}\n\n`;
        });
      }

      if (unitVideos.some(v => v.notes?.trim())) {
        md += `### 🎬 Video Lecture Takeaways\n`;
        unitVideos.forEach(v => {
          if (v.notes?.trim()) {
            md += `- **${v.title}**:\n${v.notes}\n`;
          }
        });
        md += `\n`;
      }

      if (unitQuestions.length > 0) {
        md += `### 🔥 Must-Know Past Exam Questions\n`;
        unitQuestions.forEach((q, idx) => {
          md += `${idx + 1}. **[${q.marks}M]** ${q.question} *(Repeated ${q.repeatCount || 1}x)*\n`;
          if (q.bullets && q.bullets.length > 0) {
            md += `   - Key Points:\n`;
            q.bullets.forEach(b => {
              md += `     • ${b}\n`;
            });
          }
          if (q.diagramFormulaTip) {
            md += `   - Tip: ${q.diagramFormulaTip}\n`;
          }
          md += `\n`;
        });
      }
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      onShowToast('Revision sheet copied to clipboard as Markdown! 📋', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 animate-fade-in print:p-0 print:bg-white print:static">
      <div className="w-full max-w-5xl max-h-[92vh] bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Header Toolbar (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-paper-border dark:border-night-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-paper-cardElevated dark:bg-night-cardElevated print:hidden">
          
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: `${subject.accentColor}20`, color: subject.accentColor }}
            >
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border">
                  Quick Revision Sheet
                </span>
                <span className="text-xs text-paper-muted dark:text-night-muted">
                  Distraction-Free Summary
                </span>
              </div>
              <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
                {subject.name}
              </h3>
            </div>
          </div>

          {/* Unit Scope Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedUnitId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile shrink-0 ${
                selectedUnitId === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-cardElevated'
              }`}
            >
              All Units ({subject.units.length})
            </button>
            {subject.units.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile whitespace-nowrap shrink-0 ${
                  selectedUnitId === u.id
                    ? 'text-white shadow-sm'
                    : 'bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-cardElevated'
                }`}
                style={{
                  backgroundColor: selectedUnitId === u.id ? subject.accentColor : undefined
                }}
              >
                {formatUnitDisplayName(u)}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyAll}
              className="px-3.5 py-2 rounded-xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card hover:bg-paper-cardElevated text-paper-ink dark:text-night-text text-xs font-bold btn-tactile flex items-center gap-1.5"
              title="Copy formatted revision sheet to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold btn-tactile shadow-sm flex items-center gap-1.5"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-paper-card dark:bg-night-card text-paper-ink dark:text-night-text print:p-0 print:overflow-visible print:bg-white print:text-black">
          
          {/* Printable Header */}
          <div className="border-b-2 border-emerald-600 pb-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 font-extrabold block">
                  Comprehensive Exam Revision Sheet
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {subject.name}
                </h1>
              </div>

              {subject.code && (
                <div className="text-right">
                  <span className="px-3 py-1 rounded-lg border border-paper-border dark:border-night-border font-mono font-bold text-sm bg-paper-cardElevated dark:bg-night-cardElevated print:border-black">
                    {subject.code}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-paper-muted dark:text-night-muted print:text-neutral-700 flex-wrap pt-1">
              {urgency.hasDate && (
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exam Date: {urgency.formattedExamDate}</span>
                </span>
              )}
              {urgency.hasDate && (
                <span className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Countdown: {urgency.formattedCountdown}</span>
                </span>
              )}
              <span>•</span>
              <span>Generated: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>Scope: {selectedUnitId === 'all' ? `All Units (${subject.units.length})` : formatUnitDisplayName(subject.units.find(u => u.id === selectedUnitId) || subject.units[0])}</span>
            </div>
          </div>

          {/* Units Content */}
          {displayUnits.map((unit, uIdx) => {
            const { unitQuestions, unitVideos, unitFiles, unitPdfs } = getUnitContent(unit);

            return (
              <div key={unit.id} className="space-y-6 break-inside-avoid border-b border-paper-border dark:border-night-border pb-8 last:border-b-0 print:border-neutral-300">
                
                {/* Unit Header */}
                <div className="flex items-center gap-2.5">
                  <span 
                    className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
                    style={{ backgroundColor: subject.accentColor }}
                  >
                    {unit.unitLabel || `Unit ${unit.unit || uIdx + 1}`}
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">
                    {formatUnitDisplayName(unit)}
                  </h2>
                </div>

                {/* 1. Core Notes & Formula Summaries */}
                {(unitFiles.length > 0 || unitPdfs.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 print:text-black">
                      <FileText className="w-4 h-4" />
                      <span>1. Core Study Notes & Key Formulas</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {unitFiles.map(file => (
                        <div key={file.id} className="p-4 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-1.5 print:border-neutral-300 print:bg-white">
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            <span>📄 {file.name}</span>
                            {file.description && (
                              <span className="text-xs text-paper-muted dark:text-night-muted font-normal italic">
                                — {file.description}
                              </span>
                            )}
                          </h4>
                          {file.content && (
                            <div className="text-xs font-mono whitespace-pre-wrap text-paper-body dark:text-night-text print:text-black bg-paper-card dark:bg-night-card p-3 rounded-lg border border-paper-border dark:border-night-border print:bg-neutral-50 print:border-neutral-300">
                              {file.content}
                            </div>
                          )}
                        </div>
                      ))}

                      {unitPdfs.map(pdf => (
                        <div key={pdf.id} className="p-4 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-1.5 print:border-neutral-300 print:bg-white">
                          <h4 className="text-sm font-bold">📄 {pdf.fileName}</h4>
                          {pdf.summary && (
                            <p className="text-xs leading-relaxed text-paper-body dark:text-night-muted print:text-black">
                              {pdf.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Video Lecture Takeaways */}
                {unitVideos.some(v => v.notes?.trim()) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 print:text-black">
                      <Video className="w-4 h-4" />
                      <span>2. Video Lecture Notes & Timestamps</span>
                    </h3>

                    <div className="space-y-2">
                      {unitVideos.filter(v => v.notes?.trim()).map(vid => (
                        <div key={vid.id} className="p-3.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border print:border-neutral-300 print:bg-white">
                          <div className="text-xs font-bold mb-1">🎬 {vid.title}</div>
                          <div className="text-xs font-mono text-paper-body dark:text-night-muted whitespace-pre-wrap bg-paper-card dark:bg-night-card p-2.5 rounded-lg border border-paper-border dark:border-night-border print:bg-neutral-50 print:border-neutral-300">
                            {vid.notes}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Must-Know Past Exam Questions (PYQs) */}
                {unitQuestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 print:text-black">
                      <Flame className="w-4 h-4" />
                      <span>3. High-Yield Past Exam Questions & Model Answers ({unitQuestions.length})</span>
                    </h3>

                    <div className="space-y-3">
                      {unitQuestions.map((q, qIdx) => (
                        <div key={q.id} className="p-4 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-2 break-inside-avoid print:border-neutral-300 print:bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-xs text-paper-muted dark:text-night-muted shrink-0 mt-0.5">
                                Q{qIdx + 1}.
                              </span>
                              <div className="text-xs sm:text-sm font-bold text-paper-ink dark:text-night-text print:text-black leading-snug">
                                {q.question}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border print:border-black">
                                {q.marks} Marks
                              </span>
                              {q.repeatCount > 1 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 print:border-neutral-300">
                                  ★ Asked {q.repeatCount}x
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Model Answer Bullets */}
                          {q.bullets && q.bullets.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider">
                                Model Answer Points:
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-paper-body dark:text-night-text print:text-black pl-1">
                                {q.bullets.map((b, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">{b}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Diagram / Formula / Exam Tip */}
                          {q.diagramFormulaTip && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 print:bg-neutral-50 print:border-neutral-300 print:text-black flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span><strong>Formula & Diagram Tip:</strong> {q.diagramFormulaTip}</span>
                            </div>
                          )}

                          {/* Student Saved Answer if present */}
                          {q.lastAttemptAnswer && (
                            <div className="pt-1 text-xs">
                              <span className="font-bold text-paper-muted dark:text-night-muted text-[11px] block mb-1">
                                Saved Student Answer:
                              </span>
                              <div className="p-2.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border font-mono text-[11px] whitespace-pre-wrap">
                                {q.lastAttemptAnswer}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
};
