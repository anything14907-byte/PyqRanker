import React, { useState, useRef } from 'react';
import { SubjectFile, FileCategory } from '../types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Camera, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface UploadFilesModalProps {
  isOpen: boolean;
  subjectId: string;
  defaultCategory: FileCategory;
  onClose: () => void;
  onUploadComplete: (files: SubjectFile[]) => void;
}

interface StagedFile {
  file: File;
  name: string;
  category: FileCategory;
  year?: string;
  examType?: string;
  date?: string;
  dataUrl?: string;
  size: number;
}

export const UploadFilesModal: React.FC<UploadFilesModalProps> = ({
  isOpen,
  subjectId,
  defaultCategory,
  onClose,
  onUploadComplete
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<FileCategory>(defaultCategory);
  const [defaultYear, setDefaultYear] = useState('2024');
  const [defaultExamType, setDefaultExamType] = useState('End Sem');
  const [defaultDate, setDefaultDate] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Automatically categorize images to 'images' tab if chosen, or follow selected tab
      let cat = category;
      if (f.type.startsWith('image/') && category === 'pyq') {
        cat = 'pyq'; // user can have image PYQs
      }

      newStaged.push({
        file: f,
        name: f.name,
        category: cat,
        year: cat === 'pyq' ? defaultYear : undefined,
        examType: cat === 'pyq' ? defaultExamType : undefined,
        date: cat === 'notes' ? defaultDate : undefined,
        size: f.size
      });
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemoveStaged = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const convertedFiles: SubjectFile[] = [];

      for (const staged of stagedFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(staged.file);
        });

        const isPdf = staged.file.type === 'application/pdf' || staged.name.toLowerCase().endsWith('.pdf');
        const fileType = isPdf ? 'pdf' : 'image';

        convertedFiles.push({
          id: `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId,
          name: staged.name,
          category: staged.category,
          fileType,
          dataUrl,
          size: staged.size,
          year: staged.year || (staged.category === 'pyq' ? defaultYear : undefined),
          examType: staged.examType || (staged.category === 'pyq' ? defaultExamType : undefined),
          date: staged.date || (staged.category === 'notes' ? defaultDate : undefined),
          isImportant: false,
          isDone: false,
          createdAt: Date.now()
        });
      }

      onUploadComplete(convertedFiles);
      setStagedFiles([]);
      onClose();
    } catch (err) {
      console.error('Error reading files:', err);
      alert('Failed to read some files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-2xl p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
              Upload Files
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Target Selector */}
        <div>
          <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-2">
            Upload Section
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pyq', label: 'PYQ Papers' },
              { id: 'notes', label: 'Teacher Notes' },
              { id: 'images', label: 'Images Gallery' }
            ].map(tab => {
              const isSelected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id as FileCategory)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category-specific defaults */}
        {category === 'pyq' && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border">
            <div>
              <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1">
                Exam Year
              </label>
              <input
                type="text"
                value={defaultYear}
                onChange={(e) => setDefaultYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1">
                Exam Type
              </label>
              <input
                type="text"
                value={defaultExamType}
                onChange={(e) => setDefaultExamType(e.target.value)}
                placeholder="e.g. End Sem / Mid Sem"
                className="w-full px-3 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {category === 'notes' && (
          <div className="p-3 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border">
            <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1">
              Lecture / Note Date (Optional)
            </label>
            <input
              type="text"
              value={defaultDate}
              onChange={(e) => setDefaultDate(e.target.value)}
              placeholder="e.g. Oct 24, 2026 or Unit 3"
              className="w-full px-3 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-paper-border dark:border-night-border hover:border-emerald-500/50 hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf,image/*"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <div className="text-sm font-bold text-paper-ink dark:text-night-text">
              Drag & Drop your PDFs or photos here
            </div>
            <div className="text-xs text-paper-muted dark:text-night-muted mt-1">
              Supports multiple files at once • PDFs, PNGs, JPEGs, Whiteboard captures
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg text-xs font-bold shadow-sm">
              Browse Files
            </span>
            <span className="text-xs text-paper-muted dark:text-night-muted">or take photo on phone</span>
          </div>
        </div>

        {/* Staged Files Preview List */}
        {stagedFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider flex items-center justify-between">
              <span>{stagedFiles.length} File{stagedFiles.length > 1 ? 's' : ''} Ready to Add</span>
              <button
                type="button"
                onClick={() => setStagedFiles([])}
                className="text-[11px] text-red-500 hover:underline"
              >
                Clear all
              </button>
            </div>

            {stagedFiles.map((staged, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {staged.file.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="truncate font-medium text-paper-ink dark:text-night-text">
                    {staged.name}
                  </span>
                  <span className="text-paper-muted dark:text-night-muted text-[10px] shrink-0">
                    ({(staged.size / 1024).toFixed(0)} KB)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStaged(idx)}
                  className="p-1 rounded text-paper-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-border dark:border-night-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text border border-paper-border dark:border-night-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={stagedFiles.length === 0 || isProcessing}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
              stagedFiles.length === 0 || isProcessing
                ? 'opacity-50 cursor-not-allowed bg-emerald-600/50 text-white'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400'
            }`}
          >
            {isProcessing ? (
              <span>Saving to IndexedDB...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Upload {stagedFiles.length > 0 ? `(${stagedFiles.length})` : ''}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
