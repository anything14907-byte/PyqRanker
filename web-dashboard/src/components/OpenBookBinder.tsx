import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  VideoResource, 
  PdfResource, 
  TopicMastery 
} from '../types';
import { 
  formatUnitDisplayName, 
  storageService, 
  extractYoutubeId,
  getExamUrgencyColor
} from '../utils/storageService';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  Layers, 
  Plus, 
  Video, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Play, 
  Flame, 
  X, 
  ChevronRight, 
  ArrowLeft, 
  StickyNote, 
  ExternalLink,
  Award,
  Trash2,
  Edit2,
  Paperclip,
  Check,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OpenBookBinderProps {
  subject: SubjectMeta;
  initialUnitId?: string;
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
  videos: VideoResource[];
  pdfs: PdfResource[];
  onToggleTopicCompleted: (topicId: string) => void;
  onSetTopicMastery: (topicId: string, mastery: TopicMastery) => void;
  onAddTopic: (topic: SyllabusTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onAddUnit?: (subjectId: string, unitLabel: string, unitTitle?: string) => void;
  onRenameUnit?: (subjectId: string, unitId: string, newLabel: string, newTitle?: string) => void;
  onDeleteUnit?: (subjectId: string, unitId: string) => void;
  onAddVideo: (video: VideoResource) => void;
  onToggleVideoWatched: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onAddPdf: (pdf: PdfResource) => void;
  onDeletePdf: (id: string) => void;
  onAddQuestion: (q: PYQQuestion) => void;
  onToggleQuestionMastered: (id: string) => void;
  onSaveQuestionAnswer: (id: string, answer: string, score: number) => void;
  onBackToShelf: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const OpenBookBinder: React.FC<OpenBookBinderProps> = ({
  subject,
  initialUnitId,
  topics,
  questions,
  videos,
  pdfs,
  onToggleTopicCompleted,
  onSetTopicMastery,
  onAddTopic,
  onDeleteTopic,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
  onAddVideo,
  onToggleVideoWatched,
  onDeleteVideo,
  onAddPdf,
  onDeletePdf,
  onAddQuestion,
  onToggleQuestionMastered,
  onSaveQuestionAnswer,
  onBackToShelf,
  onShowToast
}) => {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';

  const units = subject.units || [];
  
  // Selected chapter: 'all' or unit id
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    if (initialUnitId && initialUnitId !== 'all') {
      const found = units.find(u => u.id === initialUnitId);
      if (found) return found.id;
    }
    return units[0]?.id || 'all';
  });

  // Left Page View: 'checklist' | 'video' | 'pdf'
  const [leftPageView, setLeftPageView] = useState<'checklist' | 'video' | 'pdf'>('checklist');
  const [activeMediaItem, setActiveMediaItem] = useState<VideoResource | PdfResource | null>(null);

  // New item inline form states
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');

  const [activeAttachModal, setActiveAttachModal] = useState<'video' | 'pdf' | 'pyq' | null>(null);

  // Video attachment form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // PDF attachment form
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfTextSnippet, setPdfTextSnippet] = useState('');

  // PYQ attachment form
  const [pyqQuestionText, setPyqQuestionText] = useState('');
  const [pyqMarks, setPyqMarks] = useState<2 | 5 | 10>(10);
  const [pyqBullets, setPyqBullets] = useState('');

  // Chapter sticky note state (persisted to localStorage)
  const stickyStorageKey = `study_chapter_note_${subject.id}_${activeUnitId}`;
  const [chapterNote, setChapterNote] = useState<string>(() => {
    return localStorage.getItem(stickyStorageKey) || '';
  });

  useEffect(() => {
    setChapterNote(localStorage.getItem(stickyStorageKey) || '');
  }, [stickyStorageKey]);

  const handleSaveNote = (text: string) => {
    setChapterNote(text);
    localStorage.setItem(stickyStorageKey, text);
  };

  // Find active unit object and index
  const activeUnitIdx = units.findIndex(u => u.id === activeUnitId);
  const activeUnit = units[activeUnitIdx] || units[0];

  // Scoped topics for this subject
  const subjectTopics = useMemo(() => {
    return topics.filter(t => t.subjectId === subject.id);
  }, [topics, subject.id]);

  // Scoped topics for active chapter
  const chapterTopics = useMemo(() => {
    if (activeUnitId === 'all') return subjectTopics;
    return subjectTopics.filter(t => t.unitId === activeUnitId || String(t.unitNumber) === String(activeUnitIdx + 1));
  }, [subjectTopics, activeUnitId, activeUnitIdx]);

  // Scoped questions for active chapter
  const chapterQuestions = useMemo(() => {
    return questions.filter(q => {
      if (q.subjectId !== subject.id) return false;
      if (activeUnitId === 'all') return true;
      if (q.unitId && q.unitId === activeUnitId) return true;
      return q.unit === (activeUnitIdx + 1);
    });
  }, [questions, subject.id, activeUnitId, activeUnitIdx]);

  // Scoped videos for active chapter
  const chapterVideos = useMemo(() => {
    return videos.filter(v => {
      if (v.subjectId !== subject.id) return false;
      if (activeUnitId === 'all') return true;
      if (v.unitId && v.unitId === activeUnitId) return true;
      return v.unit === (activeUnitIdx + 1);
    });
  }, [videos, subject.id, activeUnitId, activeUnitIdx]);

  // Scoped PDFs for active chapter
  const chapterPdfs = useMemo(() => {
    return pdfs.filter(p => {
      if (p.subjectId !== subject.id) return false;
      if (activeUnitId === 'all') return true;
      if (p.unitId && p.unitId === activeUnitId) return true;
      return p.unit === (activeUnitIdx + 1);
    });
  }, [pdfs, subject.id, activeUnitId, activeUnitIdx]);

  // Chapter completion metrics
  const chapterCompleted = chapterTopics.filter(t => t.completed).length;
  const chapterProgress = chapterTopics.length > 0 ? Math.round((chapterCompleted / chapterTopics.length) * 100) : 0;

  // Days left recommendation
  const examUrgency = subject.examDate ? getExamUrgencyColor(subject.examDate) : null;
  const daysLeft = examUrgency?.days ?? 99;

  // Add new topic handler
  const handleAddNewTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTopic: SyllabusTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: subject.id,
      unitId: activeUnitId !== 'all' ? activeUnitId : (units[0]?.id || 'u1'),
      unitNumber: activeUnitIdx >= 0 ? activeUnitIdx + 1 : 1,
      unitLabel: activeUnit ? formatUnitDisplayName(activeUnit) : 'Chapter 1',
      title: newTopicTitle.trim(),
      completed: false,
      mastery: 'weak',
      createdAt: Date.now()
    };

    onAddTopic(newTopic);
    setNewTopicTitle('');
    setShowAddTopicInput(false);
    onShowToast('New chapter topic added! 📝', 'success');
  };

  // Add new chapter handler
  const handleAddNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    if (onAddUnit) {
      onAddUnit(subject.id, `Chapter ${units.length + 1}`, newUnitTitle.trim());
    } else {
      storageService.addUnit(subject.id, `Chapter ${units.length + 1}`, newUnitTitle.trim());
    }

    setNewUnitTitle('');
    setShowAddUnitInput(false);
    onShowToast('New Chapter created! 📖', 'success');
  };

  // Video attachment submission
  const handleAttachVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    const extractedId = extractYoutubeId(videoUrl);
    if (!extractedId) {
      onShowToast('Please enter a valid YouTube video URL', 'error');
      return;
    }

    const newVid: VideoResource = {
      id: `vid_${Date.now()}`,
      subjectId: subject.id,
      title: videoTitle.trim() || 'Lecture Video',
      youtubeUrl: videoUrl.trim(),
      videoId: extractedId,
      notes: '',
      isWatched: false,
      addedAt: Date.now(),
      unitId: activeUnitId !== 'all' ? activeUnitId : units[0]?.id,
      unit: activeUnitIdx >= 0 ? activeUnitIdx + 1 : 1
    };

    onAddVideo(newVid);
    setVideoTitle('');
    setVideoUrl('');
    setActiveAttachModal(null);
    onShowToast('Video attached to chapter! 🎬', 'success');
  };

  // PDF attachment submission
  const handleAttachPdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFileName.trim()) return;

    const newPdf: PdfResource = {
      id: `pdf_${Date.now()}`,
      subjectId: subject.id,
      fileName: pdfFileName.trim(),
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: '1.2 MB',
      extractedText: pdfTextSnippet.trim() || 'Document text extracted for chapter revision.',
      summary: 'Summary and key formula notes for this unit.',
      unitId: activeUnitId !== 'all' ? activeUnitId : units[0]?.id,
      unit: activeUnitIdx >= 0 ? activeUnitIdx + 1 : 1
    };

    onAddPdf(newPdf);
    setPdfFileName('');
    setPdfTextSnippet('');
    setActiveAttachModal(null);
    onShowToast('PDF dossier attached to chapter! 📄', 'success');
  };

  // PYQ attachment submission
  const handleAttachPyq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pyqQuestionText.trim()) return;

    const bulletsList = pyqBullets.split('\n').filter(b => b.trim().length > 0);

    const newQ: PYQQuestion = {
      id: `pyq_custom_${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      unit: activeUnitIdx >= 0 ? activeUnitIdx + 1 : 1,
      unitTitle: activeUnit ? activeUnit.title : 'Chapter Questions',
      unitLabel: activeUnit ? formatUnitDisplayName(activeUnit) : 'Chapter 1',
      unitId: activeUnitId !== 'all' ? activeUnitId : units[0]?.id,
      question: pyqQuestionText.trim(),
      marks: pyqMarks,
      yearsAsked: [new Date().getFullYear()],
      repeatCount: 1,
      isHighProbability: pyqMarks >= 10,
      expectedKeywords: [],
      bullets: bulletsList.length > 0 ? bulletsList : ['Core theoretical answer breakdown.'],
      diagramFormulaTip: 'Label all axes and key architectural components.',
      userStatus: 'not-started',
      isCustom: true
    };

    onAddQuestion(newQ);
    setPyqQuestionText('');
    setPyqBullets('');
    setActiveAttachModal(null);
    onShowToast('Exam question attached! 🔥', 'success');
  };

  // Colors for pages:
  // Night Mode: Warm Dark Espresso Parchment (#161920) with Cream-Ivory ink (#F3EFE6) and Brass-Gold (#E5B84B)
  // Day Mode: Realistic Warm Cream Book Paper (#FBF8F1) with fine horizontal ruled lines, vertical margin line, Deep Fountain-Pen Black Ink (#111318)
  const pageBg = isLight ? '#FBF8F1' : '#161920';
  const pageInk = isLight ? '#111318' : '#F3EFE6';
  const pageBorder = isLight ? '#E5DFD3' : '#2D3139';

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in select-none">
      
      {/* Top Binder Navigation Bar: Return to Shelf & Chapter Switchers */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
        <button
          type="button"
          onClick={onBackToShelf}
          className="px-3.5 py-1.5 rounded-xl border border-stone-400/40 dark:border-stone-700 bg-stone-200/80 dark:bg-stone-900/80 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Close Book (Return to Bookshelf Desk)</span>
        </button>

        {/* Die-cut Chapter Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveUnitId('all')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-mono font-bold border-t border-x transition-all shrink-0 ${
              activeUnitId === 'all'
                ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md font-extrabold translate-y-0.5'
                : 'bg-stone-300/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-700 hover:bg-stone-200'
            }`}
          >
            All Chapters ({subjectTopics.length})
          </button>

          {units.map((u, idx) => {
            const isSelected = activeUnitId === u.id;
            const uTopics = subjectTopics.filter(t => t.unitId === u.id || String(t.unitNumber) === String(idx + 1));
            const uDone = uTopics.filter(t => t.completed).length;

            return (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setActiveUnitId(u.id);
                  setLeftPageView('checklist');
                }}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-mono font-bold border-t border-x transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#FBF8F1] dark:bg-[#161920] text-amber-600 dark:text-amber-400 border-amber-500 font-extrabold translate-y-0.5 shadow-md'
                    : 'bg-stone-300/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>Ch {idx + 1}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({uDone}/{uTopics.length})
                </span>
              </button>
            );
          })}

          {/* + Add Chapter Tab */}
          <button
            type="button"
            onClick={() => setShowAddUnitInput(true)}
            className="px-2.5 py-1.5 rounded-t-lg text-xs font-mono font-bold border-t border-x border-dashed border-amber-600/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all shrink-0 flex items-center gap-1"
            title="Add a new chapter"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Inline Modal: Add Chapter */}
      {showAddUnitInput && (
        <form onSubmit={handleAddNewUnit} className="p-3 rounded-xl bg-stone-900 border border-amber-500/40 shadow-xl flex items-center gap-2 max-w-md">
          <input 
            type="text" 
            autoFocus
            placeholder="e.g. Chapter 5: Advanced Concurrency & Semaphores"
            value={newUnitTitle}
            onChange={(e) => setNewUnitTitle(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-amber-400"
          />
          <button 
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
          >
            Create
          </button>
          <button 
            type="button" 
            onClick={() => setShowAddUnitInput(false)}
            className="p-1 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* FULL-SCREEN 2-PAGE OPEN BOOK SPREAD BINDER */}
      <div 
        className="w-full rounded-2xl border shadow-2xl relative flex flex-col lg:flex-row overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: pageBg,
          borderColor: pageBorder,
          minHeight: '82vh',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* CENTER SPINE CREASE SHADOW (Between Left and Right Pages) */}
        <div 
          className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.18) 100%)'
          }}
        />

        {/* Center Metal Ring Binder Clips (Realistic 4-ring binder) */}
        <div className="hidden lg:flex flex-col justify-around items-center absolute top-12 bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative flex items-center justify-center">
              {/* Left hole */}
              <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-700 -mr-1 shadow-inner" />
              {/* Silver metallic ring arch */}
              <div 
                className="w-7 h-3 rounded-full border-t-2 border-x-2 border-stone-300 shadow-md"
                style={{
                  background: 'linear-gradient(to bottom, #E2E8F0, #94A3B8)'
                }}
              />
              {/* Right hole */}
              <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-700 -ml-1 shadow-inner" />
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* LEFT PAGE OF THE OPEN BOOK: Study Guide & Action Checklist */}
        {/* ======================================================== */}
        <section 
          aria-label="Chapter study guide and checklist"
          className="flex-1 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r relative overflow-y-auto"
          style={{
            color: pageInk,
            borderColor: pageBorder,
            backgroundImage: isLight 
              ? 'repeating-linear-gradient(transparent, transparent 31px, #E7E5E4 31px, #E7E5E4 32px)' 
              : 'none'
          }}
        >
          {/* Vertical Red Margin Line on Day Mode Paper */}
          {isLight && (
            <div className="absolute top-0 bottom-0 left-12 w-[1.5px] bg-red-400/40 pointer-events-none" />
          )}

          <div className="space-y-6 relative z-10">
            {/* Header: Editorial Chapter Badge & Title */}
            <div className="border-b pb-4" style={{ borderColor: pageBorder }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  {activeUnitId === 'all' ? 'SYLLABUS OVERVIEW' : `CHAPTER ${String(activeUnitIdx + 1).padStart(2, '0')}`}
                </span>
                <span className="text-xs font-mono font-bold opacity-75">
                  {chapterCompleted} / {chapterTopics.length} Completed ({chapterProgress}%)
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-extrabold mt-1 tracking-tight">
                {activeUnitId === 'all' ? 'All Units & Master Syllabus' : activeUnit.title}
              </h2>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-300 dark:bg-stone-800 mt-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${chapterProgress}%`,
                    background: 'linear-gradient(to right, #F59E0B, #10B981)'
                  }}
                />
              </div>

              {/* Smart Exam Countdown Recommendation */}
              <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  {daysLeft <= 5 
                    ? `⚠️ High urgency (${daysLeft}d left)! Prioritize Strong & Okay topics to guarantee max marks.`
                    : daysLeft <= 15
                    ? `📅 Approaching exam (${daysLeft}d left). Complete all Weak topics this week.`
                    : `💡 Steady study pace. Check off 2 topics daily to finish the chapter on time.`}
                </span>
              </div>
            </div>

            {/* CONDITIONAL LEFT VIEW 1: EMBEDDED MEDIA VIEWER (When video or PDF clicked on right page) */}
            {leftPageView !== 'checklist' && activeMediaItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setLeftPageView('checklist');
                      setActiveMediaItem(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-300 dark:bg-stone-800 hover:bg-stone-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>← Back to Chapter Checklist</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-500 uppercase">
                    {leftPageView === 'video' ? '🎬 Playing Video' : '📄 Reading Dossier'}
                  </span>
                </div>

                {leftPageView === 'video' ? (
                  <div className="space-y-3">
                    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-xl border border-stone-700 bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${(activeMediaItem as VideoResource).videoId}?autoplay=1`}
                        title={(activeMediaItem as VideoResource).title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-800/80 border text-xs space-y-1">
                      <h4 className="font-bold text-sm">{(activeMediaItem as VideoResource).title}</h4>
                      <p className="opacity-75">Take notes on the right page while watching your lecture.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 shadow-inner max-h-[55vh] overflow-y-auto font-serif text-sm leading-relaxed space-y-3">
                      <h4 className="font-bold text-base border-b pb-2">{(activeMediaItem as PdfResource).fileName}</h4>
                      <p className="whitespace-pre-wrap">{(activeMediaItem as PdfResource).extractedText}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CONDITIONAL LEFT VIEW 2: CHAPTER TOPICS & STUDY CHECKLIST */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                    Chapter Topics & Mastery Checklist ({chapterTopics.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddTopicInput(true)}
                    className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>
                </div>

                {/* Inline form to add topic */}
                {showAddTopicInput && (
                  <form onSubmit={handleAddNewTopic} className="p-3 rounded-xl bg-stone-200 dark:bg-stone-900 border border-amber-500/40 flex items-center gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="e.g. Critical Section Problem & Peterson's Algorithm"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-950 text-xs border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-amber-400"
                    />
                    <button 
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                    >
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddTopicInput(false)}
                      className="p-1 text-stone-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Topics list */}
                {chapterTopics.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60 italic border border-dashed rounded-xl">
                    No topics in this chapter yet. Click "+ Add Topic" above to begin your syllabus guide.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chapterTopics.map((topic, tIdx) => {
                      const isWeak = topic.mastery === 'weak';
                      const isOkay = topic.mastery === 'okay';
                      const isStrong = topic.mastery === 'strong';

                      return (
                        <div 
                          key={topic.id}
                          className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            topic.completed 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : 'bg-stone-200/50 dark:bg-stone-900/60 border-stone-300/80 dark:border-stone-800'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => onToggleTopicCompleted(topic.id)}
                              className="mt-0.5 text-stone-400 hover:text-emerald-500 transition-colors"
                              title={topic.completed ? 'Mark incomplete' : 'Mark completed'}
                            >
                              {topic.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div>
                              <span className={`text-xs font-semibold leading-snug ${topic.completed ? 'line-through opacity-70' : ''}`}>
                                {topic.title}
                              </span>
                              {activeUnitId === 'all' && (
                                <div className="text-[10px] font-mono opacity-60 mt-0.5">
                                  {topic.unitLabel || `Chapter ${topic.unitNumber || 1}`}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mastery Buttons: Weak / Okay / Strong */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onSetTopicMastery(topic.id, 'weak')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                isWeak ? 'bg-red-500 text-white shadow-xs' : 'bg-stone-300 dark:bg-stone-800 opacity-60 hover:opacity-100'
                              }`}
                              title="Mark as Weak"
                            >
                              Weak
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTopicMastery(topic.id, 'okay')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                isOkay ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-stone-300 dark:bg-stone-800 opacity-60 hover:opacity-100'
                              }`}
                              title="Mark as Okay"
                            >
                              Okay
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTopicMastery(topic.id, 'strong')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                isStrong ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-300 dark:bg-stone-800 opacity-60 hover:opacity-100'
                              }`}
                              title="Mark as Strong"
                            >
                              Strong
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteTopic(topic.id)}
                              className="p-1 text-stone-400 hover:text-red-500 transition-colors ml-1"
                              title="Delete topic"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Left Page Footer Stamp */}
          <div className="pt-6 border-t mt-8 flex items-center justify-between text-[11px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
            <span>Study OS • Academic Command Binder</span>
            <span>Page L • {activeUnit ? activeUnit.title : subject.name}</span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT PAGE OF THE OPEN BOOK: Attachments & Chapter Notes  */}
        {/* ======================================================== */}
        <section 
          aria-label="Chapter attachments and revision notes"
          className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative overflow-y-auto"
          style={{
            color: pageInk,
            borderColor: pageBorder,
            backgroundImage: isLight 
              ? 'repeating-linear-gradient(transparent, transparent 31px, #E7E5E4 31px, #E7E5E4 32px)' 
              : 'none'
          }}
        >
          {/* Vertical Red Margin Line on Day Mode Paper */}
          {isLight && (
            <div className="absolute top-0 bottom-0 left-12 w-[1.5px] bg-red-400/40 pointer-events-none" />
          )}

          <div className="space-y-6 relative z-10">
            {/* Action Bar: "+ Attach to This Chapter" */}
            <div className="border-b pb-4" style={{ borderColor: pageBorder }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  PHYSICAL CHAPTER ATTACHMENTS
                </span>
                <span className="text-xs font-mono font-bold opacity-75">
                  {chapterVideos.length + chapterPdfs.length + chapterQuestions.length} Attached
                </span>
              </div>

              {/* Attach action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAttachModal('video')}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-amber-500" />
                  <span>+ Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAttachModal('pdf')}
                  className="px-2.5 py-1.5 rounded-lg border border-cyan-600/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-500" />
                  <span>+ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAttachModal('pyq')}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-emerald-500" />
                  <span>+ PYQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('chapter-sticky-pad');
                    el?.focus();
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-500/40 bg-stone-500/10 hover:bg-stone-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Notes</span>
                </button>
              </div>
            </div>

            {/* Modal / Form: Attach Video */}
            {activeAttachModal === 'video' && (
              <form onSubmit={handleAttachVideo} className="p-4 rounded-xl bg-stone-900 text-white border border-amber-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4" /> Attach YouTube Video
                  </span>
                  <button type="button" onClick={() => setActiveAttachModal(null)} className="text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Video Title (e.g. Peterson's Algorithm Explained)" 
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-amber-400"
                />
                <input 
                  type="url" 
                  required
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-amber-400"
                />
                <button type="submit" className="w-full py-2 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400">
                  Clip to Chapter
                </button>
              </form>
            )}

            {/* Modal / Form: Attach PDF */}
            {activeAttachModal === 'pdf' && (
              <form onSubmit={handleAttachPdf} className="p-4 rounded-xl bg-stone-900 text-white border border-cyan-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Attach PDF Dossier
                  </span>
                  <button type="button" onClick={() => setActiveAttachModal(null)} className="text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="Document Name (e.g. Unit 3 Handout & Proofs.pdf)" 
                  value={pdfFileName}
                  onChange={(e) => setPdfFileName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-cyan-400"
                />
                <textarea 
                  rows={3}
                  placeholder="Summary or key text extracted from document..." 
                  value={pdfTextSnippet}
                  onChange={(e) => setPdfTextSnippet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-cyan-400"
                />
                <button type="submit" className="w-full py-2 rounded-lg bg-cyan-500 text-stone-950 font-bold text-xs hover:bg-cyan-400">
                  Paperclip Document
                </button>
              </form>
            )}

            {/* Modal / Form: Attach PYQ Question */}
            {activeAttachModal === 'pyq' && (
              <form onSubmit={handleAttachPyq} className="p-4 rounded-xl bg-stone-900 text-white border border-emerald-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" /> Add Past Exam Question
                  </span>
                  <button type="button" onClick={() => setActiveAttachModal(null)} className="text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  required
                  rows={2}
                  placeholder="Type the exam question..." 
                  value={pyqQuestionText}
                  onChange={(e) => setPyqQuestionText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-emerald-400"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-75">Weightage:</span>
                  {[2, 5, 10].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPyqMarks(m as any)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                        pyqMarks === m ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {m} Marks
                    </button>
                  ))}
                </div>
                <textarea 
                  rows={3}
                  placeholder="Model answer bullet points (one per line)..." 
                  value={pyqBullets}
                  onChange={(e) => setPyqBullets(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stone-950 text-white text-xs border border-stone-700 focus:outline-none focus:border-emerald-400"
                />
                <button type="submit" className="w-full py-2 rounded-lg bg-emerald-500 text-stone-950 font-bold text-xs hover:bg-emerald-400">
                  Stamp Question Card
                </button>
              </form>
            )}

            {/* 1. VIDEO ATTACHMENTS (Polaroid Cards with Paperclip) */}
            {chapterVideos.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Video Lectures ({chapterVideos.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chapterVideos.map(vid => (
                    <div 
                      key={vid.id}
                      className="p-3.5 rounded-xl border relative shadow-md bg-stone-100 dark:bg-stone-900/90 border-stone-300 dark:border-stone-800 flex flex-col justify-between gap-2"
                    >
                      {/* Paperclip Graphic on Corner */}
                      <div className="absolute -top-2.5 right-3 text-stone-400">
                        <Paperclip className="w-5 h-5 -rotate-45" />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold line-clamp-2 pr-4">{vid.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono opacity-70">
                          <span>YouTube ID: {vid.videoId}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-300 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMediaItem(vid);
                            setLeftPageView('video');
                          }}
                          className="px-2.5 py-1 rounded-md bg-amber-500 text-stone-950 hover:bg-amber-400 font-bold text-xs flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch on Left Page</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteVideo(vid.id)}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. PDF & DOCUMENT ATTACHMENTS (Dossier Cards with SVG Metallic Paperclip) */}
            {chapterPdfs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> PDF Dossiers ({chapterPdfs.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chapterPdfs.map(pdf => (
                    <div 
                      key={pdf.id}
                      className="p-3.5 rounded-xl border relative shadow-md bg-stone-100 dark:bg-stone-900/90 border-stone-300 dark:border-stone-800 flex flex-col justify-between gap-2"
                    >
                      <div className="absolute -top-2.5 right-3 text-cyan-500">
                        <Paperclip className="w-5 h-5 -rotate-45" />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold line-clamp-1 pr-4">{pdf.fileName}</h4>
                        <p className="text-[11px] opacity-75 line-clamp-2 mt-1">{pdf.summary || pdf.extractedText}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-300 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMediaItem(pdf);
                            setLeftPageView('pdf');
                          }}
                          className="px-2.5 py-1 rounded-md bg-cyan-500 text-stone-950 hover:bg-cyan-400 font-bold text-xs flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Read on Left Page</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeletePdf(pdf.id)}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PINNED STICKY NOTES & CHAPTER SUMMARY PAD */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Chapter Revision Notepad
              </span>
              <div 
                className="p-4 rounded-xl border shadow-inner relative"
                style={{
                  backgroundColor: isLight ? '#FFFBEB' : '#1C1917',
                  borderColor: isLight ? '#FDE68A' : '#44403C'
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mb-1">
                  <span>Auto-saved chapter notes</span>
                  <span>{chapterNote.length} characters</span>
                </div>
                <textarea
                  id="chapter-sticky-pad"
                  rows={4}
                  value={chapterNote}
                  onChange={(e) => handleSaveNote(e.target.value)}
                  placeholder="Type formulas, exam mnemonic tricks, and chapter revision notes here..."
                  className="w-full bg-transparent text-xs font-serif leading-relaxed resize-y focus:outline-none"
                  style={{ color: pageInk }}
                />
              </div>
            </div>

            {/* 4. STAMPED EXAM QUESTION CARDS (PYQs for this chapter) */}
            {chapterQuestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Stamped Exam PYQ Cards ({chapterQuestions.length})
                </span>
                <div className="space-y-3">
                  {chapterQuestions.map(q => {
                    const isMastered = q.userStatus === 'mastered';

                    return (
                      <div 
                        key={q.id}
                        className="p-4 rounded-xl border relative shadow-md bg-stone-100 dark:bg-stone-900/90 border-stone-300 dark:border-stone-800 space-y-2"
                      >
                        {/* Stamped Mark Weightage Badge */}
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-sm bg-red-900/80 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                            STAMPED • {q.marks} MARKS
                          </span>
                          {q.repeatCount > 1 && (
                            <span className="text-[10px] font-mono font-bold text-amber-500">
                              Asked {q.repeatCount}x in Exams
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold leading-snug">{q.question}</p>

                        {/* Model answer reveal */}
                        {q.bullets && q.bullets.length > 0 && (
                          <details className="text-xs pt-2 border-t border-stone-300 dark:border-stone-800">
                            <summary className="cursor-pointer font-bold text-amber-600 dark:text-amber-400 hover:underline">
                              Reveal Model Answer ({q.bullets.length} points)
                            </summary>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-xs opacity-90 pl-1 font-serif">
                              {q.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                            {q.diagramFormulaTip && (
                              <div className="mt-2 p-2 rounded bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-300">
                                💡 <strong>Tip:</strong> {q.diagramFormulaTip}
                              </div>
                            )}
                          </details>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              onToggleQuestionMastered(q.id);
                              if (!isMastered) {
                                confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
                                onShowToast('Mastered exam question! 🔥', 'success');
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                              isMastered 
                                ? 'bg-emerald-500 text-white font-extrabold' 
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Page Footer Stamp */}
          <div className="pt-6 border-t mt-8 flex items-center justify-between text-[11px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
            <span>Page R • Chapter Attachments Dossier</span>
            <span>Study OS • 60fps Architectural Engine</span>
          </div>
        </section>
      </div>
    </div>
  );
};
