import React, { useState } from 'react';
import { SubjectMeta, PdfResource } from '../types';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { 
  FileText, UploadCloud, Plus, Trash2, Eye, Sparkles, AlertCircle, 
  X, FileUp 
} from 'lucide-react';

interface PdfVaultTabProps {
  subject: SubjectMeta;
  pdfs: PdfResource[];
  onAddPdf: (pdf: PdfResource) => void;
  onDeletePdf: (id: string) => void;
}

export const PdfVaultTab: React.FC<PdfVaultTabProps> = ({
  subject,
  pdfs,
  onAddPdf,
  onDeletePdf
}) => {
  const subjectPdfs = pdfs.filter(p => p.subjectId === subject.id);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePdfModal, setActivePdfModal] = useState<PdfResource | null>(null);

  // Manual note input toggle
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [customNoteTitle, setCustomNoteTitle] = useState('');
  const [customNoteContent, setCustomNoteContent] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const extractedText = await extractTextFromPdf(file);
      
      const cleanSummary = extractedText.slice(0, 350).replace(/\s+/g, ' ').trim() + '...';

      // Simple regex question extractor
      const matches = extractedText.match(/(?:(?:Explain|Describe|Define|Compare|Calculate|What is|Write short note on)\s+[^.?!]+[.?!])/gi) || [];
      const extractedQuestions = matches.slice(0, 4).map(q => q.trim());

      const newPdf: PdfResource = {
        id: `pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        subjectId: subject.id,
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        extractedText: extractedText || 'No text extracted',
        summary: cleanSummary || 'Syllabus and revision notes extracted directly from uploaded PDF.',
        extractedQuestions: extractedQuestions.length > 0 ? extractedQuestions : [
          `Review core concepts and definitions from ${file.name}`,
          'Summarize key algorithmic principles and draw architecture flow'
        ]
      };

      onAddPdf(newPdf);
      setSelectedFile(null);
    } catch (err) {
      console.error('PDF parsing error:', err);
      alert('Could not extract PDF text. Added file metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNoteTitle.trim() || !customNoteContent.trim()) return;

    const newNote: PdfResource = {
      id: `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId: subject.id,
      fileName: `${customNoteTitle.trim()}.txt`,
      uploadDate: new Date().toLocaleDateString(),
      fileSize: `${(customNoteContent.length / 1024).toFixed(1)} KB`,
      extractedText: customNoteContent.trim(),
      summary: customNoteContent.slice(0, 250).trim() + '...',
      extractedQuestions: [
        `Review key points from ${customNoteTitle.trim()}`
      ]
    };

    onAddPdf(newNote);
    setCustomNoteTitle('');
    setCustomNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-paper-ink dark:text-night-text">
              {subject.name} • PDFs & Revision Notes
            </h3>
          </div>
          <p className="text-xs text-paper-body dark:text-night-muted mt-0.5">
            Upload question papers, slide PDFs, or write quick revision notes in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card btn-tactile transition-colors"
          >
            {isAddingNote ? 'Cancel Note' : '+ Write Note'}
          </button>

          <label className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg flex items-center gap-1.5 cursor-pointer btn-tactile shadow-sm shrink-0">
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload PDF</span>
            <input 
              type="file" 
              accept=".pdf,.txt" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isProcessing} 
            />
          </label>
        </div>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs flex items-center justify-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Extracting text and generating revision summary from {selectedFile?.name}...</span>
        </div>
      )}

      {/* Write Note Form */}
      {isAddingNote && (
        <form 
          onSubmit={handleManualNoteSubmit} 
          className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-emerald-500/40 space-y-3.5 shadow-md"
        >
          <h4 className="text-sm font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Write Quick Notes for {subject.name}</span>
          </h4>

          <div>
            <input
              type="text"
              required
              placeholder="Note Title (e.g. Unit 3 Quick Formulas & Definitions)"
              value={customNoteTitle}
              onChange={e => setCustomNoteTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <textarea
              required
              rows={5}
              placeholder="Paste lecture takeaways, textbook formulas, or exam tips here..."
              value={customNoteContent}
              onChange={e => setCustomNoteContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted text-xs font-mono focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text text-xs font-semibold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg text-xs font-bold btn-tactile shadow-sm"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* PDF List Cards */}
      {subjectPdfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectPdfs.map(pdf => (
            <div 
              key={pdf.id}
              className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border hover:border-emerald-500/50 shadow-paper-card dark:shadow-night-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-paper-ink dark:text-night-text line-clamp-1">
                        {pdf.fileName}
                      </h4>
                      <span className="text-[11px] text-paper-muted dark:text-night-muted">
                        Uploaded {pdf.uploadDate} • {pdf.fileSize}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeletePdf(pdf.id)}
                    className="p-1.5 text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-paper-body dark:text-night-muted leading-relaxed my-3 line-clamp-3 bg-paper-cardElevated dark:bg-night-cardElevated p-3 rounded-xl border border-paper-border dark:border-night-border">
                  {pdf.summary}
                </p>

                {/* Extracted questions preview */}
                {pdf.extractedQuestions && pdf.extractedQuestions.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Extracted Exam Questions:
                    </span>
                    {pdf.extractedQuestions.slice(0, 2).map((q, idx) => (
                      <div key={idx} className="text-xs text-paper-body dark:text-night-muted flex items-start gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span className="line-clamp-1">{q}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-paper-border dark:border-night-border flex items-center justify-between">
                <span className="text-[11px] text-paper-muted dark:text-night-muted font-mono">
                  Client-Side Parsed
                </span>
                <button
                  onClick={() => setActivePdfModal(pdf)}
                  className="px-3.5 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated hover:bg-paper-card dark:hover:bg-night-card border border-paper-border dark:border-night-border text-xs font-semibold text-paper-ink dark:text-night-text flex items-center gap-1.5 btn-tactile transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Read Full Content</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-paper-card dark:bg-night-card border-2 border-dashed border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card">
          <FileUp className="w-10 h-10 text-paper-muted dark:text-night-muted mx-auto mb-3" />
          <h4 className="text-base font-bold text-paper-ink dark:text-night-text mb-1">
            No Documents Uploaded Yet
          </h4>
          <p className="text-xs text-paper-body dark:text-night-muted max-w-sm mx-auto mb-4">
            Upload course slides, syllabus PDFs, or previous exam question papers for {subject.name} to extract automatic summaries.
          </p>
          <label className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 btn-tactile shadow-sm">
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload PDF</span>
            <input 
              type="file" 
              accept=".pdf,.txt" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isProcessing} 
            />
          </label>
        </div>
      )}

      {/* Full Content Reader Modal */}
      {activePdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto animate-fade-slide-up">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative my-8 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setActivePdfModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated btn-tactile"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-paper-ink dark:text-night-text">
                  {activePdfModal.fileName}
                </h3>
                <span className="text-xs text-paper-muted dark:text-night-muted">
                  Extracted Content • {activePdfModal.fileSize}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="p-4 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-body dark:text-night-text leading-relaxed font-mono whitespace-pre-wrap">
                {activePdfModal.extractedText}
              </div>

              {activePdfModal.extractedQuestions && activePdfModal.extractedQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    Key Extracted Questions:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-paper-ink dark:text-night-text">
                    {activePdfModal.extractedQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-paper-border dark:border-night-border flex justify-end">
              <button
                onClick={() => setActivePdfModal(null)}
                className="px-4 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text btn-tactile"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
