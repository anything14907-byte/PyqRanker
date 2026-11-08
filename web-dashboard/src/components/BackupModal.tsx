import React, { useRef, useState, useEffect } from 'react';
import { indexedDbService } from '../utils/indexedDbService';
import { 
  Download, 
  Upload, 
  X, 
  ShieldCheck, 
  Database, 
  AlertTriangle,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReloaded: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataReloaded,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ totalBytes: number; formatted: string; fileCount: number }>({
    totalBytes: 0,
    formatted: 'Calculating...',
    fileCount: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      indexedDbService.getStorageUsage().then(setStorageInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await indexedDbService.exportCompleteBackup();
      localStorage.setItem('pyq_last_backup_export_ts', String(Date.now()));
      onShowToast('Single-file backup exported successfully! 📦', 'success');
    } catch (err: any) {
      onShowToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      "Restoring this backup will replace current study data, subjects, files, and notes with the backup contents. Are you sure you want to proceed?"
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setIsImporting(false);
        return;
      }

      try {
        const result = await indexedDbService.importCompleteBackup(content);
        if (result.success) {
          onDataReloaded();
          onShowToast(result.message, 'success');
          onClose();
        } else {
          onShowToast(result.message, 'error');
        }
      } catch (err: any) {
        onShowToast(`Import failed: ${err.message}`, 'error');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-paper-ink dark:text-night-text">
                IndexedDB Storage & Backup
              </h3>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Offline browser storage for all subjects, PDFs, photos & notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Stats Box */}
        <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider">
              Storage Usage
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {storageInfo.formatted} Used
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border">
              <div className="text-paper-muted dark:text-night-muted">Stored Files</div>
              <div className="text-base font-extrabold text-paper-ink dark:text-night-text mt-0.5">
                {storageInfo.fileCount} Files
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border">
              <div className="text-paper-muted dark:text-night-muted">Storage Engine</div>
              <div className="text-base font-extrabold text-emerald-500 mt-0.5">
                IndexedDB
              </div>
            </div>
          </div>

          <p className="text-[11px] text-paper-muted dark:text-night-muted leading-relaxed">
            Data survives page refreshes and browser restarts. Use the buttons below to export a single file backup to keep on your computer or phone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-sm btn-tactile"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Backup (JSON)'}</span>
          </button>

          {/* Import Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated hover:bg-paper-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text font-bold text-xs flex items-center justify-center gap-2 transition-colors btn-tactile"
          >
            <Upload className="w-4 h-4 text-cyan-500" />
            <span>{isImporting ? 'Restoring Data...' : 'Import Backup (JSON)'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
