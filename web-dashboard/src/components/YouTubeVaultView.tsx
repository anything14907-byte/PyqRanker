import React, { useState, useEffect } from 'react';
import { SubjectMeta, VideoResource, PdfResource } from '../types';
import { extractYoutubeId, storageService } from '../utils/storageService';
import { YouTubeIframePlayer } from './YouTubeIframePlayer';
import { 
  Video, 
  Play, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Clock, 
  X,
  Tv,
  FileText,
  FolderOpen,
  Eye,
  Upload,
  Zap
} from 'lucide-react';
import { uploadAndProcessPdfFile } from '../utils/pdfStorageService';

interface YouTubeVaultViewProps {
  subjects: SubjectMeta[];
  activeSubjectId: string;
  videos: VideoResource[];
  pdfs?: PdfResource[];
  isViewActive?: boolean;
  onAddVideo: (video: VideoResource) => void;
  onUpdateVideoNotes: (id: string, notes: string) => void;
  onToggleVideoWatched: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onAddPdf?: (pdf: PdfResource) => void;
  onDeletePdf?: (id: string) => void;
  onUpdatePdf?: (pdf: PdfResource) => void;
  onOpenPdfInReader?: (pdf: PdfResource) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const YouTubeVaultView: React.FC<YouTubeVaultViewProps> = ({
  subjects,
  activeSubjectId,
  videos,
  pdfs = [],
  isViewActive = true,
  onAddVideo,
  onUpdateVideoNotes,
  onToggleVideoWatched,
  onDeleteVideo,
  onAddPdf,
  onDeletePdf,
  onUpdatePdf,
  onOpenPdfInReader,
  onShowToast
}) => {
  const [vaultTab, setVaultTab] = useState<'videos' | 'pdfs'>('videos');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [activePlayingId, setActivePlayingId] = useState<string>(() => {
    const saved = storageService.getVaultActiveVideoId();
    if (saved && videos.some(v => v.id === saved || v.videoId === saved)) {
      return saved;
    }
    return videos[0]?.id || '';
  });
  const [seekTimestampSeconds, setSeekTimestampSeconds] = useState<number | null>(null);

  // Add video modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(activeSubjectId || subjects[0]?.id || 'os');
  const [videoTitle, setVideoTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [unitNum, setUnitNum] = useState(1);
  const [initialNotes, setInitialNotes] = useState('');

  // Keep activePlayingId valid if videos change
  useEffect(() => {
    if (videos.length > 0) {
      const exists = videos.some(v => v.id === activePlayingId || v.videoId === activePlayingId);
      if (!exists) {
        const saved = storageService.getVaultActiveVideoId();
        if (saved && videos.some(v => v.id === saved || v.videoId === saved)) {
          setActivePlayingId(saved);
        } else {
          setActivePlayingId(videos[0].id);
        }
      }
    }
  }, [videos, activePlayingId]);

  // Synchronize activePlayingId with localStorage
  const handleSelectVideo = (id: string) => {
    setActivePlayingId(id);
    storageService.setVaultActiveVideoId(id);
    setSeekTimestampSeconds(null);
  };

  const filteredVideos = videos.filter(v => {
    if (selectedSubjectId !== 'all' && v.subjectId !== selectedSubjectId) return false;
    return true;
  });

  const activeVideo = videos.find(v => v.id === activePlayingId || v.videoId === activePlayingId) || videos[0];
  const activeSub = subjects.find(s => s.id === activeVideo?.subjectId);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !youtubeUrl.trim()) return;

    const ytid = extractYoutubeId(youtubeUrl.trim());
    if (!ytid) {
      onShowToast('Please enter a valid YouTube link (e.g. youtube.com or youtu.be)', 'error');
      return;
    }

    const newVid: VideoResource = {
      id: `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId,
      unit: Number(unitNum) || 1,
      unitId: `u${unitNum}`,
      title: videoTitle.trim(),
      youtubeUrl: youtubeUrl.trim(),
      videoId: ytid,
      notes: initialNotes.trim(),
      isWatched: false,
      addedAt: Date.now()
    };

    onAddVideo(newVid);
    handleSelectVideo(newVid.id);
    setVideoTitle('');
    setYoutubeUrl('');
    setInitialNotes('');
    setIsAddOpen(false);
    onShowToast('Video lecture saved to YouTube Vault! 🎬', 'success');
  };

  // Convert mm:ss or hh:mm:ss to seconds
  const parseTimestamp = (ts: string): number => {
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    return 0;
  };

  const handleTimestampClick = (vidId: string, timestampStr: string) => {
    const seconds = parseTimestamp(timestampStr);
    handleSelectVideo(vidId);
    setSeekTimestampSeconds(seconds);
    onShowToast(`Jumping to ${timestampStr} in player...`, 'info');
  };

  // Render notes with clickable timestamps
  const renderNotesWithClickableTimestamps = (vid: VideoResource) => {
    const notesText = vid.notes || '';
    if (!notesText.trim()) {
      return <span className="italic text-paper-muted dark:text-night-muted">No notes yet. Add timestamps like 02:30 below.</span>;
    }

    const regex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(notesText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(notesText.substring(lastIndex, match.index));
      }
      const timeStr = match[1];
      parts.push(
        <button
          key={`${vid.id}-${match.index}`}
          onClick={() => handleTimestampClick(vid.id, timeStr)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px] transition-colors"
          title={`Click to jump to ${timeStr}`}
        >
          <Play className="w-2.5 h-2.5 fill-current" />
          <span>{timeStr}</span>
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < notesText.length) {
      parts.push(notesText.substring(lastIndex));
    }

    return parts;
  };

  const insertTimestampIntoNotes = (vid: VideoResource) => {
    const sample = vid.notes ? `${vid.notes}\n02:15 - Key exam formula` : '02:15 - Key exam formula';
    onUpdateVideoNotes(vid.id, sample);
    onShowToast('Added sample timestamp to notes! Click it to test seeking.', 'info');
  };

  const handleVaultPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const targetSub = selectedSubjectId !== 'all' ? selectedSubjectId : (subjects[0]?.id || 'os');
      const { pdfResource } = await uploadAndProcessPdfFile(
        file,
        targetSub,
        undefined,
        undefined,
        subjects.find(s => s.id === targetSub)?.name
      );
      if (onAddPdf) {
        onAddPdf(pdfResource);
      }
      onShowToast(`Uploaded and permanently stored "${file.name}" in IndexedDB! 📄`, 'success');
    } catch (err) {
      console.error('Error uploading PDF in vault:', err);
      onShowToast('Could not upload PDF.', 'error');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Filtered PDFs for PDF tab
  const filteredPdfs = selectedSubjectId === 'all'
    ? pdfs
    : pdfs.filter(p => p.subjectId === selectedSubjectId);

  const unassignedVaultPdfs = filteredPdfs.filter(p => {
    const sub = subjects.find(s => s.id === p.subjectId);
    return !p.unitId || !sub?.units?.some(u => u.id === p.unitId || u.unit === p.unit);
  });

  return (
    <div className="space-y-6 animate-fade-slide-up pb-16">
      
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-paper-ink dark:text-night-text flex items-center gap-2">
              <Video className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <span>Academic Resource Vault</span>
            </h2>
          </div>
          <p className="text-xs text-paper-muted dark:text-night-muted">
            All your video lectures, timestamps, paperclipped PDFs, and chapter revision dossiers in one unified vault.
          </p>
        </div>

        {/* Tab Switcher & Quick Upload */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-stone-300 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setVaultTab('videos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                vaultTab === 'videos'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-extrabold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-950'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos ({videos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setVaultTab('pdfs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                vaultTab === 'pdfs'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-extrabold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Chapter PDFs ({pdfs.length})</span>
            </button>
          </div>

          {vaultTab === 'videos' ? (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center gap-1.5 btn-tactile shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Video</span>
            </button>
          ) : (
            <label className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer btn-tactile shadow-sm active:scale-95">
              <Upload className="w-4 h-4" />
              <span>{isUploadingPdf ? 'Storing...' : '+ Upload PDF'}</span>
              <input 
                type="file" 
                accept=".pdf,application/pdf" 
                onChange={handleVaultPdfUpload}
                disabled={isUploadingPdf}
                className="hidden" 
              />
            </label>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 2: CHAPTER PDFS & REVISION DOSSIERS VAULT
          ========================================================================= */}
      {vaultTab === 'pdfs' && (
        <div className="space-y-6">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all shrink-0 ${
                selectedSubjectId === 'all'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-extrabold shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent hover:border-stone-400'
              }`}
            >
              All Subjects ({pdfs.length})
            </button>
            {subjects.map(s => {
              const count = pdfs.filter(p => p.subjectId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedSubjectId === s.id
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-extrabold shadow-sm'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent hover:border-stone-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.accentColor }} />
                  <span>{s.name} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* 📂 Prominent Unassigned PDFs Tray */}
          {unassignedVaultPdfs.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>📂 Uploaded Subject PDFs (Assign to a Chapter) ({unassignedVaultPdfs.length})</span>
                </span>
                <span className="text-[11px] font-mono opacity-70">
                  Select a chapter below to place document under its bold heading
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unassignedVaultPdfs.map(pdf => {
                  const sub = subjects.find(s => s.id === pdf.subjectId);
                  return (
                    <div 
                      key={pdf.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="text-xs sm:text-sm font-bold font-serif line-clamp-1">
                          📄 {pdf.fileName}
                        </div>
                        <div className="text-[11px] font-mono opacity-60">
                          {sub?.name || pdf.subjectId} • {pdf.fileSize} • Uploaded {pdf.uploadDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenPdfInReader && (
                          <button
                            type="button"
                            onClick={() => onOpenPdfInReader(pdf)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </button>
                        )}

                        {/* 📌 Move to Chapter Dropdown */}
                        <select
                          onChange={(e) => {
                            if (e.target.value && onUpdatePdf) {
                              const targetUnit = sub?.units?.find(u => u.id === e.target.value);
                              onUpdatePdf({
                                ...pdf,
                                unitId: e.target.value,
                                unit: targetUnit?.unit
                              });
                              onShowToast(`Assigned "${pdf.fileName}" to ${targetUnit?.title || 'Chapter'}! 📌`, 'success');
                            }
                          }}
                          defaultValue=""
                          className="text-xs font-mono font-bold px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                        >
                          <option value="" disabled>📌 Move to Chapter ▾</option>
                          {sub?.units?.map((u, i) => (
                            <option key={u.id} value={u.id}>
                              Ch {i + 1}: {u.title.slice(0, 20)}...
                            </option>
                          ))}
                        </select>

                        {onDeletePdf && (
                          <button
                            type="button"
                            onClick={() => onDeletePdf(pdf.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500"
                            title="Delete PDF"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Filtered PDFs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPdfs.map(pdf => {
              const sub = subjects.find(s => s.id === pdf.subjectId);
              const unit = sub?.units?.find(u => u.id === pdf.unitId || u.unit === pdf.unit);

              return (
                <div 
                  key={pdf.id}
                  className="p-4 sm:p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border hover:border-amber-500/50 shadow-sm transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-paper-ink dark:text-night-text line-clamp-1">
                            {pdf.fileName}
                          </h4>
                          <span className="text-[10px] font-mono opacity-60">
                            {sub?.name || pdf.subjectId} • {unit ? unit.title : 'Unassigned to Chapter'}
                          </span>
                        </div>
                      </div>

                      {onDeletePdf && (
                        <button
                          type="button"
                          onClick={() => onDeletePdf(pdf.id)}
                          className="p-1 text-stone-400 hover:text-red-500"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 bg-stone-100 dark:bg-stone-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 font-serif">
                      {pdf.summary || pdf.extractedText || 'Chapter notes & syllabus concepts extracted from PDF.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    {/* 📌 Move to Chapter Dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value && onUpdatePdf) {
                          const targetUnit = sub?.units?.find(u => u.id === e.target.value);
                          onUpdatePdf({
                            ...pdf,
                            unitId: e.target.value,
                            unit: targetUnit?.unit
                          });
                          onShowToast(`Moved "${pdf.fileName}" to ${targetUnit?.title || 'Chapter'}! 📌`, 'success');
                        }
                      }}
                      value={pdf.unitId || ''}
                      className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                    >
                      <option value="" disabled>📌 Move to Chapter ▾</option>
                      {sub?.units?.map((u, i) => (
                        <option key={u.id} value={u.id}>
                          Ch {i + 1}: {u.title.slice(0, 16)}...
                        </option>
                      ))}
                    </select>

                    {onOpenPdfInReader && (
                      <button
                        type="button"
                        onClick={() => onOpenPdfInReader(pdf)}
                        className="px-3 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1 active:scale-95 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read in Book</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPdfs.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border text-paper-muted space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-50 text-amber-500" />
              <h4 className="text-sm font-bold text-paper-ink dark:text-night-text">No PDFs uploaded in this subject yet</h4>
              <p className="text-xs">Upload lecture notes, textbook chapters, or university past papers to start reading.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 1: VIDEO LECTURES VAULT
          ========================================================================= */}
      {vaultTab === 'videos' && (
        <>

      {/* 1. DEDICATED ACTIVE PLAYER THEATRE (Created once, never destroyed by timers or list redraws) */}
      {activeVideo && (
        <div 
          className="p-4 sm:p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-4"
          style={{ borderTop: `4px solid ${activeSub?.accentColor || '#06B6D4'}` }}
        >
          {/* Active Video Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
                  style={{ backgroundColor: `${activeSub?.accentColor || '#06B6D4'}18`, color: activeSub?.accentColor || '#06B6D4' }}
                >
                  {activeSub?.name || activeVideo.subjectId} • Unit {activeVideo.unit || 1}
                </span>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-mono flex items-center gap-1">
                  <Tv className="w-3 h-3" />
                  <span>Now Playing</span>
                </span>

                {/* Watched Toggle Badge */}
                <button
                  onClick={() => onToggleVideoWatched(activeVideo.id)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                    activeVideo.isWatched
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted dark:text-night-muted border border-paper-border dark:border-night-border'
                  }`}
                >
                  {activeVideo.isWatched ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  <span>{activeVideo.isWatched ? 'Watched' : 'To Watch'}</span>
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-paper-ink dark:text-night-text truncate">
                {activeVideo.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border text-xs font-semibold text-paper-body dark:text-night-text hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 btn-tactile"
                title="Open in YouTube App for background playback"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 50% Left / 50% Right Widescreen Split Layout */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left 50%: Embedded YouTube Video Player */}
            <div className="w-full space-y-3">
              <YouTubeIframePlayer
                videoId={activeVideo.videoId}
                videoItemId={activeVideo.id}
                videoTitle={activeVideo.title}
                youtubeUrl={activeVideo.youtubeUrl}
                isWatched={activeVideo.isWatched}
                isViewActive={isViewActive}
                seekTimestampSeconds={seekTimestampSeconds}
                onClearSeek={() => setSeekTimestampSeconds(null)}
                onToggleWatched={() => onToggleVideoWatched(activeVideo.id)}
                onShowToast={onShowToast}
              />
            </div>

            {/* Right 50%: Timestamps, Notes & Key Takeaways */}
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
                <span className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Lecture Timestamps & Study Notes</span>
                </span>
                <button
                  onClick={() => insertTimestampIntoNotes(activeVideo)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold hover:bg-cyan-600/20 btn-tactile"
                >
                  + Add Timestamp
                </button>
              </div>

              <div className="text-xs text-paper-body dark:text-night-text leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                {renderNotesWithClickableTimestamps(activeVideo)}
              </div>

              <div className="pt-2 border-t border-paper-border dark:border-night-border">
                <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted uppercase tracking-wider mb-1">
                  Add / Edit Notes & Timestamps (e.g. 05:20 Key formula)
                </label>
                <textarea
                  rows={4}
                  placeholder="Type formulas, notes, or timestamps like 03:45..."
                  value={activeVideo.notes || ''}
                  onChange={e => onUpdateVideoNotes(activeVideo.id, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VAULT LIBRARY FILTER BAR */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-paper-ink dark:text-night-text">
            Saved Vault Lectures ({filteredVideos.length})
          </h3>
          <span className="text-[11px] text-paper-muted dark:text-night-muted">
            Click any lecture to load in the player
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-paper-border dark:border-night-border max-w-full">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold btn-tactile whitespace-nowrap ${
              selectedSubjectId === 'all'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-body dark:text-night-text'
            }`}
          >
            All Subjects ({videos.length})
          </button>

          {subjects.map(s => {
            const isSelected = s.id === selectedSubjectId;
            const count = videos.filter(v => v.subjectId === s.id).length;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 btn-tactile whitespace-nowrap ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-body dark:text-night-text'
                }`}
                style={{ backgroundColor: isSelected ? s.accentColor : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : s.accentColor }} />
                <span>{s.name}</span>
                <span className="opacity-75 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. VAULT VIDEO CARDS GRID (Redrawn separately from the persistent player) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVideos.map(vid => {
          const sub = subjects.find(s => s.id === vid.subjectId);
          const isCurrentlyActive = (activeVideo?.id === vid.id);

          return (
            <div 
              key={vid.id}
              className={`p-5 sm:p-6 rounded-3xl bg-paper-card dark:bg-night-card border transition-all space-y-4 flex flex-col justify-between ${
                isCurrentlyActive
                  ? 'border-cyan-500/70 shadow-md ring-2 ring-cyan-500/20'
                  : 'border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card'
              }`}
              style={{ borderTop: `4px solid ${sub?.accentColor || '#06B6D4'}` }}
            >
              <div className="space-y-3">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
                        style={{ backgroundColor: `${sub?.accentColor || '#06B6D4'}18`, color: sub?.accentColor || '#06B6D4' }}
                      >
                        {sub?.name || vid.subjectId} • Unit {vid.unit || 1}
                      </span>

                      {isCurrentlyActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono">
                          ▶ In Player
                        </span>
                      )}

                      {/* Watched Toggle Badge */}
                      <button
                        onClick={() => onToggleVideoWatched(vid.id)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                          vid.isWatched
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted dark:text-night-muted border border-paper-border dark:border-night-border'
                        }`}
                      >
                        {vid.isWatched ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        <span>{vid.isWatched ? 'Watched' : 'To Watch'}</span>
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-paper-ink dark:text-night-text line-clamp-1">
                      {vid.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={vid.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-paper-muted hover:text-cyan-600 dark:text-night-muted dark:hover:text-cyan-400"
                      title="Open in YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onDeleteVideo(vid.id)}
                      className="p-1.5 rounded-lg text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Video Card Thumbnail (Clicking switches the active player to this video) */}
                <div 
                  onClick={() => handleSelectVideo(vid.id)}
                  className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xs relative cursor-pointer group"
                >
                  <img 
                    src={`https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`} 
                    alt={vid.title}
                    className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-opacity"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-13 h-13 rounded-2xl bg-cyan-600/90 group-hover:bg-cyan-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>
                  {isCurrentlyActive && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black text-cyan-400 font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>Loaded in Player</span>
                    </div>
                  )}
                </div>

                {/* Clickable Timestamps Preview & Notes */}
                <div className="p-3 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Timestamps & Notes:</span>
                    </span>
                    <button
                      onClick={() => insertTimestampIntoNotes(vid)}
                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline btn-tactile"
                    >
                      + Add 02:15 Stamp
                    </button>
                  </div>

                  <div className="text-xs text-paper-body dark:text-night-text leading-relaxed whitespace-pre-wrap">
                    {renderNotesWithClickableTimestamps(vid)}
                  </div>
                </div>
              </div>

              {/* Notes Input Box */}
              <div>
                <textarea
                  rows={2}
                  placeholder="Type formulas, notes, or timestamps like 03:45..."
                  value={vid.notes || ''}
                  onChange={e => onUpdateVideoNotes(vid.id, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border text-paper-muted space-y-2">
          <Video className="w-8 h-8 mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-paper-ink dark:text-night-text">No lectures saved in this subject</h4>
          <p className="text-xs">Click "+ Add YouTube Lecture" above to save crash courses or revision videos.</p>
        </div>
      )}
      </>
      )}

      {/* ADD LECTURE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-slide-up">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text shadow-2xl relative space-y-4">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text btn-tactile"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-paper-ink dark:text-night-text flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Add YouTube Lecture to Vault</span>
              </h3>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Save full lectures or topic tutorials with clickable timestamps.
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-paper-muted dark:text-night-muted mb-1">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-paper-muted dark:text-night-muted mb-1">
                    Lecture Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Process Synchronization & Deadlocks"
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-paper-muted dark:text-night-muted mb-1">
                    Unit No.
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={unitNum}
                    onChange={e => setUnitNum(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-paper-muted dark:text-night-muted mb-1">
                  YouTube URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-paper-muted dark:text-night-muted mb-1">
                  Initial Timestamp Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 02:15 - Semaphore theory&#10;14:30 - Peterson solution code"
                  value={initialNotes}
                  onChange={e => setInitialNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono text-paper-ink dark:text-night-text focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-xs font-bold text-paper-muted hover:text-paper-ink dark:hover:text-night-text btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold btn-tactile shadow-sm"
                >
                  + Save Lecture to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
