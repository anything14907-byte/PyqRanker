import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  SubjectMeta, 
  SubjectFile, 
  FileCategory, 
  VideoResource 
} from '../types';
import { getExamUrgencyColor, extractYoutubeId } from '../utils/storageService';
import { YouTubeIframePlayer } from './YouTubeIframePlayer';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Search, 
  UploadCloud, 
  Star, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  FolderInput, 
  ExternalLink, 
  Eye, 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Save, 
  ArrowUpDown, 
  Filter,
  Play,
  RotateCcw
} from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';
import { PdfViewerModal } from './PdfViewerModal';
import { RenameFileModal, MoveFileModal } from './FileActionModals';
import { UploadFilesModal } from './UploadFilesModal';
import { extractTextFromPdf } from '../utils/pdfExtractor';

interface SubjectDetailViewProps {
  subject: SubjectMeta;
  files: SubjectFile[];
  notesText: string;
  videos: VideoResource[];
  onBackToDashboard: () => void;
  onAddFiles: (files: SubjectFile[]) => void;
  onUpdateFile: (file: SubjectFile) => void;
  onDeleteFile: (fileId: string) => void;
  onMoveFile: (fileId: string, newCategory: FileCategory) => void;
  onToggleImportant: (fileId: string) => void;
  onToggleDone: (fileId: string) => void;
  onSaveNotes: (subjectId: string, content: string) => void;
  onAddVideo: (video: VideoResource) => void;
  onToggleVideoWatched: (videoId: string) => void;
  onUpdateVideoNotes: (videoId: string, notes: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type SubjectTab = 'pyq' | 'notes' | 'images' | 'mynotes' | 'videos' | 'extractor';

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  files,
  notesText,
  videos,
  onBackToDashboard,
  onAddFiles,
  onUpdateFile,
  onDeleteFile,
  onMoveFile,
  onToggleImportant,
  onToggleDone,
  onSaveNotes,
  onAddVideo,
  onToggleVideoWatched,
  onUpdateVideoNotes,
  onDeleteVideo,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<SubjectTab>('pyq');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortYearOrder, setSortYearOrder] = useState<'desc' | 'asc'>('desc');
  const [filterMode, setFilterMode] = useState<'all' | 'starred' | 'pending'>('all');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<SubjectFile | null>(null);
  const [viewingPdf, setViewingPdf] = useState<SubjectFile | null>(null);
  const [renamingFile, setRenamingFile] = useState<SubjectFile | null>(null);
  const [movingFile, setMovingFile] = useState<SubjectFile | null>(null);

  // My Notes state
  const [localNotes, setLocalNotes] = useState(notesText);
  const [isNotesSaved, setIsNotesSaved] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNotes(notesText);
  }, [notesText]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    setIsNotesSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSaveNotes(subject.id, val);
      setIsNotesSaved(true);
    }, 600);
  };

  // Video Tab state
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [activePlayingVideoId, setActivePlayingVideoId] = useState('');

  // PDF Extractor state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState('');
  const [extractedTerms, setExtractedTerms] = useState<{ term: string; definition: string }[]>([]);
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);
  const extractorFileRef = useRef<HTMLInputElement | null>(null);

  // Exam Countdown calculation
  const urgency = getExamUrgencyColor(subject.examDate);

  // Filter files by subject and tab
  const subjectFiles = useMemo(() => {
    return files.filter(f => f.subjectId === subject.id);
  }, [files, subject.id]);

  const pyqFiles = useMemo(() => subjectFiles.filter(f => f.category === 'pyq'), [subjectFiles]);
  const teacherNotesFiles = useMemo(() => subjectFiles.filter(f => f.category === 'notes'), [subjectFiles]);
  const imageFiles = useMemo(() => subjectFiles.filter(f => f.category === 'images'), [subjectFiles]);
  const subjectVideos = useMemo(() => videos.filter(v => v.subjectId === subject.id), [videos, subject.id]);

  // Tab files with search and sort
  const currentTabFiles = useMemo(() => {
    let list: SubjectFile[] = [];
    if (activeTab === 'pyq') list = pyqFiles;
    else if (activeTab === 'notes') list = teacherNotesFiles;
    else if (activeTab === 'images') list = imageFiles;
    else return [];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) || 
        (f.year && f.year.includes(q)) || 
        (f.examType && f.examType.toLowerCase().includes(q))
      );
    }

    // Filter by mode
    if (filterMode === 'starred') {
      list = list.filter(f => f.isImportant);
    } else if (filterMode === 'pending') {
      list = list.filter(f => !f.isDone);
    }

    // Sort: Starred ALWAYS on top
    return [...list].sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;

      // Secondary sort for PYQ: Year
      if (activeTab === 'pyq') {
        const yearA = parseInt(a.year || '0', 10);
        const yearB = parseInt(b.year || '0', 10);
        if (sortYearOrder === 'desc') {
          return yearB - yearA;
        } else {
          return yearA - yearB;
        }
      }

      // Default: creation date desc
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [activeTab, pyqFiles, teacherNotesFiles, imageFiles, searchQuery, filterMode, sortYearOrder]);

  // File open helper
  const handleOpenFile = (file: SubjectFile) => {
    if (file.fileType === 'image' || file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      setViewingImage(file);
    } else {
      setViewingPdf(file);
    }
  };

  const handleConfirmDelete = (file: SubjectFile) => {
    if (window.confirm(`Delete "${file.name}"? This file will be permanently removed.`)) {
      onDeleteFile(file.id);
      onShowToast(`Deleted "${file.name}"`, 'info');
    }
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYoutubeId(videoUrl);
    if (!ytId) {
      onShowToast('Please enter a valid YouTube URL', 'error');
      return;
    }

    const newVid: VideoResource = {
      id: `vid-${Date.now().toString(36)}`,
      subjectId: subject.id,
      title: videoTitle.trim() || 'Lecture Video',
      youtubeUrl: videoUrl,
      videoId: ytId,
      notes: 'Key lecture moments:\n- 00:00 Introduction\n- 05:30 Core concept & formula\n- 15:45 Solved exam problem',
      isWatched: false,
      addedAt: Date.now()
    };

    onAddVideo(newVid);
    setVideoTitle('');
    setVideoUrl('');
    setIsAddVideoOpen(false);
    onShowToast('Saved lecture to YouTube Vault!', 'success');
  };

  const handleExtractorFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const rawText = await extractTextFromPdf(file);
      const cleanSentences = rawText
        .split(/[.\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 25 && !s.includes('--- Page'));

      const summary = cleanSentences.slice(0, 3).join('. ') + '.';
      setExtractedSummary(summary || `Lecture notes summary for ${file.name.replace(/\.pdf$/i, '')}.`);

      // Extract key terms
      const termMatches = rawText.match(/(?:[A-Z][a-zA-Z\s]{3,25})\s+(?:is defined as|refers to|is a|means|consists of)\s+[^.?!]+[.?!]/g) || [];
      const terms = termMatches.slice(0, 4).map(t => {
        const parts = t.split(/\s+(?:is defined as|refers to|is a|means|consists of)\s+/i);
        return {
          term: parts[0]?.trim() || 'Core Concept',
          definition: parts[1]?.trim() || t.trim()
        };
      });

      if (terms.length === 0) {
        terms.push(
          { term: 'Core Concept', definition: 'Fundamental theoretical framework and governing formulas.' },
          { term: 'Exam Tip', definition: 'Be prepared for definition, comparison, and numerical questions.' }
        );
      }
      setExtractedTerms(terms);

      // Extract questions
      const qMatches = rawText.match(/(?:(?:Explain|Describe|Define|Compare|Calculate|What is|Write short note on|Derive)\s+[^.?!]+[.?!])/gi) || [];
      const questions = qMatches.slice(0, 4).map(q => q.trim());
      if (questions.length === 0) {
        questions.push(
          `Explain the core architectural principles of ${file.name.replace(/\.pdf$/i, '')}.`,
          `Differentiate key execution modes and practical trade-offs.`,
          `State the main formulas and boundary conditions.`
        );
      }
      setExtractedQuestions(questions);
      onShowToast('Extracted notes & exam questions successfully!', 'success');
    } catch (err) {
      onShowToast('Failed to parse PDF document.', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up pb-16">
      
      {/* 1. TOP HEADER & EXAM COUNTDOWN HERO */}
      <div 
        className="p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card relative overflow-hidden transition-all"
        style={{ borderTop: `5px solid ${subject.accentColor}` }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text mb-2 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>← All Subjects Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <span 
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: subject.accentColor }}
              />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-paper-ink dark:text-night-text tracking-tight">
                {subject.name}
              </h1>
              {subject.code && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted">
                  {subject.code}
                </span>
              )}
            </div>
          </div>

          {/* Exam Countdown Ticker */}
          <div className="flex items-center gap-3 bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border rounded-2xl p-3 px-4 shrink-0">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: `${urgency.hslColor}20`,
                color: urgency.hslColor 
              }}
            >
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted">
                Exam Countdown
              </div>
              <div 
                className="text-lg font-mono font-extrabold tracking-tight"
                style={{ color: urgency.hslColor }}
              >
                {urgency.days}d {urgency.hours}h {urgency.minutes}m {urgency.seconds}s
              </div>
              <div className="text-[11px] text-paper-muted dark:text-night-muted">
                {urgency.formattedExamDate}
              </div>
            </div>
          </div>

        </div>

        {/* Search & Quick Actions Bar */}
        <div className="mt-6 pt-5 border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search box inside this subject */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-paper-muted dark:text-night-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files in this subject..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-muted hover:text-paper-ink dark:text-night-muted text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400 text-xs font-bold flex items-center justify-center gap-2 shadow-sm btn-tactile btn-shimmer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload Files to Subject</span>
          </button>

        </div>
      </div>

      {/* 2. SUBJECT NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-paper-border dark:border-night-border">
        {[
          { id: 'pyq', label: 'PYQ Papers', count: pyqFiles.length, icon: <FileText className="w-4 h-4" /> },
          { id: 'notes', label: 'Teacher Notes', count: teacherNotesFiles.length, icon: <FileText className="w-4 h-4" /> },
          { id: 'images', label: 'Images Gallery', count: imageFiles.length, icon: <ImageIcon className="w-4 h-4" /> },
          { id: 'mynotes', label: 'My Notes', icon: <Edit3 className="w-4 h-4" /> },
          { id: 'videos', label: 'YouTube Vault', count: subjectVideos.length, icon: <Video className="w-4 h-4" /> },
          { id: 'extractor', label: 'PDF Extractor', icon: <Sparkles className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubjectTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                isActive
                  ? 'border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg shadow-sm'
                  : 'border-transparent text-paper-body dark:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated hover:border-paper-border'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive 
                    ? 'bg-black/20 text-white dark:text-night-bg font-extrabold' 
                    : 'bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted dark:text-night-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: PYQ PAPERS */}
      {activeTab === 'pyq' && (
        <div className="space-y-4">
          
          {/* Controls: Sort by year & filter */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-paper-muted dark:text-night-muted">Sort Year:</span>
              <button
                onClick={() => setSortYearOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-2.5 py-1 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border font-bold flex items-center gap-1 hover:border-emerald-500"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
                <span>{sortYearOrder === 'desc' ? 'Newest First (2024 → 2020)' : 'Oldest First (2020 → 2024)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'starred', 'pending'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-1 rounded-lg border font-bold capitalize transition-colors ${
                    filterMode === mode
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted hover:text-paper-ink'
                  }`}
                >
                  {mode === 'all' ? 'All PYQs' : mode === 'starred' ? '⭐ Starred Only' : '⏳ Unsolved Only'}
                </button>
              ))}
            </div>
          </div>

          {/* PYQ Papers List */}
          {currentTabFiles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border space-y-3">
              <FileText className="w-10 h-10 mx-auto text-paper-muted dark:text-night-muted opacity-50" />
              <div className="text-sm font-bold text-paper-ink dark:text-night-text">
                {searchQuery ? 'No PYQ papers match your search' : 'No past-year papers uploaded yet'}
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
                Upload past-year university question papers (PDFs or images). Label them by year and exam type.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg"
              >
                + Upload First PYQ Paper
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentTabFiles.map(file => (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl bg-paper-card dark:bg-night-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    file.isImportant 
                      ? 'border-amber-500/50 dark:border-amber-500/30 bg-amber-500/[0.02]' 
                      : 'border-paper-border dark:border-night-border hover:border-emerald-500/40'
                  }`}
                >
                  {/* Left: Done Checkbox + Star + Info */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Done Checkbox */}
                    <button
                      onClick={() => onToggleDone(file.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        file.isDone 
                          ? 'text-emerald-500 hover:text-emerald-600' 
                          : 'text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text'
                      }`}
                      title={file.isDone ? 'Mark as Not Done' : 'Mark as Done (Covered)'}
                    >
                      {file.isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>

                    {/* Star Button */}
                    <button
                      onClick={() => onToggleImportant(file.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        file.isImportant 
                          ? 'text-amber-400 hover:text-amber-500' 
                          : 'text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text'
                      }`}
                      title={file.isImportant ? 'Unstar Important' : 'Mark as Important (Pin to Top)'}
                    >
                      <Star className={`w-5 h-5 ${file.isImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    {/* File Title & Tags */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        {file.year && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {file.year}
                          </span>
                        )}
                        {file.examType && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted">
                            {file.examType}
                          </span>
                        )}
                        {file.isDone && (
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            ✓ Covered
                          </span>
                        )}
                      </div>

                      <div 
                        onClick={() => handleOpenFile(file)}
                        className={`text-sm font-bold mt-1 truncate cursor-pointer hover:underline text-paper-ink dark:text-night-text ${
                          file.isDone ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {file.name}
                      </div>

                      <div className="text-[11px] text-paper-muted dark:text-night-muted flex items-center gap-2 mt-0.5">
                        <span>{(file.size / 1024).toFixed(0)} KB</span>
                        <span>• {file.fileType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-night-bg border border-paper-border dark:border-night-border text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Open & Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setRenamingFile(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated border border-paper-border dark:border-night-border transition-colors"
                      title="Rename File"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setMovingFile(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated border border-paper-border dark:border-night-border transition-colors"
                      title="Move to Another Tab"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleConfirmDelete(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-red-500 dark:text-night-muted dark:hover:text-red-400 hover:bg-red-500/10 border border-paper-border dark:border-night-border transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TEACHER NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-paper-muted dark:text-night-muted font-bold">
              Faculty handouts, lecture notes & syllabus reference materials
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'starred', 'pending'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-1 rounded-lg border font-bold capitalize transition-colors ${
                    filterMode === mode
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted'
                  }`}
                >
                  {mode === 'all' ? 'All Notes' : mode === 'starred' ? '⭐ Starred' : '⏳ Pending'}
                </button>
              ))}
            </div>
          </div>

          {currentTabFiles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border space-y-3">
              <FileText className="w-10 h-10 mx-auto text-paper-muted dark:text-night-muted opacity-50" />
              <div className="text-sm font-bold text-paper-ink dark:text-night-text">
                {searchQuery ? 'No teacher notes match your search' : 'No teacher notes uploaded yet'}
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
                Upload PDFs and lecture handouts sent by your professors.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg"
              >
                + Upload Teacher Notes
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentTabFiles.map(file => (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl bg-paper-card dark:bg-night-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    file.isImportant 
                      ? 'border-amber-500/50 dark:border-amber-500/30 bg-amber-500/[0.02]' 
                      : 'border-paper-border dark:border-night-border hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => onToggleDone(file.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        file.isDone ? 'text-emerald-500' : 'text-paper-muted dark:text-night-muted'
                      }`}
                    >
                      {file.isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => onToggleImportant(file.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        file.isImportant ? 'text-amber-400' : 'text-paper-muted dark:text-night-muted'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${file.isImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="overflow-hidden">
                      <div 
                        onClick={() => handleOpenFile(file)}
                        className={`text-sm font-bold truncate cursor-pointer hover:underline text-paper-ink dark:text-night-text ${
                          file.isDone ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {file.name}
                      </div>
                      <div className="text-[11px] text-paper-muted dark:text-night-muted flex items-center gap-2 mt-0.5">
                        {file.date && <span className="text-emerald-500 font-bold">{file.date}</span>}
                        <span>• {(file.size / 1024).toFixed(0)} KB</span>
                        <span>• {file.fileType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-night-bg border border-paper-border dark:border-night-border text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setRenamingFile(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text border border-paper-border dark:border-night-border"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setMovingFile(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text border border-paper-border dark:border-night-border"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleConfirmDelete(file)}
                      className="p-2 rounded-xl text-paper-muted hover:text-red-500 border border-paper-border dark:border-night-border"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: IMAGES GALLERY (FULL SCREEN ZOOMABLE) */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-paper-muted dark:text-night-muted font-bold">
              Photos of handwritten notes, whiteboards, formula sheets & diagrams. Tap to zoom full screen.
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Images</span>
            </button>
          </div>

          {currentTabFiles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border space-y-3">
              <ImageIcon className="w-10 h-10 mx-auto text-paper-muted dark:text-night-muted opacity-50" />
              <div className="text-sm font-bold text-paper-ink dark:text-night-text">
                {searchQuery ? 'No images match your search' : 'No photos or diagrams in this gallery'}
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
                Snap photos of blackboard diagrams, formula cheat sheets, or whiteboard solutions on your phone.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg"
              >
                + Upload Images
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTabFiles.map(file => (
                <div
                  key={file.id}
                  className={`group relative rounded-2xl bg-paper-card dark:bg-night-card border overflow-hidden transition-all shadow-sm flex flex-col ${
                    file.isImportant 
                      ? 'border-amber-500/50 dark:border-amber-500/40 ring-1 ring-amber-500/30' 
                      : 'border-paper-border dark:border-night-border hover:border-emerald-500/50'
                  }`}
                >
                  {/* Thumbnail / Image container with click-to-zoom */}
                  <div 
                    onClick={() => setViewingImage(file)}
                    className="relative aspect-[4/3] w-full bg-black/40 overflow-hidden cursor-zoom-in"
                  >
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Floating Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      {file.isImportant && (
                        <span className="p-1.5 rounded-lg bg-amber-500/90 text-white shadow-md">
                          <Star className="w-3.5 h-3.5 fill-white" />
                        </span>
                      )}
                      {file.isDone && (
                        <span className="p-1.5 rounded-lg bg-emerald-500/90 text-white shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tap to Zoom</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-paper-ink dark:text-night-text truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-paper-muted dark:text-night-muted">
                        {(file.size / 1024).toFixed(0)} KB
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleImportant(file.id)}
                        className={`p-1.5 rounded-lg ${file.isImportant ? 'text-amber-400' : 'text-paper-muted dark:text-night-muted'}`}
                      >
                        <Star className={`w-4 h-4 ${file.isImportant ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => onToggleDone(file.id)}
                        className={`p-1.5 rounded-lg ${file.isDone ? 'text-emerald-500' : 'text-paper-muted dark:text-night-muted'}`}
                      >
                        {file.isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setRenamingFile(file)}
                        className="p-1.5 rounded-lg text-paper-muted hover:text-paper-ink dark:text-night-muted"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleConfirmDelete(file)}
                        className="p-1.5 rounded-lg text-paper-muted hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 4: MY NOTES (PERSONAL TEXT BOX / MARKDOWN) */}
      {activeTab === 'mynotes' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-paper-ink dark:text-night-text">
                Personal Study Notes & Cheat Sheet
              </h3>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Write formulas, derivations, and exam reminders. Automatically saved to IndexedDB.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs flex items-center gap-1 ${isNotesSaved ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isNotesSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 animate-pulse" />}
                <span>{isNotesSaved ? 'Saved in IndexedDB' : 'Saving...'}</span>
              </span>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(localNotes);
                  onShowToast('Notes copied to clipboard!', 'info');
                }}
                className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-xs font-bold hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated flex items-center gap-1.5 text-paper-muted hover:text-paper-ink dark:text-night-muted"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card overflow-hidden shadow-sm">
            <textarea
              value={localNotes}
              onChange={handleNotesChange}
              placeholder="# Write your notes, formulas, or cheat sheet here..."
              rows={20}
              className="w-full p-5 bg-transparent font-mono text-sm text-paper-ink dark:text-night-text leading-relaxed focus:outline-none resize-y"
            />
          </div>

        </div>
      )}

      {/* TAB 5: YOUTUBE VAULT (PER SUBJECT) */}
      {activeTab === 'videos' && (
        <div className="space-y-5">
          
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-paper-ink dark:text-night-text">
                YouTube Lecture Vault for {subject.name}
              </h3>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Save best university playlist lectures with clickable timestamps for rapid revision.
              </p>
            </div>

            <button
              onClick={() => setIsAddVideoOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Lecture Video</span>
            </button>
          </div>

          {/* Add Video Form */}
          {isAddVideoOpen && (
            <form 
              onSubmit={handleAddVideoSubmit}
              className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-4 animate-fade-in"
            >
              <div className="text-sm font-bold text-paper-ink dark:text-night-text flex items-center justify-between">
                <span>Add YouTube Lecture</span>
                <button
                  type="button"
                  onClick={() => setIsAddVideoOpen(false)}
                  className="text-paper-muted hover:text-paper-ink dark:text-night-muted"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase mb-1">
                    Lecture Title
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Process Scheduling in 10 Minutes"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-paper-muted dark:text-night-muted uppercase mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVideoOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-xs font-bold text-paper-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-night-bg text-xs font-bold"
                >
                  Save to Subject
                </button>
              </div>
            </form>
          )}

          {/* Videos Grid */}
          {subjectVideos.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border space-y-3">
              <Video className="w-10 h-10 mx-auto text-paper-muted dark:text-night-muted opacity-50" />
              <div className="text-sm font-bold text-paper-ink dark:text-night-text">
                No lecture videos saved for this subject
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
                Paste YouTube video links from your favorite educators with timestamp notes.
              </p>
              <button
                onClick={() => setIsAddVideoOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg"
              >
                + Add Lecture Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {subjectVideos.map(vid => {
                const isPlaying = activePlayingVideoId === vid.id;
                return (
                  <div
                    key={vid.id}
                    className={`rounded-2xl bg-paper-card dark:bg-night-card border overflow-hidden shadow-sm flex flex-col ${
                      vid.isWatched ? 'border-emerald-500/40 opacity-80' : 'border-paper-border dark:border-night-border'
                    }`}
                  >
                    {/* Video Player or Thumbnail */}
                    <div className="w-full bg-black relative">
                      {isPlaying ? (
                        <YouTubeIframePlayer
                          videoId={vid.videoId}
                          videoItemId={vid.id}
                          videoTitle={vid.title}
                          youtubeUrl={vid.youtubeUrl}
                          isWatched={vid.isWatched}
                          onToggleWatched={() => onToggleVideoWatched(vid.id)}
                          onShowToast={onShowToast}
                        />
                      ) : (
                        <div 
                          onClick={() => setActivePlayingVideoId(vid.id)}
                          className="aspect-video w-full relative cursor-pointer group"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta & Notes */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-paper-ink dark:text-night-text line-clamp-1">
                            {vid.title}
                          </h4>
                          <button
                            onClick={() => onToggleVideoWatched(vid.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              vid.isWatched 
                                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                                : 'bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted border-paper-border'
                            }`}
                          >
                            {vid.isWatched ? '✓ Watched' : 'Mark Watched'}
                          </button>
                        </div>

                        {/* Timestamp Notes */}
                        <div className="mt-3 p-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono text-paper-body dark:text-night-text whitespace-pre-wrap max-h-28 overflow-y-auto">
                          {vid.notes}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-paper-border dark:border-night-border text-xs">
                        <a
                          href={vid.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-paper-muted hover:text-emerald-500 flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open on YouTube</span>
                        </a>

                        <button
                          onClick={() => {
                            if (window.confirm('Delete this lecture video?')) {
                              onDeleteVideo(vid.id);
                              onShowToast('Removed lecture video.', 'info');
                            }
                          }}
                          className="text-paper-muted hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 6: PDF TEXT EXTRACTOR (PER SUBJECT) */}
      {activeTab === 'extractor' && (
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-paper-ink dark:text-night-text">
                PDF Notes Extractor
              </h3>
            </div>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              Select any PDF notes file to automatically extract an Executive Summary, Key Terms glossary, and Practice Questions.
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={extractorFileRef}
                type="file"
                accept="application/pdf"
                onChange={handleExtractorFile}
                className="hidden"
              />
              <button
                onClick={() => extractorFileRef.current?.click()}
                disabled={isExtracting}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-night-bg dark:hover:bg-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isExtracting ? 'Analyzing PDF...' : 'Select PDF to Extract'}</span>
              </button>
            </div>
          </div>

          {/* Extracted Output */}
          {extractedSummary && (
            <div className="space-y-5 animate-fade-in">
              {/* Summary */}
              <div className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Executive Summary
                </h4>
                <p className="text-sm text-paper-ink dark:text-night-text leading-relaxed">
                  {extractedSummary}
                </p>
              </div>

              {/* Key Terms */}
              {extractedTerms.length > 0 && (
                <div className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-3">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Key Terms & Definitions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extractedTerms.map((t, i) => (
                      <div key={i} className="p-3 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs">
                        <div className="font-bold text-emerald-500">{t.term}</div>
                        <div className="text-paper-muted dark:text-night-muted mt-1">{t.definition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Questions */}
              {extractedQuestions.length > 0 && (
                <div className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-3">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Likely Exam Questions
                  </h4>
                  <div className="space-y-2">
                    {extractedQuestions.map((q, i) => (
                      <div key={i} className="p-3 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-medium text-paper-ink dark:text-night-text flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">Q{i + 1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 4. MODALS */}

      {/* Full-Screen Zoomable Image Lightbox */}
      <ImageViewerModal
        file={viewingImage}
        onClose={() => setViewingImage(null)}
        onToggleImportant={onToggleImportant}
        onToggleDone={onToggleDone}
      />

      {/* Full-Screen PDF Viewer */}
      <PdfViewerModal
        file={viewingPdf}
        onClose={() => setViewingPdf(null)}
        onToggleImportant={onToggleImportant}
        onToggleDone={onToggleDone}
      />

      {/* Upload Files Modal */}
      <UploadFilesModal
        isOpen={isUploadOpen}
        subjectId={subject.id}
        defaultCategory={activeTab === 'notes' ? 'notes' : activeTab === 'images' ? 'images' : 'pyq'}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={(newFiles) => {
          onAddFiles(newFiles);
          onShowToast(`Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''} to ${subject.name}!`, 'success');
        }}
      />

      {/* Rename File Modal */}
      <RenameFileModal
        isOpen={!!renamingFile}
        file={renamingFile}
        onClose={() => setRenamingFile(null)}
        onSave={(updated) => {
          onUpdateFile(updated);
          onShowToast('File updated.', 'success');
        }}
      />

      {/* Move File Modal */}
      <MoveFileModal
        isOpen={!!movingFile}
        file={movingFile}
        onClose={() => setMovingFile(null)}
        onMove={(fileId, newCat) => {
          onMoveFile(fileId, newCat);
          onShowToast('File moved to new section.', 'success');
        }}
      />

    </div>
  );
};
