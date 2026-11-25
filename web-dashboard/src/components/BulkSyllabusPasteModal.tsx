import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  X, 
  Sparkles, 
  Trash2, 
  Plus, 
  Scissors, 
  Link2, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  parseSyllabusText, 
  mergeTopicWithAbove, 
  splitTopicAtDelimiter, 
  cleanPrefix 
} from '../utils/syllabusParser';

interface BulkSyllabusPasteModalProps {
  isOpen: boolean;
  unitTitle: string;
  unitLabel: string;
  onClose: () => void;
  onAddTopics: (topics: string[]) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BulkSyllabusPasteModal: React.FC<BulkSyllabusPasteModalProps> = ({
  isOpen,
  unitTitle,
  unitLabel,
  onClose,
  onAddTopics,
  onShowToast
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedTopics, setParsedTopics] = useState<string[]>([]);

  // Automatically parse whenever rawText changes
  useEffect(() => {
    if (rawText.trim()) {
      const results = parseSyllabusText(rawText);
      setParsedTopics(results);
    } else {
      setParsedTopics([]);
    }
  }, [rawText]);

  if (!isOpen) return null;

  const handleInsertSample = () => {
    const sample = `Introduction to OS, Types of schedulers: long-term scheduler, short-term scheduler, medium-term scheduler, Process States, Deadlock Prevention, Memory Management (Paging, Segmentation, Virtual Memory)`;
    setRawText(sample);
  };

  const handleClear = () => {
    setRawText('');
    setParsedTopics([]);
  };

  const handleTopicChange = (index: number, value: string) => {
    setParsedTopics(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveTopic = (index: number) => {
    setParsedTopics(prev => prev.filter((_, i) => i !== index));
  };

  const handleMergeWithAbove = (index: number) => {
    setParsedTopics(prev => mergeTopicWithAbove(prev, index));
  };

  const handleSplitTopic = (index: number) => {
    setParsedTopics(prev => splitTopicAtDelimiter(prev, index));
  };

  const handleAddBlankTopic = () => {
    setParsedTopics(prev => [...prev, 'New Topic']);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanList = parsedTopics
      .map(t => cleanPrefix(t))
      .filter(t => t.length > 0);

    if (cleanList.length === 0) {
      if (onShowToast) onShowToast('Please paste syllabus text or add at least one topic.', 'info');
      return;
    }

    onAddTopics(cleanList);
    if (onShowToast) {
      onShowToast(`Added ${cleanList.length} syllabus topics to ${unitLabel}! 🚀`, 'success');
    }
    setRawText('');
    setParsedTopics([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75">
      <div 
        className="w-full max-w-2xl rounded-3xl p-5 sm:p-7 relative border shadow-2xl flex flex-col max-h-[90vh] bg-paper-card dark:bg-night-card border-paper-border dark:border-night-border text-paper-ink dark:text-night-text"
        style={{
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-paper-border dark:border-night-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-serif font-black tracking-tight text-paper-ink dark:text-night-text">
                  Smart Bulk Syllabus Paste
                </h3>
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {unitLabel}: {unitTitle || 'Chapter Syllabus'}
                </span>
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted mt-0.5">
                Paste an entire unit paragraph. Colon sub-lists and brackets are automatically grouped.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Textarea Toolbar */}
          <div className="flex items-center justify-between text-xs">
            <label className="font-mono font-bold uppercase tracking-wider text-[11px] text-paper-muted dark:text-night-muted flex items-center gap-1.5">
              <span>Raw Syllabus Paragraph:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInsertSample}
                className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Try Example</span>
              </button>
              {rawText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] font-mono text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Large Paste Textarea */}
          <textarea
            rows={4}
            autoFocus
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your entire unit syllabus here (e.g. Introduction to OS, Types of schedulers: long-term scheduler, short-term scheduler, medium-term scheduler, Process States, Deadlock Prevention)..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none shadow-xs"
          />

          {/* Live Instant Preview List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Instant Preview ({parsedTopics.length} Topics Detected)</span>
              </span>
              {parsedTopics.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddBlankTopic}
                  className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Line</span>
                </button>
              )}
            </div>

            {parsedTopics.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-paper-border dark:border-night-border text-center space-y-1.5 bg-paper-cardElevated/50 dark:bg-night-cardElevated/50">
                <AlertCircle className="w-6 h-6 text-amber-500/60 mx-auto" />
                <div className="text-xs font-serif font-bold text-paper-ink dark:text-night-text">
                  Waiting for syllabus paste...
                </div>
                <p className="text-[11px] text-paper-muted dark:text-night-muted max-w-md mx-auto">
                  Copy your syllabus text from a college PDF or web portal and paste it into the box above to see clean topic breakdown instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                {parsedTopics.map((topic, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl border flex items-center gap-2 bg-paper-cardElevated dark:bg-night-cardElevated border-paper-border dark:border-night-border hover:border-amber-500/50 transition-all group"
                  >
                    {/* Index badge */}
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Editable Topic Title Input */}
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => handleTopicChange(idx, e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-lg text-xs font-serif bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-amber-500"
                    />

                    {/* Quick interactive controls: Merge with Above / Split Here / Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMergeWithAbove(idx)}
                          className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-500 hover:text-stone-950 flex items-center gap-1 transition-colors"
                          title="Merge with topic above"
                        >
                          <Link2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Merge Above</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSplitTopic(idx)}
                        className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-500 hover:text-stone-950 flex items-center gap-1 transition-colors"
                        title="Split this topic at comma or colon"
                      >
                        <Scissors className="w-3 h-3" />
                        <span className="hidden sm:inline">Split</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Remove topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-paper-border dark:border-night-border flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-paper-muted dark:text-night-muted font-mono">
            {parsedTopics.length > 0 
              ? `${parsedTopics.length} topic${parsedTopics.length === 1 ? '' : 's'} ready to add` 
              : 'Paste text to preview'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-paper-border dark:border-night-border text-paper-muted hover:text-paper-ink dark:hover:text-night-text btn-tactile"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedTopics.length === 0}
              onClick={() => handleSubmit()}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                parsedTopics.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 cursor-pointer font-extrabold'
                  : 'bg-stone-300 dark:bg-stone-800 text-stone-400 cursor-not-allowed opacity-60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Add All {parsedTopics.length} Topics to Chapter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
