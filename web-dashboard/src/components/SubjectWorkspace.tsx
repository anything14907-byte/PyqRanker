import React, { useState, useEffect } from 'react';
import { 
  SubjectMeta, 
  SubjectUnit, 
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  SubjectFile,
  SyllabusTopic,
  PomodoroSession 
} from '../types';
import { 
  getExamUrgencyColor, 
  ACCENT_PALETTE, 
  extractYoutubeId, 
  formatUnitDisplayName,
  calculateUnitReadiness,
  getSubjectTotalStudiedMinutes,
  formatStudiedTime 
} from '../utils/storageService';
import { indexedDbService } from '../utils/indexedDbService';
import { EditExamDateModal } from './EditExamDateModal';
import { EditUnitsModal } from './EditUnitsModal';
import { QuestionCard } from './QuestionCard';
import { AddCustomPyqModal } from './AddCustomPyqModal';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageViewerModal } from './ImageViewerModal';
import { ConfirmModal } from './ConfirmModal';
import { PrintRevisionSheetModal } from './PrintRevisionSheetModal';
import { 
  Clock, Calendar, ArrowLeft, Trash2, Cpu, Database, Network, 
  Code, BookOpen, Layers, Plus, Video, FileText, CheckCircle2, 
  Circle, Play, ExternalLink, FileEdit, Eye, AlertCircle, Palette, 
  MoveRight, Flame, X, UploadCloud, Check, Download, Image, Edit2, Upload, Copy,
  Printer, Timer, Sparkles, Star, ChevronRight
} from 'lucide-react';

interface SubjectWorkspaceProps {
  subject: SubjectMeta;
  initialUnitId?: string;
  activeExamId?: string;
  questions: PYQQuestion[];
  tasks: StudyTask[];
  videos: VideoResource[];
  pdfs: PdfResource[];
  topics?: SyllabusTopic[];
  pomodoroLogs?: PomodoroSession[];
  onLogPomodoro?: (subjectId: string, minutes: number) => void;
  onToggleMastered: (id: string) => void;
  onSaveAnswer: (id: string, answer: string, score: number) => void;
  onAddQuestion: (q: PYQQuestion) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (text: string, unitId?: string, unitNum?: number) => void;
  onDeleteTask: (id: string) => void;
  onAddVideo: (video: VideoResource) => void;
  onUpdateVideoNotes: (videoId: string, notes: string) => void;
  onToggleVideoWatched: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onAddPdf: (pdf: PdfResource) => void;
  onDeletePdf: (id: string) => void;
  onMoveItemToUnit: (type: 'task' | 'video' | 'pdf' | 'question', itemId: string, targetUnitId: string, targetUnitNumber?: number) => void;
  onUpdateSubject: (subject: SubjectMeta) => void;
  onDeleteSubject: (id: string) => void;
  onBackToOverview: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SubjectWorkspace: React.FC<SubjectWorkspaceProps> = ({
  subject,
  initialUnitId,
  activeExamId,
  questions,
  tasks,
  videos,
  pdfs,
  topics = [],
  pomodoroLogs = [],
  onLogPomodoro,
  onToggleMastered,
  onSaveAnswer,
  onAddQuestion,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onAddVideo,
  onUpdateVideoNotes,
  onToggleVideoWatched,
  onDeleteVideo,
  onAddPdf,
  onDeletePdf,
  onMoveItemToUnit,
  onUpdateSubject,
  onDeleteSubject,
  onBackToOverview,
  onShowToast
}) => {
  // Navigation: 'all' (Grouped View) or specific unitId (e.g. 'u1', 'u2')
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId || 'all');

  useEffect(() => {
    setSelectedUnitId(initialUnitId || 'all');
  }, [initialUnitId, subject.id]);

  // Live 1-second interval ticker for live countdown clock
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // IndexedDB Files State
  const [dbFiles, setDbFiles] = useState<SubjectFile[]>([]);
  const [noteFormMode, setNoteFormMode] = useState<'write' | 'upload'>('write');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modals & Preview State
  const [isEditDateOpen, setIsEditDateOpen] = useState(false);
  const [isEditUnitsOpen, setIsEditUnitsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddPyqOpen, setIsAddPyqOpen] = useState(false);
  const [isRevisionSheetOpen, setIsRevisionSheetOpen] = useState(false);

  // File Viewers & Actions
  const [previewPdfFile, setPreviewPdfFile] = useState<SubjectFile | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<SubjectFile | null>(null);
  const [previewNoteFile, setPreviewNoteFile] = useState<SubjectFile | null>(null);
  const [renamingFile, setRenamingFile] = useState<SubjectFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [fileToDelete, setFileToDelete] = useState<SubjectFile | null>(null);
  const [legacyPdfToDelete, setLegacyPdfToDelete] = useState<string | null>(null);
  const [activePdfModal, setActivePdfModal] = useState<PdfResource | null>(null);

  // Forms state for adding resources
  const [addingResourceType, setAddingResourceType] = useState<{ unitId: string; type: 'video' | 'pdf' | 'task' } | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  // -------------------------------------------------------------
  // SIDE-BY-SIDE MEDIA & LIVE NOTES STATE
  // -------------------------------------------------------------
  const [activeMedia, setActiveMedia] = useState<{
    type: 'video' | 'pdf';
    video?: VideoResource;
    file?: SubjectFile | PdfResource;
  } | null>(null);

  // Live Unit Note Editor state
  const [activeNoteFileId, setActiveNoteFileId] = useState<string>('new');
  const [liveNoteTitle, setLiveNoteTitle] = useState<string>('');
  const [liveNoteContent, setLiveNoteContent] = useState<string>('');
  const [liveKeyTakeaways, setLiveKeyTakeaways] = useState<string[]>([]);
  const [newTakeawayInput, setNewTakeawayInput] = useState<string>('');

  // -------------------------------------------------------------
  // BUILT-IN FOCUS TIMER STATE (POMODORO TRACKER)
  // -------------------------------------------------------------
  const [focusDuration, setFocusDuration] = useState<25 | 50 | 5>(25);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (onLogPomodoro) {
        onLogPomodoro(subject.id, focusDuration);
      }
      onShowToast(`🎉 Session complete! ${focusDuration}m focus recorded for ${subject.name}!`, 'success');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft, focusDuration, subject.id, onLogPomodoro, subject.name]);

  const handleSelectFocusMode = (mins: 25 | 50 | 5) => {
    setIsTimerRunning(false);
    setFocusDuration(mins);
    setTimerSecondsLeft(mins * 60);
  };

  const handleToggleTimer = () => {
    if (timerSecondsLeft === 0) {
      setTimerSecondsLeft(focusDuration * 60);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(focusDuration * 60);
  };

  // Load files from IndexedDB
  const loadDbFiles = async () => {
    try {
      const allFiles = await indexedDbService.getFiles(subject.id, activeExamId);
      setDbFiles(allFiles);
    } catch (err) {
      console.error('Error loading files from IndexedDB:', err);
    }
  };

  useEffect(() => {
    loadDbFiles();
  }, [subject.id, activeExamId]);

  // Urgency calculations with live color shift
  const urgency = getExamUrgencyColor(subject.examDate);

  // Filter subject items
  const subjectQuestions = questions.filter(q => q.subjectId === subject.id);
  const subjectVideos = videos.filter(v => v.subjectId === subject.id);
  const subjectPdfs = pdfs.filter(p => p.subjectId === subject.id);
  const subjectTasks = tasks.filter(t => t.subjectId === subject.id);

  // Identify unassigned items
  const unitIds = new Set(subject.units.map(u => u.id));
  const unitNumbers = new Set(subject.units.map(u => u.unit));

  const isItemAssigned = (item: { unitId?: string; unit?: number }) => {
    if (item.unitId && unitIds.has(item.unitId)) return true;
    if (item.unit && unitNumbers.has(item.unit)) return true;
    return false;
  };

  const unassignedTasks = subjectTasks.filter(t => !isItemAssigned(t));
  const unassignedVideos = subjectVideos.filter(v => !isItemAssigned(v));
  const unassignedPdfs = subjectPdfs.filter(p => !isItemAssigned(p));
  const unassignedQuestions = subjectQuestions.filter(q => !isItemAssigned(q));
  const hasUnassignedItems = unassignedTasks.length > 0 || unassignedVideos.length > 0 || unassignedPdfs.length > 0 || unassignedQuestions.length > 0;

  const getSubjectIcon = (name: string) => {
    switch (name) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Network': return <Network className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  // Unit filter helpers
  const getUnitItems = (unit: SubjectUnit) => {
    const uTasks = subjectTasks.filter(t => t.unitId === unit.id || t.unit === unit.unit);
    const uVideos = subjectVideos.filter(v => v.unitId === unit.id || v.unit === unit.unit);
    const uPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === unit.unit);
    const uQuestions = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === unit.unit);
    return { uTasks, uVideos, uPdfs, uQuestions };
  };

  const handleAddVideoSubmit = (unitId: string, unitNum: number | undefined, e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;

    const ytid = extractYoutubeId(newVideoUrl.trim());
    if (!ytid) {
      onShowToast('Please provide a valid YouTube URL (e.g. youtube.com or youtu.be)', 'error');
      return;
    }

    const newVid: VideoResource = {
      id: `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId: subject.id,
      title: newVideoTitle.trim(),
      youtubeUrl: newVideoUrl.trim(),
      videoId: ytid,
      notes: '',
      isWatched: false,
      addedAt: Date.now(),
      unitId,
      unit: unitNum
    };

    onAddVideo(newVid);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setAddingResourceType(null);
    onShowToast(`Added video to unit! 🎬`, 'success');
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Add text note (saved to IndexedDB + backwards compatible)
  const handleAddNoteSubmit = async (unitId: string, unitNum: number | undefined, e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const noteId = `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const noteFile: SubjectFile = {
      id: noteId,
      examId: activeExamId,
      subjectId: subject.id,
      unitId,
      name: newNoteTitle.trim(),
      description: newNoteContent.slice(0, 150).trim(),
      content: newNoteContent.trim(),
      category: 'notes',
      fileType: 'note',
      dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(newNoteContent.trim())}`,
      size: newNoteContent.length,
      date: new Date().toLocaleDateString(),
      isImportant: false,
      isDone: false,
      createdAt: Date.now()
    };

    try {
      await indexedDbService.addFile(noteFile);
      await loadDbFiles();

      const newLegacyNote: PdfResource = {
        id: noteId,
        subjectId: subject.id,
        unitId,
        unit: unitNum,
        fileName: `${newNoteTitle.trim()}.txt`,
        uploadDate: new Date().toLocaleDateString(),
        fileSize: `${(newNoteContent.length / 1024).toFixed(1)} KB`,
        extractedText: newNoteContent.trim(),
        summary: newNoteContent.slice(0, 250).trim() + '...',
        extractedQuestions: [`Review key points from ${newNoteTitle.trim()}`]
      };
      onAddPdf(newLegacyNote);

      setNewNoteTitle('');
      setNewNoteContent('');
      setAddingResourceType(null);
      onShowToast(`Saved study note in IndexedDB! 📄`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Could not save note to IndexedDB', 'error');
    }
  };

  // Upload multiple PDFs/images to IndexedDB
  const handleUploadFilesSubmit = async (unitId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      onShowToast('Please select at least one PDF or Image file', 'info');
      return;
    }

    setIsUploading(true);
    try {
      const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
      const oversized = selectedFiles.filter(f => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        const names = oversized.map(f => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(', ');
        onShowToast(`Warning: ${names} exceeds 25 MB limit. Large files may exceed browser storage quota.`, 'error');
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        const dataUrl = await readFileAsDataUrl(f);
        const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        const isImg = f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name);
        
        let fileDisplayName = f.name;
        if (selectedFiles.length === 1 && uploadTitle.trim()) {
          fileDisplayName = uploadTitle.trim();
        } else if (selectedFiles.length > 1 && uploadTitle.trim()) {
          fileDisplayName = `${uploadTitle.trim()} (${i + 1}) - ${f.name}`;
        }

        const newFile: SubjectFile = {
          id: `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          examId: activeExamId,
          subjectId: subject.id,
          unitId,
          name: fileDisplayName,
          description: uploadDesc.trim() || undefined,
          category: isPdf ? 'notes' : (isImg ? 'images' : 'notes'),
          fileType: isPdf ? 'pdf' : (isImg ? 'image' : 'note'),
          dataUrl,
          size: f.size,
          date: new Date().toLocaleDateString(),
          isImportant: false,
          isDone: false,
          createdAt: Date.now()
        };

        await indexedDbService.addFile(newFile);
      }

      await loadDbFiles();
      setSelectedFiles([]);
      setUploadTitle('');
      setUploadDesc('');
      setAddingResourceType(null);
      onShowToast(`Uploaded ${selectedFiles.length} file(s) to IndexedDB! 📁`, 'success');
    } catch (err) {
      console.error('File upload error:', err);
      onShowToast('Failed to upload files. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = (file: SubjectFile) => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name || 'document';
    link.click();
  };

  const handleRenameFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !renameValue.trim()) return;
    try {
      await indexedDbService.renameFile(renamingFile.id, renameValue.trim());
      await loadDbFiles();
      setRenamingFile(null);
      setRenameValue('');
      onShowToast('File renamed successfully!', 'success');
    } catch (err) {
      console.error('Rename failed:', err);
      onShowToast('Failed to rename file', 'error');
    }
  };

  const handleDeleteFileConfirm = async () => {
    if (fileToDelete) {
      try {
        await indexedDbService.deleteFile(fileToDelete.id);
        await loadDbFiles();
        if (activeMedia?.file && (activeMedia.file as SubjectFile).id === fileToDelete.id) {
          setActiveMedia(null);
        }
        onShowToast(`Deleted "${fileToDelete.name}"`, 'info');
      } catch (err) {
        console.error('Delete failed:', err);
      }
      setFileToDelete(null);
    }
  };

  const handleDeleteLegacyPdfConfirm = () => {
    if (legacyPdfToDelete) {
      onDeletePdf(legacyPdfToDelete);
      onShowToast('Deleted note', 'info');
      if (activeMedia?.file && (activeMedia.file as PdfResource).id === legacyPdfToDelete) {
        setActiveMedia(null);
      }
      setLegacyPdfToDelete(null);
    }
  };

  const handleAddTaskSubmit = (unitId: string, unitNum: number | undefined, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    onAddTask(newTaskText.trim(), unitId, unitNum);
    setNewTaskText('');
    setAddingResourceType(null);
    onShowToast(`Task added to Unit! 📋`, 'success');
  };

  const handleMove = (type: 'task' | 'video' | 'pdf' | 'question', itemId: string, targetUnitId: string) => {
    const targetUnit = subject.units.find(u => u.id === targetUnitId);
    onMoveItemToUnit(type, itemId, targetUnitId, targetUnit?.unit);
    onShowToast(`Moved to ${targetUnit ? formatUnitDisplayName(targetUnit) : targetUnitId}!`, 'success');
  };

  // Live Note Selection and Saving
  const handleSelectNoteForLiveEdit = (file: SubjectFile) => {
    setActiveNoteFileId(file.id);
    setLiveNoteTitle(file.name);
    let text = file.content || '';
    if (!text && file.dataUrl && file.dataUrl.startsWith('data:text/plain')) {
      try {
        text = decodeURIComponent(file.dataUrl.split(',')[1]);
      } catch {
        text = file.description || '';
      }
    } else if (!text) {
      text = file.description || '';
    }
    setLiveNoteContent(text);
  };

  const handleSaveLiveNote = async (targetUnitId: string) => {
    if (!liveNoteTitle.trim() && !liveNoteContent.trim()) {
      onShowToast('Please enter a note title or notes content', 'info');
      return;
    }

    const title = liveNoteTitle.trim() || 'Quick Study Notes';
    const content = liveNoteContent.trim();
    const noteId = activeNoteFileId === 'new' 
      ? `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      : activeNoteFileId;

    const noteFile: SubjectFile = {
      id: noteId,
      examId: activeExamId,
      subjectId: subject.id,
      unitId: targetUnitId,
      name: title,
      description: content.slice(0, 150).trim(),
      content,
      category: 'notes',
      fileType: 'note',
      dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
      size: content.length,
      date: new Date().toLocaleDateString(),
      isImportant: false,
      isDone: false,
      createdAt: Date.now()
    };

    try {
      await indexedDbService.addFile(noteFile);
      await loadDbFiles();
      setActiveNoteFileId(noteId);
      onShowToast('Note saved to IndexedDB! 📝', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save note', 'error');
    }
  };

  const handleAddTakeaway = () => {
    if (!newTakeawayInput.trim()) return;
    setLiveKeyTakeaways([...liveKeyTakeaways, newTakeawayInput.trim()]);
    setNewTakeawayInput('');
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex flex-col lg:flex-row gap-6 py-2 animate-fade-slide-up">
      
      {/* 1. LEFT STICKY COMMAND SIDEBAR */}
      <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-5 lg:sticky lg:top-20 self-start">
        
        {/* Sidebar Box 1: Subject Title, Countdown, Date & Palette */}
        <div 
          className="p-5 rounded-3xl hardware-card space-y-4"
          style={{ borderTop: `6px solid ${subject.accentColor}` }}
        >
          {/* Top row: Back button & Delete */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToOverview}
              className="px-2.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated text-xs font-bold text-paper-ink dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card transition-colors btn-tactile flex items-center gap-1.5"
              title="Back to All Subjects"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Subjects</span>
            </button>

            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-1.5 rounded-lg text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400 transition-colors btn-tactile"
              title="Delete Subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Subject Title & Icon */}
          <div className="flex items-start gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ 
                backgroundColor: `${subject.accentColor}18`, 
                color: subject.accentColor,
                border: `1px solid ${subject.accentColor}30`
              }}
            >
              {getSubjectIcon(subject.iconName || 'BookOpen')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {subject.code && (
                  <span className="text-[10px] font-mono font-bold uppercase text-paper-muted dark:text-night-muted">
                    {subject.code}
                  </span>
                )}
                {subject.semester && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted dark:text-night-muted">
                    {subject.semester}
                  </span>
                )}
              </div>
              <h2 
                className="text-lg font-extrabold tracking-tight text-paper-ink dark:text-night-text leading-snug"
                style={{ color: subject.accentColor }}
              >
                {subject.name}
              </h2>
            </div>
          </div>

          {/* Live Exam Countdown Box (Green >15d -> Yellow 15-5d -> Red <5d) */}
          <div 
            className="p-3.5 rounded-2xl border text-center transition-all space-y-1"
            style={{ 
              backgroundColor: `${urgency.hslColor}10`,
              borderColor: `${urgency.hslColor}40`
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" style={{ color: urgency.hslColor }} />
              <span>{urgency.statusLabel}</span>
            </div>
            <div 
              className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight"
              style={{ color: urgency.hslColor }}
            >
              {urgency.formattedCountdown}
            </div>
            <button
              onClick={() => setIsEditDateOpen(true)}
              className="text-[11px] font-bold text-paper-ink dark:text-night-text hover:underline flex items-center justify-center gap-1 mx-auto pt-0.5"
              title="Change Target Exam Date"
            >
              <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{urgency.hasDate ? urgency.formattedExamDate : 'Set Target Exam Date'}</span>
              <Edit2 className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>

          {/* Accent Color Switcher (10 rich non-purple swatches) */}
          <div className="space-y-1.5 pt-1 border-t border-paper-border dark:border-night-border">
            <div className="text-[10px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider flex items-center justify-between">
              <span>Card Accent Theme</span>
              <span className="text-[10px] font-mono text-paper-ink dark:text-night-text">{ACCENT_PALETTE.find(c => c.hex === subject.accentColor)?.name || 'Custom'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ACCENT_PALETTE.map(c => (
                <button
                  key={c.hex}
                  onClick={() => {
                    onUpdateSubject({ ...subject, accentColor: c.hex });
                    onShowToast(`Theme accent updated to ${c.name}!`, 'success');
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${subject.accentColor === c.hex ? 'scale-110 shadow-sm border-white dark:border-night-bg ring-2 ring-emerald-500' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Total Studied Time & Quick Revision Sheet */}
          <div className="pt-2 border-t border-paper-border dark:border-night-border space-y-2">
            <div className="flex items-center justify-between text-xs text-paper-muted dark:text-night-muted">
              <span>⏱️ Total Time Studied:</span>
              <strong className="text-paper-ink dark:text-night-text font-mono text-xs">
                {formatStudiedTime(getSubjectTotalStudiedMinutes(subject.id, pomodoroLogs))}
              </strong>
            </div>

            {/* 1-Click Print Revision Sheet Button */}
            <button
              onClick={() => setIsRevisionSheetOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold btn-tactile flex items-center justify-center gap-2 shadow-sm transition-all"
              title="Print or view one-page summary revision sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ Quick Revision Sheet</span>
            </button>
          </div>

        </div>

        {/* Sidebar Box 2: Built-in Pomodoro Focus Timer for this Subject */}
        <div className="p-4 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Focus Study Timer</span>
            </span>
            <span className="text-[10px] font-mono text-paper-muted dark:text-night-muted">
              {isTimerRunning ? '🔥 Studying' : 'Ready'}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-paper-cardElevated dark:bg-night-cardElevated rounded-xl border border-paper-border dark:border-night-border text-center">
            {[
              { mins: 25 as const, label: '25m Focus' },
              { mins: 50 as const, label: '50m Deep' },
              { mins: 5 as const, label: '5m Break' }
            ].map(m => (
              <button
                key={m.mins}
                onClick={() => handleSelectFocusMode(m.mins)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${focusDuration === m.mins ? 'bg-emerald-600 text-white shadow-sm' : 'text-paper-muted dark:text-night-muted hover:text-paper-ink'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Time Clock & Play/Pause */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="text-2xl font-mono font-extrabold text-paper-ink dark:text-night-text tracking-tight">
              {Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleTimer}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm btn-tactile flex items-center gap-1 ${isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={handleResetTimer}
                className="px-2.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-[11px] font-semibold text-paper-muted hover:text-paper-ink btn-tactile"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Box 3: Interactive List of Units with Live Readiness % Bars */}
        <div className="p-4 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Units ({subject.units.length})</span>
            </span>
            <button
              onClick={() => setIsEditUnitsOpen(true)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Manage</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {/* All Units pill */}
            <button
              onClick={() => setSelectedUnitId('all')}
              className={`w-full p-2.5 rounded-xl text-xs font-bold text-left transition-all btn-tactile flex items-center justify-between ${
                selectedUnitId === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-paper-cardElevated dark:bg-night-cardElevated text-paper-body dark:text-night-text hover:bg-paper-card'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>All Units Overview</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${selectedUnitId === 'all' ? 'bg-black/20 text-white' : 'text-paper-muted'}`}>
                {subject.units.length}
              </span>
            </button>

            {/* Individual Unit pills */}
            {subject.units.map(unit => {
              const readiness = calculateUnitReadiness(unit, tasks, videos, questions, topics);
              const isSelected = selectedUnitId === unit.id;

              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all btn-tactile flex flex-col gap-1.5 border ${
                    isSelected
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated text-paper-body dark:text-night-text hover:border-emerald-500'
                  }`}
                  style={{
                    backgroundColor: isSelected ? subject.accentColor : undefined
                  }}
                >
                  <div className="flex items-center justify-between gap-1 w-full text-xs font-bold">
                    <span className="truncate">{formatUnitDisplayName(unit)}</span>
                    <span className={`font-mono text-[10px] ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {readiness.percentage}%
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-black/20' : 'bg-paper-border dark:bg-night-border'}`}>
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${readiness.percentage}%`,
                        backgroundColor: isSelected ? '#FFFFFF' : subject.accentColor
                      }}
                    />
                  </div>

                  <div className={`flex items-center justify-between text-[10px] ${isSelected ? 'text-white/80' : 'text-paper-muted dark:text-night-muted'}`}>
                    <span>{readiness.completedItems} / {readiness.totalItems} items ready</span>
                    <span>{readiness.questionsMastered}/{readiness.questionsCount} PYQs</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsEditUnitsOpen(true)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-paper-border dark:border-night-border text-xs font-bold text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text flex items-center justify-center gap-1.5 hover:border-emerald-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add / Edit Units</span>
          </button>
        </div>

      </aside>

      {/* 2. RIGHT FULL-WIDTH UNIT WORKSPACE */}
      <main className="flex-1 w-full min-w-0 space-y-6">
        
        {/* Unassigned Items Banner if any exist */}
        {hasUnassignedItems && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-paper-ink dark:text-night-text space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  📦 General / Unassigned Items ({unassignedTasks.length + unassignedVideos.length + unassignedPdfs.length + unassignedQuestions.length})
                </h4>
                <p className="text-xs text-paper-muted dark:text-night-muted">
                  Use the dropdowns to assign previously saved items into units:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {unassignedTasks.map(t => (
                <div key={t.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 font-medium">📋 {t.text}</span>
                  <select
                    onChange={e => e.target.value && handleMove('task', t.id, e.target.value)}
                    defaultValue=""
                    className="px-2 py-1 rounded-lg bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-[11px] font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  >
                    <option value="" disabled>Move to Unit ▾</option>
                    {subject.units.map(u => (
                      <option key={u.id} value={u.id}>{formatUnitDisplayName(u)}</option>
                    ))}
                  </select>
                </div>
              ))}

              {unassignedVideos.map(v => (
                <div key={v.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 font-medium">🎬 {v.title}</span>
                  <select
                    onChange={e => e.target.value && handleMove('video', v.id, e.target.value)}
                    defaultValue=""
                    className="px-2 py-1 rounded-lg bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-[11px] font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  >
                    <option value="" disabled>Move to Unit ▾</option>
                    {subject.units.map(u => (
                      <option key={u.id} value={u.id}>{formatUnitDisplayName(u)}</option>
                    ))}
                  </select>
                </div>
              ))}

              {unassignedPdfs.map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 font-medium">📄 {p.fileName}</span>
                  <select
                    onChange={e => e.target.value && handleMove('pdf', p.id, e.target.value)}
                    defaultValue=""
                    className="px-2 py-1 rounded-lg bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-[11px] font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  >
                    <option value="" disabled>Move to Unit ▾</option>
                    {subject.units.map(u => (
                      <option key={u.id} value={u.id}>{formatUnitDisplayName(u)}</option>
                    ))}
                  </select>
                </div>
              ))}

              {unassignedQuestions.map(q => (
                <div key={q.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 font-medium">🔥 {q.question}</span>
                  <select
                    onChange={e => e.target.value && handleMove('question', q.id, e.target.value)}
                    defaultValue=""
                    className="px-2 py-1 rounded-lg bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-[11px] font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  >
                    <option value="" disabled>Move to Unit ▾</option>
                    {subject.units.map(u => (
                      <option key={u.id} value={u.id}>{formatUnitDisplayName(u)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Units State */}
        {subject.units.length === 0 && (
          <div className="p-8 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-center space-y-3">
            <Layers className="w-10 h-10 text-paper-muted dark:text-night-muted mx-auto opacity-50" />
            <h4 className="text-base font-bold text-paper-ink dark:text-night-text">No Units Created Yet</h4>
            <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
              Organize this subject into units to track syllabus progress, upload PDFs, and practice PYQs.
            </p>
            <button
              onClick={() => setIsEditUnitsOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold btn-tactile inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Unit</span>
            </button>
          </div>
        )}

        {/* Units Loop */}
        {subject.units
          .filter(u => selectedUnitId === 'all' || u.id === selectedUnitId)
          .map(unit => {
            const { uTasks, uVideos, uPdfs, uQuestions } = getUnitItems(unit);
            const unitDbFiles = dbFiles.filter(f => f.unitId === unit.id || (!f.unitId && selectedUnitId === unit.id));
            const existingDbIds = new Set(unitDbFiles.map(f => f.id));
            const filteredLegacyPdfs = uPdfs.filter(p => !existingDbIds.has(p.id));
            const totalNotesAndFilesCount = unitDbFiles.length + filteredLegacyPdfs.length;
            const isAdding = addingResourceType?.unitId === unit.id;
            const readiness = calculateUnitReadiness(unit, tasks, videos, questions, topics);

            return (
              <div 
                key={unit.id}
                className="p-6 rounded-3xl hardware-card space-y-6 transition-all"
                style={{ 
                  borderTop: `4px solid ${subject.accentColor}`,
                  borderLeft: `6px solid ${subject.accentColor}` 
                }}
              >
                {/* Unit Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border dark:border-night-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: subject.accentColor }}
                      >
                        {unit.unitLabel || `Unit ${unit.unit}`}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {readiness.percentage}% Ready
                      </span>
                      <span className="text-xs text-paper-muted dark:text-night-muted font-medium">
                        • {uTasks.length} Tasks • {uVideos.length} Videos • {totalNotesAndFilesCount} Files • {uQuestions.length} PYQs
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-paper-ink dark:text-night-text">
                      {formatUnitDisplayName(unit)}
                    </h3>
                  </div>

                  {/* Add Resource Buttons for this Unit */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setAddingResourceType(isAdding && addingResourceType?.type === 'video' ? null : { unitId: unit.id, type: 'video' })}
                      className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-semibold text-paper-body dark:text-night-text hover:border-emerald-500 btn-tactile flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>+ Add Video</span>
                    </button>

                    <button
                      onClick={() => setAddingResourceType(isAdding && addingResourceType?.type === 'pdf' ? null : { unitId: unit.id, type: 'pdf' })}
                      className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-semibold text-paper-body dark:text-night-text hover:border-emerald-500 btn-tactile flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>+ Add Note / PDF</span>
                    </button>

                    <button
                      onClick={() => setAddingResourceType(isAdding && addingResourceType?.type === 'task' ? null : { unitId: unit.id, type: 'task' })}
                      className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-semibold text-paper-body dark:text-night-text hover:border-emerald-500 btn-tactile flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>+ Add Task</span>
                    </button>

                    <button
                      onClick={() => setIsAddPyqOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg text-xs font-bold btn-tactile shadow-sm flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>+ Add PYQ</span>
                    </button>

                    <button
                      onClick={() => setIsRevisionSheetOpen(true)}
                      className="p-1.5 rounded-xl border border-paper-border dark:border-night-border text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated btn-tactile"
                      title="Quick Revision Sheet for this Unit"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Forms for adding items */}
                {isAdding && addingResourceType.type === 'video' && (
                  <form onSubmit={e => handleAddVideoSubmit(unit.id, unit.unit, e)} className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-cyan-500/40 space-y-3 animate-fade-slide-up">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Add Video Lecture for {formatUnitDisplayName(unit)}</span>
                      </h5>
                      <button type="button" onClick={() => setAddingResourceType(null)} className="text-paper-muted hover:text-paper-ink text-xs">✕</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Video Title (e.g. CPU Scheduling Algorithms Explained)"
                        value={newVideoTitle}
                        onChange={e => setNewVideoTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="url"
                        required
                        placeholder="YouTube Link (e.g. https://www.youtube.com/watch?v=...)"
                        value={newVideoUrl}
                        onChange={e => setNewVideoUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setAddingResourceType(null)} className="px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border text-xs btn-tactile">Cancel</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold btn-tactile shadow-sm">Save Video</button>
                    </div>
                  </form>
                )}

                {isAdding && addingResourceType.type === 'pdf' && (
                  <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-emerald-500/40 space-y-4 animate-fade-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNoteFormMode('write')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            noteFormMode === 'write'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
                          }`}
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Write Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteFormMode('upload')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            noteFormMode === 'upload'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload PDF / Image</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAddingResourceType(null)}
                        className="p-1.5 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {noteFormMode === 'write' ? (
                      <form onSubmit={e => handleAddNoteSubmit(unit.id, unit.unit, e)} className="space-y-3">
                        <input
                          type="text"
                          required
                          placeholder="Note Title (e.g. Important Formulas & Definitions)"
                          value={newNoteTitle}
                          onChange={e => setNewNoteTitle(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                        />
                        <textarea
                          rows={4}
                          required
                          placeholder="Type formulas, algorithm steps, or exam points here..."
                          value={newNoteContent}
                          onChange={e => setNewNoteContent(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setAddingResourceType(null)} className="px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border text-xs btn-tactile">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold btn-tactile shadow-sm">Save Note</button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={e => handleUploadFilesSubmit(unit.id, e)} className="space-y-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Title (optional, defaults to file name)"
                            value={uploadTitle}
                            onChange={e => setUploadTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Description (optional, e.g. Teacher lecture notes or formula sheet)"
                            value={uploadDesc}
                            onChange={e => setUploadDesc(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                          />
                          <div className="p-4 border-2 border-dashed border-paper-border dark:border-night-border rounded-xl text-center hover:border-emerald-500 transition-colors">
                            <input
                              type="file"
                              id={`file-upload-${unit.id}`}
                              multiple
                              accept=".pdf,image/png,image/jpeg,image/jpg"
                              onChange={e => {
                                if (e.target.files) {
                                  setSelectedFiles(Array.from(e.target.files));
                                }
                              }}
                              className="hidden"
                            />
                            <label htmlFor={`file-upload-${unit.id}`} className="cursor-pointer flex flex-col items-center gap-1.5">
                              <UploadCloud className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-paper-ink dark:text-night-text">
                                Choose PDFs or Images (PNG, JPG)
                              </span>
                              <span className="text-[11px] text-paper-muted dark:text-night-muted">
                                Multiple files supported • Saved in IndexedDB
                              </span>
                            </label>
                            {selectedFiles.length > 0 && (
                              <div className="mt-3 text-left space-y-1 max-h-24 overflow-y-auto">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">Selected ({selectedFiles.length}):</span>
                                {selectedFiles.map((sf, idx) => (
                                  <div key={idx} className="text-[11px] text-paper-body dark:text-night-text flex items-center justify-between bg-paper-card dark:bg-night-card p-1.5 rounded border border-paper-border dark:border-night-border">
                                    <span className="truncate">{sf.name}</span>
                                    <span className="text-paper-muted dark:text-night-muted ml-2 text-[10px]">{(sf.size / 1024).toFixed(1)} KB</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setAddingResourceType(null)} className="px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border text-xs btn-tactile">Cancel</button>
                          <button 
                            type="submit" 
                            disabled={selectedFiles.length === 0 || isUploading}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold btn-tactile shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {isAdding && addingResourceType.type === 'task' && (
                  <form onSubmit={e => handleAddTaskSubmit(unit.id, unit.unit, e)} className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-amber-500/40 space-y-3 animate-fade-slide-up">
                    <h5 className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Add Checklist Task for {formatUnitDisplayName(unit)}</span>
                    </h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Practice Banker's Algorithm numericals..."
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-amber-500"
                      />
                      <button type="button" onClick={() => setAddingResourceType(null)} className="px-3 py-2 rounded-xl border border-paper-border dark:border-night-border text-xs btn-tactile">Cancel</button>
                      <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold btn-tactile shadow-sm">Save Task</button>
                    </div>
                  </form>
                )}

                {/* =========================================================================
                    SIDE-BY-SIDE MEDIA & LIVE UNIT NOTES (xl:col-span-7 + xl:col-span-5)
                    ========================================================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
                  
                  {/* LEFT: xl:col-span-7 -> EMBEDDED YOUTUBE PLAYER OR IN-PAGE PDF READER */}
                  <div className="xl:col-span-7 space-y-4">
                    
                    {/* State A: Active Video Playing */}
                    {activeMedia?.type === 'video' && activeMedia.video && (
                      <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                            <h5 className="text-xs font-bold text-paper-ink dark:text-night-text truncate">
                              🎬 {activeMedia.video.title}
                            </h5>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={activeMedia.video.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => setActiveMedia(null)}
                              className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-card dark:hover:bg-night-card"
                              title="Close Video"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* YouTube Player */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-paper-border dark:border-night-border">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${activeMedia.video.videoId}?rel=0&modestbranding=1&autoplay=1`}
                            title={activeMedia.video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>

                        {/* Video Takeaways & Timestamp Notes */}
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-paper-ink dark:text-night-text">
                            <span>Video Timestamps & Takeaways:</span>
                            <button
                              onClick={() => {
                                if (activeMedia.video) {
                                  onToggleVideoWatched(activeMedia.video.id);
                                  setActiveMedia({
                                    ...activeMedia,
                                    video: { ...activeMedia.video, isWatched: !activeMedia.video.isWatched }
                                  });
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold btn-tactile ${activeMedia.video.isWatched ? 'bg-emerald-600 text-white' : 'bg-paper-card dark:bg-night-card text-paper-muted'}`}
                            >
                              {activeMedia.video.isWatched ? '✓ Watched' : 'Mark as Watched'}
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Type formula notes, key concepts, or timestamps (e.g. 05:20 - Matrix Formula)..."
                            value={activeMedia.video.notes || ''}
                            onChange={e => {
                              if (activeMedia.video) {
                                onUpdateVideoNotes(activeMedia.video.id, e.target.value);
                                setActiveMedia({
                                  ...activeMedia,
                                  video: { ...activeMedia.video, notes: e.target.value }
                                });
                              }
                            }}
                            className="w-full p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500 resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* State B: Active PDF / Note Opened in In-Page Reader */}
                    {activeMedia?.type === 'pdf' && activeMedia.file && (
                      <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <h5 className="text-xs font-bold text-paper-ink dark:text-night-text truncate">
                              📄 {(activeMedia.file as any).name || (activeMedia.file as any).fileName || 'Document'}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                if ((activeMedia.file as any).dataUrl) {
                                  const link = document.createElement('a');
                                  link.href = (activeMedia.file as any).dataUrl;
                                  link.download = (activeMedia.file as any).name || 'document';
                                  link.click();
                                }
                              }}
                              className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPreviewPdfFile(activeMedia.file as SubjectFile)}
                              className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
                              title="Full Screen Viewer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveMedia(null)}
                              className="p-1 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
                              title="Close Reader"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* In-Page Reader Iframe */}
                        <div className="w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-paper-border dark:border-night-border shadow-inner">
                          {(activeMedia.file as any).dataUrl ? (
                            <iframe
                              src={(activeMedia.file as any).dataUrl}
                              title="In-Page PDF Viewer"
                              className="w-full h-[480px] border-0"
                            />
                          ) : (
                            <div className="p-4 text-xs font-mono whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                              {(activeMedia.file as any).extractedText || (activeMedia.file as any).summary || 'No text extracted'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* State C: Media Hub Launcher (When no media is currently expanded) */}
                    {!activeMedia && (
                      <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Unit Media & PDF Hub</span>
                          </span>
                          <span className="text-[11px] text-paper-muted dark:text-night-muted">
                            Click Watch or Read to open split-screen
                          </span>
                        </div>

                        {/* Videos in this unit */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            <span>Saved Videos ({uVideos.length})</span>
                          </span>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {uVideos.map(vid => (
                              <div key={vid.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                  <h6 className="text-xs font-bold text-paper-ink dark:text-night-text truncate">{vid.title}</h6>
                                  <span className="text-[10px] text-paper-muted dark:text-night-muted">
                                    {vid.isWatched ? '✓ Watched' : 'Not watched'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setActiveMedia({ type: 'video', video: vid })}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1 btn-tactile shadow-sm"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Watch</span>
                                  </button>
                                  <button 
                                    onClick={() => onDeleteVideo(vid.id)} 
                                    className="p-1 text-paper-muted hover:text-rose-600"
                                    title="Delete Video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {uVideos.length === 0 && (
                              <div className="text-center py-3 text-xs text-paper-muted dark:text-night-muted italic">
                                No video lectures added yet. Click "+ Add Video" above.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PDFs and notes in this unit */}
                        <div className="space-y-2 pt-2 border-t border-paper-border dark:border-night-border">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDFs & Study Notes ({totalNotesAndFilesCount})</span>
                          </span>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {unitDbFiles.map(file => {
                              const isPdf = file.fileType === 'pdf' || file.name.toLowerCase().endsWith('.pdf');
                              return (
                                <div key={file.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-3 group">
                                  <div className="min-w-0 flex-1">
                                    <h6 className="text-xs font-bold text-paper-ink dark:text-night-text truncate">{file.name}</h6>
                                    <span className="text-[10px] text-paper-muted dark:text-night-muted">
                                      {file.date || 'Saved'} • {(file.size / 1024).toFixed(0)} KB
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => setActiveMedia({ type: 'pdf', file })}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 btn-tactile shadow-sm"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Open Reader</span>
                                    </button>
                                    <button
                                      onClick={() => handleDownloadFile(file)}
                                      className="p-1 text-paper-muted hover:text-paper-ink"
                                      title="Download File"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => setFileToDelete(file)} 
                                      className="p-1 text-paper-muted hover:text-rose-600"
                                      title="Delete File"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredLegacyPdfs.map(pdf => (
                              <div key={pdf.id} className="p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h6 className="text-xs font-bold text-paper-ink dark:text-night-text truncate">{pdf.fileName}</h6>
                                  <span className="text-[10px] text-paper-muted dark:text-night-muted">{pdf.fileSize}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setActiveMedia({ type: 'pdf', file: pdf })}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 btn-tactile shadow-sm"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Read Note</span>
                                  </button>
                                </div>
                              </div>
                            ))}

                            {totalNotesAndFilesCount === 0 && (
                              <div className="text-center py-3 text-xs text-paper-muted dark:text-night-muted italic">
                                No PDFs or notes added yet. Click "+ Add Note / PDF" above.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* RIGHT: xl:col-span-5 -> LIVE UNIT NOTES EDITOR & KEY TAKEAWAYS */}
                  <div className="xl:col-span-5 space-y-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-3.5 shadow-sm">
                      
                      {/* Editor Header: Title + Note Selector */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                          <FileEdit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Live Notes & Key Takeaways</span>
                        </span>

                        <button
                          onClick={() => {
                            setActiveNoteFileId('new');
                            setLiveNoteTitle('');
                            setLiveNoteContent('');
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card hover:bg-paper-cardElevated text-paper-ink dark:text-night-text btn-tactile"
                        >
                          + New Note
                        </button>
                      </div>

                      {/* Dropdown to pick existing note to edit */}
                      {unitDbFiles.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-paper-muted dark:text-night-muted shrink-0">Edit Note:</span>
                          <select
                            value={activeNoteFileId}
                            onChange={e => {
                              const found = unitDbFiles.find(f => f.id === e.target.value);
                              if (found) {
                                handleSelectNoteForLiveEdit(found);
                              } else {
                                setActiveNoteFileId('new');
                                setLiveNoteTitle('');
                                setLiveNoteContent('');
                              }
                            }}
                            className="w-full px-2.5 py-1 rounded-xl text-xs bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                          >
                            <option value="new">+ Write New Note</option>
                            {unitDbFiles.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Note Title Input */}
                      <input
                        type="text"
                        placeholder="Note Title (e.g. Master Formula Sheet & Exam Points)"
                        value={liveNoteTitle}
                        onChange={e => setLiveNoteTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                      />

                      {/* Note Content Textarea (side-by-side with video/PDF) */}
                      <textarea
                        rows={8}
                        placeholder="Type formulas, theorems, derivations, and exam points here while watching video or reading PDF..."
                        value={liveNoteContent}
                        onChange={e => setLiveNoteContent(e.target.value)}
                        className="w-full p-3 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                      />

                      {/* Save Note Button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-paper-muted dark:text-night-muted font-mono">
                          {liveNoteContent.length} chars • Saved to IndexedDB
                        </span>
                        <button
                          onClick={() => handleSaveLiveNote(unit.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold btn-tactile shadow-sm flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Note</span>
                        </button>
                      </div>

                      {/* Quick Takeaways Bullets List */}
                      <div className="pt-2 border-t border-paper-border dark:border-night-border space-y-2">
                        <div className="text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider">
                          Key Exam Takeaways:
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add quick exam takeaway or formula bullet..."
                            value={newTakeawayInput}
                            onChange={e => setNewTakeawayInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTakeaway();
                              }
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddTakeaway}
                            className="px-3 py-1.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-bold hover:bg-paper-cardElevated"
                          >
                            +
                          </button>
                        </div>

                        {liveKeyTakeaways.length > 0 && (
                          <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {liveKeyTakeaways.map((point, pIdx) => (
                              <li key={pIdx} className="text-xs p-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px]">• {point}</span>
                                <button
                                  onClick={() => setLiveKeyTakeaways(liveKeyTakeaways.filter((_, i) => i !== pIdx))}
                                  className="text-paper-muted hover:text-rose-500 text-[10px]"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* =========================================================================
                    UNIT TASKS & UNIT PYQS (Wide Cards Across Full Workspace)
                    ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full pt-2">
                  
                  {/* Card 1: Unit Tasks Checklist */}
                  <div className="p-5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex flex-col h-full space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Unit Tasks Checklist ({uTasks.length})</span>
                      </span>
                      <span className="text-[10px] font-mono text-paper-muted dark:text-night-muted">
                        {uTasks.filter(t => t.completed).length}/{uTasks.length} Done
                      </span>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {uTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border group">
                          <div 
                            onClick={() => onToggleTask(t.id)} 
                            className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-paper-muted dark:text-night-muted shrink-0" />
                            )}
                            <span className={`text-xs ${t.completed ? 'line-through text-paper-muted dark:text-night-muted' : 'text-paper-ink dark:text-night-text'}`}>
                              {t.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <select
                              onChange={e => e.target.value && handleMove('task', t.id, e.target.value)}
                              defaultValue=""
                              className="px-1.5 py-0.5 rounded text-[10px] bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted outline-none"
                              title="Move to another unit"
                            >
                              <option value="" disabled>Move ▾</option>
                              {subject.units.map(otherU => (
                                <option key={otherU.id} value={otherU.id}>{formatUnitDisplayName(otherU)}</option>
                              ))}
                            </select>

                            <button onClick={() => onDeleteTask(t.id)} className="p-1 text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {uTasks.length === 0 && (
                        <div className="text-center py-6 text-xs text-paper-muted dark:text-night-muted italic">
                          No tasks for {formatUnitDisplayName(unit)} yet. Click "+ Add Task" to create one.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Unit Past Exam Questions (PYQs) */}
                  <div className="p-5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex flex-col h-full space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Unit Past Exam Questions ({uQuestions.length})</span>
                      </span>
                      <span className="text-[10px] font-mono text-paper-muted dark:text-night-muted">
                        {uQuestions.filter(q => q.userStatus === 'mastered').length}/{uQuestions.length} Mastered
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {uQuestions.map((q) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          onToggleMastered={onToggleMastered}
                          onSaveAnswer={onSaveAnswer}
                          onShowToast={onShowToast}
                        />
                      ))}

                      {uQuestions.length === 0 && (
                        <div className="text-center py-6 text-xs text-paper-muted dark:text-night-muted italic">
                          No questions logged for {formatUnitDisplayName(unit)} yet. Click "+ Add PYQ" above.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}

      </main>

      {/* -------------------------------------------------------------------------
          MODALS & OVERLAYS
          ------------------------------------------------------------------------- */}

      {/* 1-Click Print Unit Revision Sheet Modal */}
      <PrintRevisionSheetModal
        isOpen={isRevisionSheetOpen}
        onClose={() => setIsRevisionSheetOpen(false)}
        subject={subject}
        initialUnitId={selectedUnitId}
        questions={questions.filter(q => q.subjectId === subject.id)}
        videos={videos.filter(v => v.subjectId === subject.id)}
        dbFiles={dbFiles}
        legacyPdfs={pdfs.filter(p => p.subjectId === subject.id)}
        onShowToast={onShowToast}
      />

      {/* Fullscreen PDF Viewer Modal */}
      {previewPdfFile && (
        <PdfViewerModal
          file={previewPdfFile}
          onClose={() => setPreviewPdfFile(null)}
        />
      )}

      {/* Fullscreen Image Viewer Modal */}
      {previewImageFile && (
        <ImageViewerModal
          file={previewImageFile}
          onClose={() => setPreviewImageFile(null)}
        />
      )}

      {/* Rename File Modal */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up">
          <form 
            onSubmit={handleRenameFileSubmit}
            className="w-full max-w-md p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative space-y-4"
          >
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Rename File / Note</span>
            </h4>
            <input
              type="text"
              required
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingFile(null)}
                className="px-3.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-xs btn-tactile text-paper-body dark:text-night-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold btn-tactile shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete File / Note?"
        message={`Are you sure you want to delete "${fileToDelete?.name}"? This file will be permanently removed from IndexedDB.`}
        confirmLabel="Delete"
        isDanger={true}
        onCancel={() => setFileToDelete(null)}
        onConfirm={handleDeleteFileConfirm}
      />

      {/* Delete Legacy Note Confirmation Modal */}
      <ConfirmModal
        isOpen={!!legacyPdfToDelete}
        title="Delete Study Note?"
        message="Are you sure you want to delete this study note? This action cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
        onCancel={() => setLegacyPdfToDelete(null)}
        onConfirm={handleDeleteLegacyPdfConfirm}
      />

      {/* Full Content Reader Modal for Legacy Notes */}
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
                <h3 className="text-base font-bold text-paper-ink dark:text-night-text">{activePdfModal.fileName}</h3>
                <span className="text-xs text-paper-muted dark:text-night-muted">Extracted Content • {activePdfModal.fileSize}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="p-4 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-body dark:text-night-text leading-relaxed font-mono whitespace-pre-wrap">
                {activePdfModal.extractedText}
              </div>
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

      {/* Edit Date Modal */}
      <EditExamDateModal
        subject={subject}
        isOpen={isEditDateOpen}
        onClose={() => setIsEditDateOpen(false)}
        onSave={(newDate) => {
          onUpdateSubject({ ...subject, examDate: newDate });
          onShowToast('Target exam date updated! Countdown synced.', 'success');
        }}
      />

      {/* Edit Units Modal */}
      <EditUnitsModal
        subject={subject}
        isOpen={isEditUnitsOpen}
        onClose={() => setIsEditUnitsOpen(false)}
        onSaveUnits={(updatedUnits) => {
          onUpdateSubject({ ...subject, units: updatedUnits });
          onShowToast('Syllabus units updated!', 'success');
        }}
      />

      {/* Add Custom PYQ Modal */}
      <AddCustomPyqModal
        subject={subject}
        isOpen={isAddPyqOpen}
        onClose={() => setIsAddPyqOpen(false)}
        onAdd={(q) => {
          onAddQuestion(q);
        }}
      />

      {/* Delete Subject Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Subject?"
        message={`Are you sure you want to delete ${subject.name}? All associated study tasks, questions, notes, and videos will be removed.`}
        confirmLabel="Delete Subject"
        isDanger={true}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDeleteSubject(subject.id);
          onBackToOverview();
          onShowToast(`Removed ${subject.name} from subjects.`, 'info');
        }}
      />

    </div>
  );
};
