import React from 'react';
import { SubjectFile } from '../types';
import { 
  X, 
  Download, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  Circle, 
  FileText 
} from 'lucide-react';

interface PdfViewerModalProps {
  file: SubjectFile | null;
  onClose: () => void;
  onToggleImportant?: (id: string) => void;
  onToggleDone?: (id: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  file,
  onClose,
  onToggleImportant,
  onToggleDone
}) => {
  if (!file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name || 'document.pdf';
    link.click();
  };

  const handleOpenNewTab = () => {
    // Open in separate browser window/tab
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${file.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 animate-fade-in">
      
      {/* Header Bar */}
      <div className="h-16 px-4 sm:px-6 bg-[#0F172A]/95 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        
        {/* Left: Title & Meta */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="overflow-hidden">
            <div className="truncate text-sm sm:text-base font-bold text-white max-w-[200px] sm:max-w-md">
              {file.name}
            </div>
            <div className="text-[11px] text-white/50 flex items-center gap-2">
              {file.year && <span className="text-emerald-400 font-mono font-bold">{file.year}</span>}
              {file.examType && <span>• {file.examType}</span>}
              {file.date && <span>• {file.date}</span>}
              <span>• {(file.size / 1024).toFixed(0)} KB</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          {/* Important */}
          {onToggleImportant && (
            <button
              onClick={() => onToggleImportant(file.id)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isImportant 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={file.isImportant ? 'Unmark Important' : 'Mark as Important'}
            >
              <Star className={`w-4 h-4 ${file.isImportant ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Done */}
          {onToggleDone && (
            <button
              onClick={() => onToggleDone(file.id)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isDone 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={file.isDone ? 'Mark as Not Done' : 'Mark as Done'}
            >
              {file.isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            </button>
          )}

          {/* Open in new tab */}
          <button
            onClick={handleOpenNewTab}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors hidden sm:block"
            title="Open full page in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 border border-white/20 transition-colors ml-2"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main PDF Embed Container */}
      <div className="flex-1 w-full h-full p-2 sm:p-4 bg-[#0F172A] flex items-center justify-center">
        <iframe
          src={file.dataUrl}
          title={file.name}
          className="w-full h-full rounded-xl bg-white border border-white/10 shadow-2xl"
        />
      </div>

    </div>
  );
};
