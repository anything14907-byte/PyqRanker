import React, { useState, useMemo } from 'react';
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
import { getBookClothColor } from '../utils/bookColors';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Plus, 
  Video, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Play, 
  Flame, 
  X, 
  StickyNote, 
  Trash2, 
  Check, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Bookmark
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
  onDeleteUnit,
  onAddVideo,
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
  const cloth = getBookClothColor(subject.accentColor);

  const units = subject.units || [];

  // Active Chapter Selection ('all' or specific unitId)
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    if (initialUnitId && initialUnitId !== 'all') {
      const found = units.find(u => u.id === initialUnitId);
      if (found) return found.id;
    }
    return units[0]?.id || 'all';
  });

  // Inline forms & player toggles
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');

  // Inline quick inputs per chapter
  const [addTopicUnitId, setAddTopicUnitId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  const [addVideoUnitId, setAddVideoUnitId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [addPdfUnitId, setAddPdfUnitId] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfTextSnippet, setPdfTextSnippet] = useState('');

  const [addPyqUnitId, setAddPyqUnitId] = useState<string | null>(null);
  const [pyqQuestionText, setPyqQuestionText] = useState('');
  const [pyqMarks, setPyqMarks] = useState<2 | 5 | 10>(10);
  const [pyqBullets, setPyqBullets] = useState('');

  // Active inline video player
  const [inlineVideoId, setInlineVideoId] = useState<string | null>(null);

  // Active expanded topic notes
  const [expandedTopicNoteId, setExpandedTopicNoteId] = useState<string | null>(null);
  const [topicNoteDraft, setTopicNoteDraft] = useState<{ [id: string]: string }>({});

  // Active expanded PDF reader
  const [expandedPdfId, setExpandedPdfId] = useState<string | null>(null);

  // Active practice answer expander
  const [practicePyqId, setPracticePyqId] = useState<string | null>(null);
  const [practiceAnswerDraft, setPracticeAnswerDraft] = useState<{ [id: string]: string }>({});

  // Scoped data for this subject
  const subjectTopics = useMemo(() => topics.filter(t => t.subjectId === subject.id), [topics, subject.id]);
  const subjectQuestions = useMemo(() => questions.filter(q => q.subjectId === subject.id), [questions, subject.id]);
  const subjectVideos = useMemo(() => videos.filter(v => v.subjectId === subject.id), [videos, subject.id]);
  const subjectPdfs = useMemo(() => pdfs.filter(p => p.subjectId === subject.id), [pdfs, subject.id]);

  // Exam urgency
  const examUrgency = subject.examDate ? getExamUrgencyColor(subject.examDate) : null;

  // Handlers
  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    if (onAddUnit) {
      onAddUnit(subject.id, `Chapter ${units.length + 1}`, newUnitTitle.trim());
    } else {
      storageService.addUnit(subject.id, `Chapter ${units.length + 1}`, newUnitTitle.trim());
    }

    setNewUnitTitle('');
    setShowAddUnitInput(false);
    onShowToast('New Chapter added to textbook index! 📖', 'success');
  };

  const handleCreateTopic = (unitId: string, unitIndex: number) => {
    if (!newTopicTitle.trim()) return;

    const newTopic: SyllabusTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: subject.id,
      unitId,
      unitNumber: unitIndex + 1,
      unitLabel: `Chapter ${unitIndex + 1}`,
      title: newTopicTitle.trim(),
      completed: false,
      mastery: 'weak',
      createdAt: Date.now()
    };

    onAddTopic(newTopic);
    setNewTopicTitle('');
    setAddTopicUnitId(null);
    onShowToast('Topic added to chapter! 📝', 'success');
  };

  const handleCreateVideo = (unitId: string, unitIndex: number) => {
    if (!videoUrl.trim()) return;
    const extractedId = extractYoutubeId(videoUrl);
    if (!extractedId) {
      onShowToast('Please enter a valid YouTube video link', 'error');
      return;
    }

    const newVid: VideoResource = {
      id: `vid_${Date.now()}`,
      subjectId: subject.id,
      title: videoTitle.trim() || 'Video Lecture Reference',
      youtubeUrl: videoUrl.trim(),
      videoId: extractedId,
      notes: '',
      isWatched: false,
      addedAt: Date.now(),
      unitId,
      unit: unitIndex + 1
    };

    onAddVideo(newVid);
    setVideoTitle('');
    setVideoUrl('');
    setAddVideoUnitId(null);
    onShowToast('Video lecture attached to chapter! 🎬', 'success');
  };

  const handleCreatePdf = (unitId: string, unitIndex: number) => {
    if (!pdfFileName.trim()) return;

    const newPdf: PdfResource = {
      id: `pdf_${Date.now()}`,
      subjectId: subject.id,
      fileName: pdfFileName.trim(),
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: '1.2 MB',
      extractedText: pdfTextSnippet.trim() || 'Chapter summary text & notes.',
      summary: 'Dossier summary for this unit.',
      unitId,
      unit: unitIndex + 1
    };

    onAddPdf(newPdf);
    setPdfFileName('');
    setPdfTextSnippet('');
    setAddPdfUnitId(null);
    onShowToast('PDF dossier attached to chapter! 📄', 'success');
  };

  const handleCreatePyq = (unitId: string, unitIndex: number) => {
    if (!pyqQuestionText.trim()) return;

    const bulletsList = pyqBullets.split('\n').filter(b => b.trim().length > 0);

    const newQ: PYQQuestion = {
      id: `pyq_custom_${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      unit: unitIndex + 1,
      unitTitle: units[unitIndex]?.title || 'Chapter Questions',
      unitLabel: `Chapter ${unitIndex + 1}`,
      unitId,
      question: pyqQuestionText.trim(),
      marks: pyqMarks,
      yearsAsked: [new Date().getFullYear()],
      repeatCount: 1,
      isHighProbability: pyqMarks >= 10,
      expectedKeywords: [],
      bullets: bulletsList.length > 0 ? bulletsList : ['Core answer breakdown.'],
      diagramFormulaTip: 'Label all key architectural components.',
      userStatus: 'not-started',
      isCustom: true
    };

    onAddQuestion(newQ);
    setPyqQuestionText('');
    setPyqBullets('');
    setAddPyqUnitId(null);
    onShowToast('Past exam question added! 🔥', 'success');
  };

  const displayedUnits = useMemo(() => {
    if (activeUnitId === 'all') return units;
    return units.filter(u => u.id === activeUnitId);
  }, [units, activeUnitId]);

  // Page Colors
  const pageBg = isLight ? '#FAF6EE' : '#151821';
  const pageInk = isLight ? '#111318' : '#F4EFE6';
  const pageBorder = isLight ? '#E3DCD0' : '#2A2E39';

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in select-none">
      
      {/* Top Controls: Close Book & Chapter Jump Pills */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
        <button
          type="button"
          onClick={onBackToShelf}
          className="px-3.5 py-1.5 rounded-xl border border-stone-400/50 dark:border-stone-700 bg-stone-200/90 dark:bg-stone-900/90 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Close Book (Return to Bookshelf)</span>
        </button>

        {/* Chapter Quick Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveUnitId('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
              activeUnitId === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
            }`}
          >
            All Chapters ({units.length})
          </button>

          {units.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setActiveUnitId(u.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                activeUnitId === u.id
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              Ch {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          GRAND PHOTOREALISTIC 2-PAGE OPEN TEXTBOOK SPREAD
          Outer 10px hardcover binding rim + 400 stacked paper edges + center spine crease
          ========================================================================= */}
      <div 
        className="w-full rounded-2xl relative shadow-2xl transition-all duration-300 overflow-hidden"
        style={{
          padding: '10px',
          backgroundColor: cloth.hex,
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Real Open Paper Spread Container */}
        <div 
          className="w-full rounded-xl flex flex-col lg:flex-row relative overflow-hidden"
          style={{
            backgroundColor: pageBg,
            minHeight: '82vh',
            boxShadow: isLight
              ? 'inset 3px 0 0 #E6E0D4, inset -3px 0 0 #E6E0D4, inset 4px 0 0 #BDB5A6, inset -4px 0 0 #BDB5A6'
              : 'inset 3px 0 0 #2A2E39, inset -3px 0 0 #2A2E39, inset 4px 0 0 #1A1D24, inset -4px 0 0 #1A1D24'
          }}
        >
          {/* REALISTIC CENTER SPINE GUTTER CREASE SHADOW */}
          <div 
            className="hidden lg:block absolute top-0 bottom-0 left-[360px] xl:left-[380px] w-12 z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 25%, transparent 60%)'
            }}
          />

          {/* =========================================================================
              LEFT PAGE: TABLE OF CONTENTS & MASTER INDEX (340px–380px Column)
              ========================================================================= */}
          <aside 
            aria-label="Table of contents and master index"
            className="w-full lg:w-[360px] xl:w-[380px] shrink-0 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r flex flex-col justify-between overflow-y-auto"
            style={{
              color: pageInk,
              borderColor: pageBorder
            }}
          >
            <div className="space-y-6">
              {/* Running Header */}
              <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 border-b pb-2" style={{ borderColor: pageBorder }}>
                <span>TABLE OF CONTENTS</span>
                <span>{subject.code || 'VOLUME 01'}</span>
              </div>

              {/* Master Index Title with Double Rule */}
              <div className="space-y-1">
                <h2 className="text-xl font-serif font-black tracking-tight">
                  CONTENTS & SYLLABUS INDEX
                </h2>
                <div className="border-t-2 border-b border-stone-400/50 dark:border-stone-700 h-1 my-1" />
                <p className="text-[11px] font-serif opacity-75 italic leading-relaxed">
                  Click any chapter below to review syllabus topics, video lectures, and exam questions.
                </p>
              </div>

              {/* Chapter Index List with Dotted Leaders */}
              <div className="space-y-4">
                {units.map((unit, idx) => {
                  const isSelected = activeUnitId === unit.id;
                  const uTopics = subjectTopics.filter(t => t.unitId === unit.id || String(t.unitNumber) === String(idx + 1));
                  const uDone = uTopics.filter(t => t.completed).length;
                  const uVids = subjectVideos.filter(v => v.unitId === unit.id || v.unit === (idx + 1)).length;
                  const uPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === (idx + 1)).length;
                  const uPyqs = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === (idx + 1)).length;

                  return (
                    <div 
                      key={unit.id}
                      onClick={() => setActiveUnitId(unit.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : 'border-transparent hover:border-stone-300 dark:hover:border-stone-800'
                      }`}
                    >
                      {/* Bold Chapter Title with Dotted Leaders leading to Done Count */}
                      <div className="flex items-baseline justify-between gap-1 text-sm">
                        <span className="font-extrabold tracking-tight text-amber-600 dark:text-amber-400 shrink-0">
                          CHAPTER {String(idx + 1).padStart(2, '0')}:
                        </span>
                        <div className="flex-1 mx-1 border-b border-dotted border-stone-400/60 dark:border-stone-600" />
                        <span className="font-mono text-xs font-bold shrink-0 opacity-90">
                          {uDone}/{uTopics.length} Done
                        </span>
                      </div>

                      {/* Chapter Full Name */}
                      <div className="font-serif text-xs font-bold leading-snug mt-1 pl-1">
                        {unit.title}
                      </div>

                      {/* Indented Sub-counts of Topics & Attachments */}
                      <div className="flex items-center gap-2 mt-2 pl-2 text-[10px] font-mono opacity-70">
                        <span>• {uTopics.length} Topics</span>
                        <span>• {uVids} Vids</span>
                        <span>• {uPdfs} PDFs</span>
                        <span>• {uPyqs} PYQs</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + Add New Chapter (Unit) */}
              {showAddUnitInput ? (
                <form onSubmit={handleCreateUnit} className="p-3 rounded-xl bg-stone-200 dark:bg-stone-900 border border-amber-500/50 space-y-2">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Chapter Title (e.g. Memory Management)"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                  />
                  <div className="flex items-center gap-2">
                    <button type="submit" className="flex-1 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs">
                      Add Chapter
                    </button>
                    <button type="button" onClick={() => setShowAddUnitInput(false)} className="p-1 text-stone-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddUnitInput(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Chapter (Unit)</span>
                </button>
              )}
            </div>

            {/* Left Page Footer */}
            <div className="pt-6 border-t mt-8 flex items-center justify-between text-[10px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
              <span>Study OS • Master Index</span>
              <span>Page I</span>
            </div>
          </aside>

          {/* =========================================================================
              RIGHT PAGE: WIDE TEXTBOOK VIEW (BOLD CHAPTERS WITH ALL PARTS NESTED BELOW)
              ========================================================================= */}
          <main 
            aria-label="Chapter contents, syllabus topics, and attachments"
            className="flex-1 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto"
            style={{
              color: pageInk,
              borderColor: pageBorder
            }}
          >
            <div className="space-y-12">
              {/* Running Header */}
              <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 border-b pb-2" style={{ borderColor: pageBorder }}>
                <span>{subject.name}</span>
                <span>
                  EXAM: {examUrgency?.formattedExamDate || 'NO DATE'} • PAGE {activeUnitId === 'all' ? '1–ALL' : '1'}
                </span>
              </div>

              {/* RENDER EACH CHAPTER IN BOLD TEXTBOOK HIERARCHY */}
              {displayedUnits.map((unit, unitIdx) => {
                const uIndex = units.findIndex(u => u.id === unit.id);
                const uNumber = String(uIndex + 1).padStart(2, '0');

                // Filter nested items for this specific chapter
                const cTopics = subjectTopics.filter(t => t.unitId === unit.id || String(t.unitNumber) === String(uIndex + 1));
                const cVids = subjectVideos.filter(v => v.unitId === unit.id || v.unit === (uIndex + 1));
                const cPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === (uIndex + 1));
                const cPyqs = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === (uIndex + 1));

                return (
                  <section key={unit.id} className="space-y-8 pb-10 border-b last:border-b-0" style={{ borderColor: pageBorder }}>
                    
                    {/* BOLD CHAPTER HEADING WITH SOLID BOOK-RULE UNDERLINE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                          CHAPTER {uNumber}
                        </span>
                        <span className="text-xs font-mono font-bold opacity-75">
                          {cTopics.filter(t => t.completed).length} / {cTopics.length} Topics Mastered
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
                        {unit.title}
                      </h2>
                      {/* Solid Book-Rule Underline */}
                      <div className="h-[2px] bg-stone-900 dark:bg-stone-100 opacity-80" />
                    </div>

                    {/* -----------------------------------------------------------------
                        A. SYLLABUS TOPICS & SUBTOPICS (Index Lines with Dotted Leaders)
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">
                          A. Syllabus Topics & Subtopics ({cTopics.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddTopicUnitId(addTopicUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Topic</span>
                        </button>
                      </div>

                      {/* Topic rows with dotted leader lines */}
                      <div className="space-y-2 pl-2">
                        {cTopics.map((topic, tIdx) => {
                          const isWeak = topic.mastery === 'weak';
                          const isOkay = topic.mastery === 'okay';
                          const isStrong = topic.mastery === 'strong';
                          const isNoteOpen = expandedTopicNoteId === topic.id;

                          return (
                            <div key={topic.id} className="space-y-1">
                              <div className="flex items-baseline justify-between gap-2 text-xs py-1 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 rounded px-1.5 transition-colors">
                                {/* Checkbox + Topic Title */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onToggleTopicCompleted(topic.id)}
                                    className="text-stone-400 hover:text-emerald-500 transition-colors"
                                  >
                                    {topic.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <span className={`font-serif font-bold ${topic.completed ? 'line-through opacity-60' : ''}`}>
                                    {tIdx + 1}. {topic.title}
                                  </span>
                                </div>

                                {/* Dotted Leader Lines */}
                                <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600" />

                                {/* Controls: Weak / Okay / Strong + Note Expander + Delete */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onSetTopicMastery(topic.id, 'weak')}
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                      isWeak ? 'bg-red-500 text-white' : 'opacity-50 hover:opacity-100'
                                    }`}
                                  >
                                    Weak
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSetTopicMastery(topic.id, 'okay')}
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                      isOkay ? 'bg-amber-500 text-stone-950 font-bold' : 'opacity-50 hover:opacity-100'
                                    }`}
                                  >
                                    Okay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSetTopicMastery(topic.id, 'strong')}
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                      isStrong ? 'bg-emerald-500 text-white' : 'opacity-50 hover:opacity-100'
                                    }`}
                                  >
                                    Strong
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedTopicNoteId(isNoteOpen ? null : topic.id)}
                                    className="p-1 text-stone-400 hover:text-amber-500 text-[11px]"
                                    title="Quick Note"
                                  >
                                    <StickyNote className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteTopic(topic.id)}
                                    className="p-1 text-stone-400 hover:text-red-500"
                                    title="Delete topic"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Inline Quick Note Expander */}
                              {isNoteOpen && (
                                <div className="pl-8 pr-2 py-2">
                                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-serif space-y-2">
                                    <div className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                                      Revision Notes for: {topic.title}
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={topicNoteDraft[topic.id] ?? topic.notes ?? ''}
                                      onChange={(e) => setTopicNoteDraft({ ...topicNoteDraft, [topic.id]: e.target.value })}
                                      placeholder="Type mnemonic, formula, or quick reminder..."
                                      className="w-full bg-white dark:bg-stone-950 p-2 rounded border border-stone-300 dark:border-stone-700 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Add Topic under this Chapter */}
                      {addTopicUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 flex items-center gap-2">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Type new topic title for this chapter..." 
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateTopic(unit.id, uIndex)}
                            className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                          >
                            Add
                          </button>
                          <button type="button" onClick={() => setAddTopicUnitId(null)} className="p-1 text-stone-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* -----------------------------------------------------------------
                        B. ATTACHED VIDEO LECTURES (Textbook Reference Rows + Watch Inline)
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>B. Video Lectures ({cVids.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddVideoUnitId(addVideoUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Video Link</span>
                        </button>
                      </div>

                      {/* Video Reference Rows */}
                      <div className="space-y-2 pl-2">
                        {cVids.map(vid => {
                          const isPlaying = inlineVideoId === vid.id;

                          return (
                            <div key={vid.id} className="space-y-2">
                              <div className="flex items-baseline justify-between gap-2 text-xs py-1 px-1.5 rounded bg-stone-200/30 dark:bg-stone-900/40 border border-stone-300/50 dark:border-stone-800">
                                <span className="font-serif font-bold">
                                  🎬 {vid.title}
                                </span>
                                <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600" />
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setInlineVideoId(isPlaying ? null : vid.id)}
                                    className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>{isPlaying ? 'Close Player' : 'Watch Inline'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteVideo(vid.id)}
                                    className="p-1 text-stone-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Embedded YouTube Player right below the line */}
                              {isPlaying && (
                                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-xl border border-stone-700 bg-black animate-fade-in">
                                  <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${vid.videoId}?autoplay=1`}
                                    title={vid.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Add Video */}
                      {addVideoUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 space-y-2">
                          <input 
                            type="text" 
                            placeholder="Video Title (e.g. Peterson's Algorithm Explained)" 
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="url" 
                              placeholder="YouTube Link: https://www.youtube.com/watch?v=..." 
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                            />
                            <button
                              type="button"
                              onClick={() => handleCreateVideo(unit.id, uIndex)}
                              className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                            >
                              Attach
                            </button>
                            <button type="button" onClick={() => setAddVideoUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -----------------------------------------------------------------
                        C. ATTACHED PDFS & CHAPTER NOTES
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>C. PDFs & Revision Notes ({cPdfs.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddPdfUnitId(addPdfUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach PDF / Note</span>
                        </button>
                      </div>

                      {/* PDF Rows */}
                      <div className="space-y-2 pl-2">
                        {cPdfs.map(pdf => {
                          const isExpanded = expandedPdfId === pdf.id;

                          return (
                            <div key={pdf.id} className="space-y-2">
                              <div className="flex items-baseline justify-between gap-2 text-xs py-1 px-1.5 rounded bg-stone-200/30 dark:bg-stone-900/40 border border-stone-300/50 dark:border-stone-800">
                                <span className="font-serif font-bold">
                                  📄 {pdf.fileName}
                                </span>
                                <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600" />
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedPdfId(isExpanded ? null : pdf.id)}
                                    className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold text-[10px]"
                                  >
                                    {isExpanded ? 'Close Reader' : 'Read Inline'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeletePdf(pdf.id)}
                                    className="p-1 text-stone-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-800 shadow-inner font-serif text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                                  {pdf.extractedText || pdf.summary}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Attach PDF */}
                      {addPdfUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 space-y-2">
                          <input 
                            type="text" 
                            placeholder="Document / Note Name (e.g. Unit 2 Handout.pdf)" 
                            value={pdfFileName}
                            onChange={(e) => setPdfFileName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <textarea 
                            rows={2}
                            placeholder="Type summary or paste chapter revision notes..." 
                            value={pdfTextSnippet}
                            onChange={(e) => setPdfTextSnippet(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreatePdf(unit.id, uIndex)}
                              className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                            >
                              Attach Note / PDF
                            </button>
                            <button type="button" onClick={() => setAddPdfUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -----------------------------------------------------------------
                        D. PAST EXAM QUESTIONS / PYQS FOR THIS CHAPTER
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>D. Past Exam Questions ({cPyqs.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddPyqUnitId(addPyqUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Exam Question</span>
                        </button>
                      </div>

                      {/* Stamped Exam Questions */}
                      <div className="space-y-3 pl-2">
                        {cPyqs.map(q => {
                          const isMastered = q.userStatus === 'mastered';
                          const isPracticeOpen = practicePyqId === q.id;

                          return (
                            <div key={q.id} className="p-3.5 rounded-xl border bg-stone-100/60 dark:bg-stone-900/60 border-stone-300 dark:border-stone-800 space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="px-1.5 py-0.2 rounded bg-red-950/80 text-white font-extrabold uppercase">
                                  {q.marks} MARKS
                                </span>
                                {q.repeatCount > 1 && (
                                  <span className="font-bold text-amber-500">
                                    Asked {q.repeatCount}x in University Exams
                                  </span>
                                )}
                              </div>

                              <p className="font-serif text-xs font-bold leading-snug">
                                {q.question}
                              </p>

                              {/* Details: Model Answer Reveal */}
                              {q.bullets && q.bullets.length > 0 && (
                                <details className="text-xs pt-1 border-t border-stone-300/60 dark:border-stone-800">
                                  <summary className="cursor-pointer font-bold text-amber-600 dark:text-amber-400 hover:underline">
                                    Show Model Answer ({q.bullets.length} points)
                                  </summary>
                                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs pl-2 font-serif opacity-90">
                                    {q.bullets.map((b, bIdx) => (
                                      <li key={bIdx}>{b}</li>
                                    ))}
                                  </ul>
                                </details>
                              )}

                              {/* Practice Answer Box */}
                              {isPracticeOpen && (
                                <div className="pt-2 space-y-2">
                                  <textarea
                                    rows={3}
                                    placeholder="Write your practice answer here..."
                                    value={practiceAnswerDraft[q.id] ?? q.lastAttemptAnswer ?? ''}
                                    onChange={(e) => setPracticeAnswerDraft({ ...practiceAnswerDraft, [q.id]: e.target.value })}
                                    className="w-full text-xs p-2 rounded bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const ans = practiceAnswerDraft[q.id] ?? '';
                                      onSaveQuestionAnswer(q.id, ans, 8);
                                      setPracticePyqId(null);
                                      onShowToast('Practice answer saved! ✍️', 'success');
                                    }}
                                    className="px-3 py-1 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-[10px] font-bold"
                                  >
                                    Save Answer
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setPracticePyqId(isPracticeOpen ? null : q.id)}
                                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:underline"
                                >
                                  ✍️ Practice Answer
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleQuestionMastered(q.id);
                                    if (!isMastered) {
                                      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                                      onShowToast('Exam question mastered! 🔥', 'success');
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                    isMastered 
                                      ? 'bg-emerald-500 text-white font-extrabold' 
                                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Add PYQ */}
                      {addPyqUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 space-y-2">
                          <textarea 
                            rows={2}
                            placeholder="Type university exam question..." 
                            value={pyqQuestionText}
                            onChange={(e) => setPyqQuestionText(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-75">Marks:</span>
                            {[2, 5, 10].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setPyqMarks(m as any)}
                                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                  pyqMarks === m ? 'bg-emerald-500 text-white' : 'bg-stone-300 dark:bg-stone-800'
                                }`}
                              >
                                {m}M
                              </button>
                            ))}
                          </div>
                          <textarea 
                            rows={2}
                            placeholder="Model answer bullet points (one per line)..." 
                            value={pyqBullets}
                            onChange={(e) => setPyqBullets(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreatePyq(unit.id, uIndex)}
                              className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                            >
                              Add PYQ
                            </button>
                            <button type="button" onClick={() => setAddPyqUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </section>
                );
              })}
            </div>

            {/* Right Page Footer */}
            <div className="pt-6 border-t mt-12 flex items-center justify-between text-[10px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
              <span>Study OS • Academic Textbook Reader</span>
              <span>Volume End</span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
