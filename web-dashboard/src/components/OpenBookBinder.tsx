import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  VideoResource, 
  PdfResource, 
  TopicMastery,
  Flashcard,
  SubjectUnit
} from '../types';
import { 
  formatUnitDisplayName, 
  extractYoutubeId, 
  getExamUrgencyColor, 
  storageService 
} from '../utils/storageService';
import { getBookClothColor } from '../utils/bookColors';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Play, 
  Trash2, 
  Edit3, 
  ExternalLink,
  FileText,
  Flame,
  Sparkles,
  Clock,
  ArrowLeft,
  HelpCircle,
  X,
  ChevronDown,
  Zap,
  Upload,
  Eye,
  RefreshCw,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Check,
  Target,
  Maximize2,
  Minimize2,
  Columns,
  FileUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  uploadAndProcessPdfFile, 
  getPdfArrayBuffer, 
  renderPdfPageToCanvas, 
  extractTextFromPdfBuffer, 
  generateExamNotesAndPYQs 
} from '../utils/pdfStorageService';

interface OpenBookBinderProps {
  subject: SubjectMeta;
  initialUnitId?: string;
  initialPdfId?: string;
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
  onUpdatePdf?: (pdf: PdfResource) => void;
  onDeletePdf: (id: string) => void;
  onAddQuestion: (q: PYQQuestion) => void;
  onToggleQuestionMastered: (id: string) => void;
  onSaveQuestionAnswer: (id: string, answer: string, score: number) => void;
  onAddFlashcard?: (card: Flashcard) => void;
  onBackToShelf: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const OpenBookBinder: React.FC<OpenBookBinderProps> = ({
  subject,
  initialUnitId,
  initialPdfId,
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
  onUpdatePdf,
  onDeletePdf,
  onAddQuestion,
  onToggleQuestionMastered,
  onSaveQuestionAnswer,
  onAddFlashcard,
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

  // Weak Topics Crunch Mode Toggle
  const [isWeakOnly, setIsWeakOnly] = useState<boolean>(false);

  // Split-Page Left PDF Reader State
  const [readingPdf, setReadingPdf] = useState<PdfResource | null>(null);
  const [readingPdfBuffer, setReadingPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfPageNum, setPdfPageNum] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1.0);
  const [pdfMode, setPdfMode] = useState<'canvas' | 'native' | 'text'>('canvas');
  const [selectedPdfText, setSelectedPdfText] = useState<string>('');
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfPageTexts, setPdfPageTexts] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Wide Split & Full Screen Controls
  const [isWideSplit, setIsWideSplit] = useState<boolean>(true);
  const [isFullScreenPdf, setIsFullScreenPdf] = useState<boolean>(false);
  const [showFullScreenNotes, setShowFullScreenNotes] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const fullScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [newFullScreenNoteText, setNewFullScreenNoteText] = useState<string>('');

  // Handle initialPdfId if routed from Vault or another screen
  useEffect(() => {
    if (initialPdfId) {
      const found = pdfs.find(p => p.id === initialPdfId);
      if (found) {
        setReadingPdf(found);
        setIsWideSplit(true);
        if (found.unitId) {
          setActiveUnitId(found.unitId);
        }
      }
    }
  }, [initialPdfId, pdfs]);

  // Object URL for native browser PDF mode
  useEffect(() => {
    if (readingPdfBuffer) {
      const blob = new Blob([readingPdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (readingPdf?.dataUrl && readingPdf.dataUrl.startsWith('data:application/pdf')) {
      setPdfBlobUrl(readingPdf.dataUrl);
    } else {
      setPdfBlobUrl(null);
    }
  }, [readingPdfBuffer, readingPdf?.dataUrl]);

  // Full Screen Cinema PDF Canvas Render
  useEffect(() => {
    if (!isFullScreenPdf || !readingPdfBuffer || pdfMode !== 'canvas' || !fullScreenCanvasRef.current) return;
    renderPdfPageToCanvas(readingPdfBuffer, pdfPageNum, fullScreenCanvasRef.current, pdfScale)
      .then(res => {
        setPdfTotalPages(res.totalPages);
      })
      .catch(err => {
        console.warn('Full screen canvas render error, falling back to text:', err);
        setPdfMode('text');
      });
  }, [isFullScreenPdf, readingPdfBuffer, pdfPageNum, pdfScale, pdfMode]);

  // Escape key listener to close Full Screen PDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenPdf) {
        setIsFullScreenPdf(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenPdf]);

  // Quick 2-Minute Chapter Quiz State
  const [activeQuizUnitId, setActiveQuizUnitId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<PYQQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizShowAnswer, setQuizShowAnswer] = useState<boolean>(false);

  // File Upload State for attaching PDFs
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [uploadTargetUnitId, setUploadTargetUnitId] = useState<string | null>(null);

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

  // Active practice answer expander
  const [practicePyqId, setPracticePyqId] = useState<string | null>(null);
  const [practiceAnswerDraft, setPracticeAnswerDraft] = useState<{ [id: string]: string }>({});

  // Scoped data for this subject
  const subjectTopics = useMemo(() => topics.filter(t => t.subjectId === subject.id), [topics, subject.id]);
  const subjectQuestions = useMemo(() => questions.filter(q => q.subjectId === subject.id), [questions, subject.id]);
  const subjectVideos = useMemo(() => videos.filter(v => v.subjectId === subject.id), [videos, subject.id]);
  const subjectPdfs = useMemo(() => pdfs.filter(p => p.subjectId === subject.id), [pdfs, subject.id]);

  // Unassigned PDFs belonging to this subject but not linked to any current chapter
  const unassignedPdfs = useMemo(() => {
    return subjectPdfs.filter(p => !p.unitId || !units.some(u => u.id === p.unitId || u.unit === p.unit));
  }, [subjectPdfs, units]);

  // Exam urgency
  const examUrgency = subject.examDate ? getExamUrgencyColor(subject.examDate) : null;

  // Load PDF Binary buffer when readingPdf is selected
  useEffect(() => {
    if (!readingPdf) {
      setReadingPdfBuffer(null);
      return;
    }
    let isMounted = true;
    setIsPdfLoading(true);
    setPdfPageNum(readingPdf.lastReadPage || 1);

    getPdfArrayBuffer(readingPdf.id, readingPdf.dataUrl).then(async (buf) => {
      if (!isMounted) return;
      if (buf) {
        setReadingPdfBuffer(buf);
        const { numPages, pageTexts } = await extractTextFromPdfBuffer(buf);
        if (!isMounted) return;
        setPdfTotalPages(numPages);
        setPdfPageTexts(pageTexts);
      } else {
        // Fallback: If no binary, split extracted text into virtual pages
        const raw = readingPdf.extractedText || readingPdf.summary || '';
        const pages = raw.split(/--- Page \d+ ---/).filter(Boolean);
        setPdfPageTexts(pages.length > 0 ? pages : [raw]);
        setPdfTotalPages(pages.length > 0 ? pages.length : 1);
        setPdfMode('text');
      }
      setIsPdfLoading(false);
    }).catch(err => {
      console.warn('Error loading PDF buffer:', err);
      if (isMounted) {
        setIsPdfLoading(false);
        setPdfMode('text');
      }
    });

    return () => { isMounted = false; };
  }, [readingPdf?.id]);

  // Render to canvas when page or scale changes
  useEffect(() => {
    if (!readingPdfBuffer || pdfMode !== 'canvas' || !canvasRef.current) return;
    renderPdfPageToCanvas(readingPdfBuffer, pdfPageNum, canvasRef.current, pdfScale)
      .then(res => {
        setPdfTotalPages(res.totalPages);
      })
      .catch(err => {
        console.warn('Canvas render notice, falling back to text view:', err);
        setPdfMode('text');
      });
  }, [readingPdfBuffer, pdfPageNum, pdfScale, pdfMode]);

  // Handle text selection in Left Reader Page
  const handleReaderTextSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length >= 6) {
      setSelectedPdfText(sel);
    }
  };

  // 1-Click: Highlight to Chapter Note
  const handleAddSelectionToNotes = (targetUnitId?: string) => {
    const uId = targetUnitId || readingPdf?.unitId || units[0]?.id;
    if (!selectedPdfText || !uId) return;

    const newTopic: SyllabusTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subjectId: subject.id,
      unitId: uId,
      title: selectedPdfText.slice(0, 50) + (selectedPdfText.length > 50 ? '...' : ''),
      notes: selectedPdfText,
      completed: false,
      mastery: 'okay',
      createdAt: Date.now()
    };
    onAddTopic(newTopic);
    setSelectedPdfText('');
    onShowToast('Highlight added as Chapter Note! 📝', 'success');
  };

  // 1-Click: Highlight to Flashcard
  const handleAddSelectionToFlashcard = (targetUnitId?: string) => {
    const uId = targetUnitId || readingPdf?.unitId || units[0]?.id;
    if (!selectedPdfText || !onAddFlashcard) return;

    const card: Flashcard = {
      id: `fc_${Date.now()}`,
      subjectId: subject.id,
      unitId: uId,
      front: `Core Concept from ${readingPdf?.fileName || 'Document'}`,
      back: selectedPdfText,
      intervalStep: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    onAddFlashcard(card);
    setSelectedPdfText('');
    onShowToast('Flashcard created from highlight! 🃏', 'success');
  };

  // 1-Click: Highlight to Important Exam Question
  const handleAddSelectionToPyq = (targetUnitId?: string) => {
    const uId = targetUnitId || readingPdf?.unitId || units[0]?.id;
    const uIndex = units.findIndex(u => u.id === uId);
    if (!selectedPdfText || !uId) return;

    const newQ: PYQQuestion = {
      id: `pyq_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      subjectId: subject.id,
      subjectName: subject.name,
      unit: uIndex >= 0 ? uIndex + 1 : 1,
      unitTitle: units[uIndex]?.title || 'Chapter Topic',
      unitId: uId,
      question: `Explain the significance, mechanism, and exam application of: "${selectedPdfText.slice(0, 75)}"`,
      marks: 5,
      yearsAsked: [new Date().getFullYear()],
      repeatCount: 2,
      isHighProbability: true,
      expectedKeywords: ['Significance', 'Mechanism', 'Application'],
      bullets: [selectedPdfText],
      diagramFormulaTip: 'Illustrate core principle with standard diagram.',
      userStatus: 'not-started',
      isCustom: true
    };
    onAddQuestion(newQ);
    setSelectedPdfText('');
    onShowToast('Saved as 5-Mark Exam Question! 🔥', 'success');
  };

  // 1-Click: ⚡ Auto-Extract Chapter Summary & Exam Questions from PDF
  const handleExtractPdfNotesAndPyqs = (pdf: PdfResource, targetUnitId: string, unitIndex: number) => {
    const raw = pdf.extractedText || pdf.summary || '';
    const { summaryPoints, predictedQuestions } = generateExamNotesAndPYQs(
      raw,
      subject.name,
      units[unitIndex]?.title || 'Chapter'
    );

    // 1. Add 5 bullet point topics/notes
    summaryPoints.forEach((point, pIdx) => {
      onAddTopic({
        id: `topic_pdf_${Date.now()}_${pIdx}`,
        subjectId: subject.id,
        unitId: targetUnitId,
        unitNumber: unitIndex + 1,
        title: point.slice(0, 55) + (point.length > 55 ? '...' : ''),
        notes: point,
        completed: false,
        mastery: 'weak',
        createdAt: Date.now() + pIdx
      });
    });

    // 2. Add 3 predicted PYQs
    predictedQuestions.forEach(pq => {
      onAddQuestion({
        ...pq,
        subjectId: subject.id,
        subjectName: subject.name,
        unit: unitIndex + 1,
        unitId: targetUnitId,
        unitTitle: units[unitIndex]?.title || 'Chapter'
      });
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    onShowToast(`Extracted 5 Exam Notes and 3 Predicted PYQs for Chapter ${unitIndex + 1}! ⚡`, 'success');
  };

  // 1-Click: 📌 Move PDF to Chapter
  const handleMovePdfToChapter = (pdf: PdfResource, targetUnitId: string) => {
    const targetUnit = units.find(u => u.id === targetUnitId);
    const updatedPdf: PdfResource = {
      ...pdf,
      unitId: targetUnitId,
      unit: targetUnit?.unit
    };
    if (onUpdatePdf) {
      onUpdatePdf(updatedPdf);
    } else {
      onDeletePdf(pdf.id);
      onAddPdf(updatedPdf);
    }
    onShowToast(`Moved "${pdf.fileName}" to ${targetUnit?.title || 'Chapter'}! 📌`, 'success');
  };

  // 1-Click: 🔄 Re-attach PDF File
  const handleReattachPdfFile = async (e: React.ChangeEvent<HTMLInputElement>, pdf: PdfResource) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { pdfResource } = await uploadAndProcessPdfFile(
        file,
        subject.id,
        pdf.unitId,
        pdf.unit,
        subject.name
      );
      const updated: PdfResource = {
        ...pdfResource,
        id: pdf.id,
        unitId: pdf.unitId,
        unit: pdf.unit
      };
      if (onUpdatePdf) {
        onUpdatePdf(updated);
      } else {
        onAddPdf(updated);
      }
      setReadingPdf(updated);
      onShowToast(`Re-attached file "${file.name}"! 📄`, 'success');
    } catch (err) {
      console.error('Error re-attaching file:', err);
      onShowToast('Could not re-attach file.', 'error');
    }
  };

  // Real File Upload Handler (Permanent IndexedDB Storage)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetUnitId?: string, unitIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const { pdfResource, predictedQuestions } = await uploadAndProcessPdfFile(
        file,
        subject.id,
        targetUnitId,
        unitIndex !== undefined ? unitIndex + 1 : undefined,
        subject.name
      );

      onAddPdf(pdfResource);

      // Auto-add predicted questions if unitId is provided
      if (targetUnitId) {
        predictedQuestions.forEach(pq => {
          onAddQuestion({
            ...pq,
            unitId: targetUnitId,
            unit: unitIndex !== undefined ? unitIndex + 1 : 1
          });
        });
      }

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      onShowToast(`Uploaded and permanently stored "${file.name}" in IndexedDB! 💾`, 'success');
      setAddPdfUnitId(null);
    } catch (err) {
      console.error('Error uploading PDF:', err);
      onShowToast('Could not upload PDF file.', 'error');
    } finally {
      setIsUploadingPdf(false);
      setUploadTargetUnitId(null);
    }
  };

  // Quick 2-Minute Chapter Quiz Handler
  const handleStartChapterQuiz = (unit: SubjectUnit, unitTopics: SyllabusTopic[], unitQuestions: PYQQuestion[]) => {
    const qPool: PYQQuestion[] = [...unitQuestions];
    if (qPool.length < 3) {
      unitTopics.forEach(t => {
        if (qPool.length < 3) {
          qPool.push({
            id: `quiz-${t.id}`,
            subjectId: subject.id,
            subjectName: subject.name,
            unit: unit.unit || 1,
            unitTitle: unit.title,
            question: `Explain the fundamental concept, definition, and importance of "${t.title}".`,
            marks: 2,
            yearsAsked: [new Date().getFullYear()],
            repeatCount: 1,
            isHighProbability: false,
            expectedKeywords: [t.title],
            bullets: [t.notes || `Review standard textbook definitions for ${t.title}.`],
            diagramFormulaTip: 'State formula if applicable.',
            userStatus: 'not-started'
          });
        }
      });
    }

    if (qPool.length === 0) {
      onShowToast('Add at least 1 topic or question to quiz this chapter.', 'info');
      return;
    }

    setActiveQuizUnitId(unit.id);
    setQuizQuestions(qPool.slice(0, 3));
    setQuizIndex(0);
    setQuizShowAnswer(false);
  };

  const handleSelfGradeQuiz = (mastery: TopicMastery) => {
    const currentQ = quizQuestions[quizIndex];
    if (currentQ && currentQ.topicId) {
      onSetTopicMastery(currentQ.topicId, mastery);
    }
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
      setQuizShowAnswer(false);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onShowToast('2-Minute Chapter Quiz Completed! Mastery updated. 🎯', 'success');
      setActiveQuizUnitId(null);
    }
  };

  // Chapter Creation
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
      
      {/* Top Controls: Close Book, Chapter Jump Pills & Focus Crunch Mode */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
        <button
          type="button"
          onClick={onBackToShelf}
          className="px-3.5 py-1.5 rounded-xl border border-stone-400/50 dark:border-stone-700 bg-stone-200/90 dark:bg-stone-900/90 hover:bg-stone-300 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Close Book (Return to Bookshelf)</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
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
            {units.map((u, i) => (
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
                Ch {i + 1}
              </button>
            ))}
          </div>

          {/* 🎯 "Focus: Weak Topics Only" Crunch Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsWeakOnly(!isWeakOnly);
              onShowToast(isWeakOnly ? 'Showing all chapter items' : 'Exam Crunch: Showing only weak topics & pending items! 🎯', 'info');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0 ${
              isWeakOnly 
                ? 'bg-amber-500 text-stone-950 font-black shadow-md ring-2 ring-amber-400' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-500 border border-transparent'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isWeakOnly ? '🎯 Weak & Pending Active' : '🎯 Weak Only'}</span>
          </button>
        </div>
      </div>

      {/* Crunch Mode Banner */}
      {isWeakOnly && (
        <div className="w-full px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>⚡ Exam-Crunch Filter Active: Showing only topics marked "Weak", unread Chapter PDFs, and unmastered PYQs.</span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsWeakOnly(false)}
            className="underline text-[11px] hover:text-amber-500"
          >
            Show All
          </button>
        </div>
      )}

      {/* =========================================================================
          THE PHOTOREALISTIC OPEN BOOK SPREAD (DUAL ARCHIVAL BOOK PAGES)
          ========================================================================= */}
      <div 
        className="w-full rounded-[22px] p-2.5 sm:p-3 relative shadow-2xl transition-all"
        style={{
          backgroundColor: cloth.hex,
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.65), 0 10px 20px -5px rgba(0,0,0,0.3)'
        }}
      >
        <div 
          className="w-full min-h-[82vh] rounded-[16px] flex flex-col lg:flex-row overflow-hidden relative"
          style={{
            backgroundColor: pageBg,
            boxShadow: `
              3px 0 0 #E6E0D4,
              4px 0 0 #BDB5A6,
              7px 0 0 #E6E0D4,
              8px 0 0 #BDB5A6,
              11px 0 0 #E6E0D4,
              12px 0 0 #9E9687
            `
          }}
        >
          {/* Central Gutter / Spine Valley Shadow */}
          <div 
            className="hidden lg:block absolute top-0 bottom-0 w-8 z-30 pointer-events-none transition-all duration-300"
            style={{
              left: readingPdf && isWideSplit ? '55%' : '380px',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 35%, transparent 100%)'
            }}
          />

          {/* =========================================================================
              LEFT PAGE: TABLE OF CONTENTS OR SPLIT-PAGE INTERACTIVE PDF READER
              ========================================================================= */}
          <aside 
            aria-label="Table of Contents and Master Index"
            className={`w-full ${
              readingPdf && isWideSplit 
                ? 'lg:w-[55%] lg:flex-[55]' 
                : 'lg:w-[380px] shrink-0'
            } border-b lg:border-b-0 lg:border-r p-5 sm:p-7 flex flex-col justify-between select-text transition-all duration-300 ease-in-out`}
            style={{
              borderColor: pageBorder,
              color: pageInk
            }}
            onMouseUp={handleReaderTextSelection}
          >
            {readingPdf ? (
              /* -------------------------------------------------------------
                 SPLIT-PAGE IN-BOOK PDF READER ON LEFT PAGE
                 ------------------------------------------------------------- */
              <div className="space-y-3 flex flex-col h-full justify-between">
                <div>
                  {/* Top Bar of Left PDF Reader */}
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: pageBorder }}>
                    <button
                      type="button"
                      onClick={() => { setReadingPdf(null); setSelectedPdfText(''); }}
                      className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Index</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono opacity-70">
                        Split-Page Reader
                      </span>
                      {/* Full-Page Enlarge Button */}
                      <button
                        type="button"
                        onClick={() => setIsFullScreenPdf(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        title="Enlarge PDF to Full Page Cinema Mode (100vw x 100vh)"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>⛶ Full Page</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Title & Status */}
                  <div className="pt-2 pb-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Chapter Dossier</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-60">
                        {readingPdf.fileSize}
                      </span>
                    </div>
                    <h3 className="font-serif font-black text-sm sm:text-base line-clamp-1">
                      {readingPdf.fileName}
                    </h3>
                  </div>

                  {/* Full Interactive PDF Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-xl bg-stone-200/60 dark:bg-stone-900/60 text-xs font-mono font-bold border border-stone-300/60 dark:border-stone-800">
                    {/* Page Jumper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={pdfPageNum <= 1}
                        onClick={() => setPdfPageNum(Math.max(1, pdfPageNum - 1))}
                        className="p-1 rounded hover:bg-stone-300 dark:hover:bg-stone-800 disabled:opacity-30"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={pdfTotalPages}
                        value={pdfPageNum}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1 && v <= pdfTotalPages) {
                            setPdfPageNum(v);
                          }
                        }}
                        className="w-10 text-center font-mono text-[11px] font-black py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                        title="Direct page number"
                      />
                      <span className="text-[11px] opacity-75">
                        / {pdfTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={pdfPageNum >= pdfTotalPages}
                        onClick={() => setPdfPageNum(Math.min(pdfTotalPages, pdfPageNum + 1))}
                        className="p-1 rounded hover:bg-stone-300 dark:hover:bg-stone-800 disabled:opacity-30"
                        title="Next page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Zoom & Fit */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPdfScale(Math.max(0.6, pdfScale - 0.15))}
                        className="p-1 rounded hover:bg-stone-300 dark:hover:bg-stone-800"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono opacity-80 min-w-[34px] text-center">
                        {Math.round(pdfScale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPdfScale(Math.min(2.5, pdfScale + 0.15))}
                        className="p-1 rounded hover:bg-stone-300 dark:hover:bg-stone-800"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfScale(1.0)}
                        className="px-1.5 py-0.5 rounded text-[10px] hover:bg-stone-300 dark:hover:bg-stone-800 font-bold"
                        title="Reset fit"
                      >
                        Fit
                      </button>
                    </div>

                    {/* Mode Toggles */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!readingPdfBuffer && !readingPdf.dataUrl) {
                            onShowToast('Visual canvas requires binary PDF. Showing smart text view.', 'info');
                            setPdfMode('text');
                          } else {
                            setPdfMode('canvas');
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          pdfMode === 'canvas' 
                            ? 'bg-amber-500 text-stone-950 font-black shadow-xs' 
                            : 'hover:bg-stone-300 dark:hover:bg-stone-800 opacity-70'
                        }`}
                        title="High-resolution Canvas rendering"
                      >
                        Canvas
                      </button>
                      {pdfBlobUrl && (
                        <button
                          type="button"
                          onClick={() => setPdfMode('native')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            pdfMode === 'native' 
                              ? 'bg-amber-500 text-stone-950 font-black shadow-xs' 
                              : 'hover:bg-stone-300 dark:hover:bg-stone-800 opacity-70'
                          }`}
                          title="Native Browser PDF Engine"
                        >
                          Native PDF
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPdfMode('text')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          pdfMode === 'text' 
                            ? 'bg-amber-500 text-stone-950 font-black shadow-xs' 
                            : 'hover:bg-stone-300 dark:hover:bg-stone-800 opacity-70'
                        }`}
                        title="Smart extracted textbook reader"
                      >
                        Smart Text
                      </button>
                    </div>

                    {/* Wide Split Button */}
                    <button
                      type="button"
                      onClick={() => setIsWideSplit(!isWideSplit)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isWideSplit 
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' 
                          : 'border border-stone-400 dark:border-stone-700'
                      }`}
                      title={isWideSplit ? 'Switch to compact column' : 'Expand to wide 55/45 split view'}
                    >
                      <Columns className="w-3 h-3" />
                      <span>{isWideSplit ? '↔️ 55% Wide' : '↔️ Compact'}</span>
                    </button>
                  </div>

                  {/* Fallback Notice for Legacy PDFs without binary blob */}
                  {(!readingPdfBuffer && !readingPdf.dataUrl) && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-mono mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-slide-up">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>📖 Smart Page Reader (Extracted Textbook Content)</span>
                      </div>
                      <label className="cursor-pointer px-2.5 py-1 rounded-md bg-amber-500 text-stone-950 font-bold text-[10px] hover:bg-amber-400 flex items-center gap-1 shrink-0 self-start sm:self-auto shadow-xs active:scale-95">
                        <Upload className="w-3 h-3" />
                        <span>📎 Attach Original PDF File for High-Res Visual View</span>
                        <input 
                          type="file" 
                          accept=".pdf,application/pdf" 
                          onChange={(e) => handleReattachPdfFile(e, readingPdf)} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}

                  {/* Highlight-to-Note Floating Action Bar */}
                  {selectedPdfText && (
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 space-y-2 animate-fade-slide-up mt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1">
                          <Highlighter className="w-3.5 h-3.5" />
                          <span>Highlight Selected ({selectedPdfText.length} chars)</span>
                        </span>
                        <button type="button" onClick={() => setSelectedPdfText('')}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddSelectionToNotes()}
                          className="px-2 py-1 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-bold active:scale-95"
                        >
                          📝 + Add to Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSelectionToFlashcard()}
                          className="px-2 py-1 rounded bg-amber-500 text-stone-950 text-[10px] font-bold active:scale-95"
                        >
                          🃏 + Create Flashcard
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSelectionToPyq()}
                          className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold active:scale-95"
                        >
                          🔥 + Save as PYQ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reader Canvas / Native PDF / Text Viewport */}
                  <div className="mt-3 overflow-y-auto min-h-[60vh] max-h-[70vh] border rounded-2xl p-2 bg-white dark:bg-stone-950 border-stone-300 dark:border-stone-800 shadow-inner select-text relative flex flex-col justify-start">
                    {isPdfLoading ? (
                      <div className="p-12 text-center text-xs text-stone-500 font-mono flex flex-col items-center justify-center gap-2 min-h-[350px]">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                        <span>Rendering PDF page...</span>
                      </div>
                    ) : pdfMode === 'native' && pdfBlobUrl ? (
                      <iframe 
                        src={`${pdfBlobUrl}#page=${pdfPageNum}&zoom=${Math.round(pdfScale * 100)}`}
                        title={readingPdf.fileName}
                        className="w-full h-[62vh] rounded-xl border-0 shadow-sm"
                      />
                    ) : pdfMode === 'canvas' && readingPdfBuffer ? (
                      <div className="flex justify-center overflow-auto w-full p-2">
                        <canvas ref={canvasRef} className="max-w-full h-auto shadow-md rounded-sm" />
                      </div>
                    ) : (
                      <div className="font-serif text-xs sm:text-sm leading-relaxed p-4 whitespace-pre-wrap select-text text-stone-900 dark:text-stone-100">
                        <div className="border-b pb-2 mb-3 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
                          <span>Page {pdfPageNum} of {pdfTotalPages}</span>
                          <span>{readingPdf.fileName}</span>
                        </div>
                        {pdfPageTexts[pdfPageNum - 1] || readingPdf.extractedText || readingPdf.summary || 'No text extracted for this page.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Left Reader Footer: Re-attach option & quick page indicator */}
                <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: pageBorder }}>
                  <label className="cursor-pointer text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold">
                    <RefreshCw className="w-3 h-3" />
                    <span>🔄 Re-attach PDF File</span>
                    <input 
                      type="file" 
                      accept=".pdf,application/pdf" 
                      onChange={(e) => handleReattachPdfFile(e, readingPdf)} 
                      className="hidden" 
                    />
                  </label>
                  <span>Page {pdfPageNum} of {pdfTotalPages}</span>
                </div>
              </div>
            ) : (
              /* -------------------------------------------------------------
                 STANDARD TABLE OF CONTENTS & MASTER INDEX
                 ------------------------------------------------------------- */
              <div className="space-y-6">
                {/* Book Header Title */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400">
                    VOLUME {subject.code || 'CURRICULUM'}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight leading-tight">
                    {subject.name}
                  </h1>
                </div>

                {/* Double Horizontal Book Rule */}
                <div className="space-y-1 pt-1">
                  <div className="h-[2px] bg-stone-900 dark:bg-stone-100 opacity-80" />
                  <div className="h-[1px] bg-stone-900 dark:bg-stone-100 opacity-40" />
                  <div className="text-[11px] font-mono font-black tracking-widest text-center py-1 uppercase opacity-80">
                    CONTENTS & SYLLABUS INDEX
                  </div>
                  <div className="h-[1px] bg-stone-900 dark:bg-stone-100 opacity-40" />
                  <div className="h-[2px] bg-stone-900 dark:bg-stone-100 opacity-80" />
                </div>

                {/* Chapter Index List with Dotted Leaders */}
                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
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
            )}

            {/* Left Page Footer */}
            <div className="pt-4 border-t mt-4 flex items-center justify-between text-[10px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
              <span>Study OS • Master Index</span>
              <span>Page I</span>
            </div>
          </aside>

          {/* =========================================================================
              RIGHT PAGE: WIDE TEXTBOOK VIEW (BOLD CHAPTERS WITH ALL PARTS NESTED BELOW)
              ========================================================================= */}
          <main 
            aria-label="Chapter contents, syllabus topics, and attachments"
            className={`w-full ${
              readingPdf && isWideSplit 
                ? 'lg:w-[45%] lg:flex-[45]' 
                : 'flex-1'
            } p-6 sm:p-10 flex flex-col justify-between overflow-y-auto transition-all duration-300 ease-in-out`}
            style={{
              color: pageInk,
              borderColor: pageBorder
            }}
          >
            <div className="space-y-10">
              {/* Running Header */}
              <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 border-b pb-2" style={{ borderColor: pageBorder }}>
                <span>{subject.name}</span>
                <span>
                  EXAM: {examUrgency?.formattedExamDate || 'NO DATE'} • PAGE {activeUnitId === 'all' ? '1–ALL' : '1'}
                </span>
              </div>

              {/* -------------------------------------------------------------
                  📂 SUBJECT-LEVEL & RECOVERED PDFS TRAY (ASSIGN TO A CHAPTER)
                  ------------------------------------------------------------- */}
              {unassignedPdfs.length > 0 && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 space-y-3 animate-fade-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                      <span>📂 Uploaded Subject PDFs (Assign to a Chapter) ({unassignedPdfs.length})</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-70">
                      Click dropdown to place under any bold Chapter
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {unassignedPdfs.map(pdf => (
                      <div 
                        key={pdf.id}
                        className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="text-xs font-bold font-serif line-clamp-1">
                            📄 {pdf.fileName}
                          </div>
                          <div className="text-[10px] font-mono opacity-60">
                            {pdf.fileSize} • Uploaded {pdf.uploadDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setReadingPdf(pdf)}
                            className="px-2 py-1 rounded bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Read</span>
                          </button>

                          {/* 📌 Move to Chapter Dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleMovePdfToChapter(pdf, e.target.value);
                            }}
                            defaultValue=""
                            className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                          >
                            <option value="" disabled>📌 Move to Chapter ▾</option>
                            {units.map((u, i) => (
                              <option key={u.id} value={u.id}>
                                Ch {i + 1}: {u.title.slice(0, 20)}...
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => onDeletePdf(pdf.id)}
                            className="p-1 text-stone-400 hover:text-red-500"
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

              {/* RENDER EACH CHAPTER IN BOLD TEXTBOOK HIERARCHY */}
              {displayedUnits.map((unit, unitIdx) => {
                const uIndex = units.findIndex(u => u.id === unit.id);
                const uNumber = String(uIndex + 1).padStart(2, '0');

                // Filter nested items for this specific chapter
                let cTopics = subjectTopics.filter(t => t.unitId === unit.id || String(t.unitNumber) === String(uIndex + 1));
                let cVids = subjectVideos.filter(v => v.unitId === unit.id || v.unit === (uIndex + 1));
                let cPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === (uIndex + 1));
                let cPyqs = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === (uIndex + 1));

                // Apply Crunch Filter if active
                if (isWeakOnly) {
                  cTopics = cTopics.filter(t => t.mastery === 'weak' || !t.completed);
                  cVids = cVids.filter(v => !v.isWatched);
                  cPyqs = cPyqs.filter(q => q.userStatus !== 'mastered');
                }

                const isQuizActive = activeQuizUnitId === unit.id;

                return (
                  <section key={unit.id} className="space-y-7 pb-10 border-b last:border-b-0" style={{ borderColor: pageBorder }}>
                    
                    {/* BOLD CHAPTER HEADING WITH SOLID BOOK-RULE UNDERLINE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                          CHAPTER {uNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* ⚡ 2-Min Chapter Quiz Button */}
                          <button
                            type="button"
                            onClick={() => handleStartChapterQuiz(unit, cTopics, cPyqs)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1 active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>⚡ 2-Min Chapter Quiz</span>
                          </button>
                          <span className="text-xs font-mono font-bold opacity-75">
                            {cTopics.filter(t => t.completed).length} / {cTopics.length} Topics Mastered
                          </span>
                        </div>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
                        {unit.title}
                      </h2>
                      {/* Solid Book-Rule Underline */}
                      <div className="h-[2px] bg-stone-900 dark:bg-stone-100 opacity-80" />
                    </div>

                    {/* Inline Quick 2-Minute Quiz Drawer */}
                    {isQuizActive && quizQuestions.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-3 animate-fade-slide-up">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>2-Min Chapter Quiz • Question {quizIndex + 1} of {quizQuestions.length}</span>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setActiveQuizUnitId(null)}
                            className="p-1 text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-amber-500/30 space-y-2">
                          <div className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
                            {quizQuestions[quizIndex]?.question}
                          </div>

                          {quizShowAnswer ? (
                            <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs font-serif space-y-1.5 border-t border-dashed">
                              <span className="text-[10px] font-mono font-bold uppercase text-amber-600">Model Answer Points:</span>
                              <ul className="list-disc pl-4 space-y-1 opacity-90">
                                {quizQuestions[quizIndex]?.bullets?.map((b, bi) => (
                                  <li key={bi}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setQuizShowAnswer(true)}
                              className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-xs font-bold font-mono hover:bg-stone-300"
                            >
                              👁️ Reveal Model Answer
                            </button>
                          )}
                        </div>

                        {/* Self-Rating Controls */}
                        {quizShowAnswer && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-mono font-bold">Rate your recall:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelfGradeQuiz('weak')}
                                className="px-3 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 text-xs font-bold"
                              >
                                Weak
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelfGradeQuiz('okay')}
                                className="px-3 py-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-xs font-bold"
                              >
                                Okay
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelfGradeQuiz('strong')}
                                className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-xs font-bold"
                              >
                                Mastered
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* -----------------------------------------------------------------
                        A. SYLLABUS TOPICS & SUBTOPICS
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
                                  <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-700 p-0.5 text-[10px] font-mono">
                                    <button
                                      type="button"
                                      onClick={() => onSetTopicMastery(topic.id, 'weak')}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isWeak ? 'bg-red-500 text-white' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Weak
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSetTopicMastery(topic.id, 'okay')}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isOkay ? 'bg-amber-500 text-stone-950' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Okay
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSetTopicMastery(topic.id, 'strong')}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isStrong ? 'bg-emerald-500 text-white' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Strong
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedTopicNoteId(isNoteOpen ? null : topic.id)}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-stone-300 dark:border-stone-700 hover:border-amber-500"
                                  >
                                    {topic.notes ? 'View Note' : '+ Note'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteTopic(topic.id)}
                                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Note Field */}
                              {isNoteOpen && (
                                <div className="p-3 ml-6 rounded-xl bg-stone-200/60 dark:bg-stone-900 border border-amber-500/30 space-y-2">
                                  <textarea
                                    rows={2}
                                    defaultValue={topic.notes || ''}
                                    onChange={(e) => setTopicNoteDraft(prev => ({ ...prev, [topic.id]: e.target.value }))}
                                    placeholder="Write quick formulas, definitions, or exam reminders..."
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 font-serif"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const noteVal = topicNoteDraft[topic.id] ?? topic.notes ?? '';
                                        const updatedTopic = { ...topic, notes: noteVal };
                                        storageService.updateTopic(updatedTopic);
                                        topic.notes = noteVal;
                                        setExpandedTopicNoteId(null);
                                        onShowToast('Note saved! 📝', 'success');
                                      }}
                                      className="px-3 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                                    >
                                      Save Note
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Add Topic */}
                      {addTopicUnitId === unit.id && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Topic title (e.g. Critical Section & Peterson's Algorithm)" 
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTopic(unit.id, uIndex); }}
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
                        B. ATTACHED VIDEO LECTURES
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>B. Video Lectures ({cVids.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddVideoUnitId(addVideoUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach Video</span>
                        </button>
                      </div>

                      {/* Video Rows */}
                      <div className="space-y-2 pl-2">
                        {cVids.map(vid => {
                          const isPlaying = inlineVideoId === vid.id;

                          return (
                            <div key={vid.id} className="space-y-2">
                              <div className="flex items-baseline justify-between gap-2 text-xs py-1 px-1.5 rounded hover:bg-stone-200/30 dark:hover:bg-stone-800/30">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onToggleVideoWatched(vid.id)}
                                    className="text-stone-400 hover:text-emerald-500"
                                  >
                                    {vid.isWatched ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <span className={`font-serif font-bold ${vid.isWatched ? 'line-through opacity-60' : ''}`}>
                                    🎬 {vid.title}
                                  </span>
                                </div>

                                <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600" />

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setInlineVideoId(isPlaying ? null : vid.id)}
                                    className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center gap-1"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
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

                              {isPlaying && (
                                <div className="relative pt-[56.25%] w-full rounded-xl overflow-hidden bg-black shadow-lg">
                                  <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${vid.videoId}?autoplay=1`}
                                    title={vid.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full border-0"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Attach Video */}
                      {addVideoUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 space-y-2">
                          <input 
                            type="text" 
                            placeholder="Video Title (e.g. Peterson's Algorithm Explained in 10 mins)" 
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="YouTube Link (e.g. https://youtube.com/watch?v=...)" 
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
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>C. Attached PDFs & Chapter Notes ({cPdfs.length})</span>
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
                        {cPdfs.map(pdf => (
                          <div key={pdf.id} className="space-y-2">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs py-1.5 px-2 rounded bg-stone-200/30 dark:bg-stone-900/40 border border-stone-300/50 dark:border-stone-800">
                              <span className="font-serif font-bold flex items-center gap-1.5">
                                <span>📄</span>
                                <span>{pdf.fileName}</span>
                                <span className="text-[10px] font-mono opacity-60">({pdf.fileSize})</span>
                              </span>

                              <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600 hidden sm:block" />

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* 👁️ Read PDF Button (Opens Split-Page Left Reader) */}
                                <button
                                  type="button"
                                  onClick={() => setReadingPdf(pdf)}
                                  className="px-2.5 py-1 rounded bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center gap-1 active:scale-95 shadow-xs"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>👁️ Read PDF</span>
                                </button>

                                {/* ⚡ Auto-Extract Chapter Summary & PYQs */}
                                <button
                                  type="button"
                                  onClick={() => handleExtractPdfNotesAndPyqs(pdf, unit.id, uIndex)}
                                  className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-900 dark:text-stone-100 font-bold text-[10px] flex items-center gap-1"
                                  title="Extract 5 Key Revision Points & 3 Predicted PYQs from PDF"
                                >
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  <span>⚡ Extract Key Points & PYQs</span>
                                </button>

                                {/* 📌 Move to Chapter Dropdown */}
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) handleMovePdfToChapter(pdf, e.target.value);
                                  }}
                                  value={unit.id}
                                  className="text-[10px] font-mono font-bold px-1.5 py-1 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                                >
                                  {units.map((u, i) => (
                                    <option key={u.id} value={u.id}>
                                      Ch {i + 1}: {u.title.slice(0, 18)}...
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => onDeletePdf(pdf.id)}
                                  className="p-1 text-stone-400 hover:text-red-500"
                                  title="Delete PDF"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* File Uploader & Note Form */}
                      {addPdfUnitId === unit.id && (
                        <div className="p-3.5 rounded-xl bg-stone-200/90 dark:bg-stone-900 border-2 border-dashed border-amber-500/50 space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            <span>Upload PDF to IndexedDB or Paste Notes</span>
                            <button type="button" onClick={() => setAddPdfUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* File Upload Button */}
                            <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-400 transition-colors shadow-sm">
                              <Upload className="w-4 h-4" />
                              <span>{isUploadingPdf ? 'Storing in IndexedDB...' : 'Choose PDF File'}</span>
                              <input 
                                type="file" 
                                accept=".pdf,application/pdf" 
                                onChange={(e) => handleFileUpload(e, unit.id, uIndex)}
                                disabled={isUploadingPdf}
                                className="hidden" 
                              />
                            </label>
                            <span className="text-xs text-stone-500 font-mono">or paste quick notes below:</span>
                          </div>

                          <input 
                            type="text" 
                            placeholder="Document / Note Name (e.g. Lecture 4 Notes.pdf)" 
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
                              onClick={() => {
                                if (!pdfFileName.trim()) return;
                                const newPdf: PdfResource = {
                                  id: `pdf_${Date.now()}`,
                                  subjectId: subject.id,
                                  fileName: pdfFileName.trim(),
                                  uploadDate: new Date().toLocaleDateString(),
                                  fileSize: '1.2 MB',
                                  extractedText: pdfTextSnippet.trim() || 'Chapter summary text & notes.',
                                  summary: 'Dossier summary for this unit.',
                                  unitId: unit.id,
                                  unit: uIndex + 1
                                };
                                onAddPdf(newPdf);
                                setPdfFileName('');
                                setPdfTextSnippet('');
                                setAddPdfUnitId(null);
                                onShowToast('Note attached to chapter! 📄', 'success');
                              }}
                              className="px-3.5 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -----------------------------------------------------------------
                        D. PAST EXAM QUESTIONS / PYQS FOR THIS CHAPTER
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>D. Past Exam Questions & High-Yield PYQs ({cPyqs.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setAddPyqUnitId(addPyqUnitId === unit.id ? null : unit.id)}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Question</span>
                        </button>
                      </div>

                      {/* PYQ Question Cards */}
                      <div className="space-y-3 pl-2">
                        {cPyqs.map(q => {
                          const isMastered = q.userStatus === 'mastered';
                          const isPracticeOpen = practicePyqId === q.id;

                          return (
                            <div 
                              key={q.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isMastered 
                                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                                  : 'bg-white/60 dark:bg-stone-900/60 border-stone-300/80 dark:border-stone-800 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  {/* Weightage Badge & Repeated Stamped Info */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                      {q.marks} MARKS
                                    </span>
                                    {q.repeatCount > 1 && (
                                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                                        🔥 Asked {q.repeatCount}x in University Exams
                                      </span>
                                    )}
                                  </div>

                                  {/* Question Title */}
                                  <p className="font-serif font-bold text-xs sm:text-sm leading-snug">
                                    {q.question}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onToggleQuestionMastered(q.id)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                                      isMastered 
                                        ? 'bg-emerald-500 text-white shadow-xs' 
                                        : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300'
                                    }`}
                                  >
                                    {isMastered ? '✓ Mastered' : 'Mark Done'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPracticePyqId(isPracticeOpen ? null : q.id)}
                                    className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-[10px] font-mono font-bold"
                                  >
                                    {isPracticeOpen ? 'Close Answer' : 'Model Answer'}
                                  </button>
                                </div>
                              </div>

                              {/* Model Answer Breakdown & Practice Input */}
                              {isPracticeOpen && (
                                <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3 font-serif text-xs leading-relaxed animate-fade-slide-up">
                                  <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800">
                                    <div className="font-mono font-black text-[10px] text-amber-600 uppercase mb-1">
                                      Model University Answer Rubric:
                                    </div>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {q.bullets?.map((b, bi) => (
                                        <li key={bi}>{b}</li>
                                      ))}
                                    </ul>
                                    {q.diagramFormulaTip && (
                                      <div className="mt-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                                        💡 Formula / Diagram Tip: {q.diagramFormulaTip}
                                      </div>
                                    )}
                                  </div>

                                  {/* Student Practice Input Box */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-mono font-bold opacity-75">
                                      Practice Typing Your Exam Answer (Self-Assessment):
                                    </div>
                                    <textarea
                                      rows={2}
                                      defaultValue={q.lastAttemptAnswer || ''}
                                      onChange={(e) => setPracticeAnswerDraft(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      placeholder="Write out definition, formula, or proof steps..."
                                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 font-serif"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const ans = practiceAnswerDraft[q.id] || q.lastAttemptAnswer || '';
                                          onSaveQuestionAnswer(q.id, ans, 10);
                                          onShowToast('Practice answer saved! 📝', 'success');
                                        }}
                                        className="px-3 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                                      >
                                        Save Attempt
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Input to Add Past Exam Question */}
                      {addPyqUnitId === unit.id && (
                        <div className="p-3 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="University Question (e.g. State and prove Master Theorem for divide-and-conquer)" 
                              value={pyqQuestionText}
                              onChange={(e) => setPyqQuestionText(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                            />
                            <select
                              value={pyqMarks}
                              onChange={(e) => setPyqMarks(Number(e.target.value) as any)}
                              className="px-2 py-1.5 rounded text-xs font-mono font-bold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                            >
                              <option value={2}>2 Marks</option>
                              <option value={5}>5 Marks</option>
                              <option value={10}>10 Marks</option>
                            </select>
                          </div>
                          <textarea 
                            rows={2}
                            placeholder="Model Answer Bullets (one bullet point per line)..." 
                            value={pyqBullets}
                            onChange={(e) => setPyqBullets(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 font-serif"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreatePyq(unit.id, uIndex)}
                              className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                            >
                              Save PYQ
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

            {/* Right Page Running Footer */}
            <div className="pt-8 border-t mt-12 flex items-center justify-between text-[10px] font-mono opacity-60" style={{ borderColor: pageBorder }}>
              <span>Study OS • {subject.name}</span>
              <span>Archival Hardcover Volume</span>
            </div>
          </main>

        </div>
      </div>

      {/* =========================================================================
          CINEMA FULL-SCREEN PDF MODAL (100vw x 100vh, Zero Wasted Space)
          ========================================================================= */}
      {isFullScreenPdf && readingPdf && (
        <div 
          className="fixed inset-0 z-[9999] bg-[#0A0C10] text-stone-100 flex flex-col w-screen h-screen select-none animate-fade-in"
          onMouseUp={handleReaderTextSelection}
        >
          {/* Top Control Bar */}
          <div className="h-14 sm:h-16 px-3 sm:px-6 bg-[#12161F] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            {/* Left: Document Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {readingPdf.fileName}
                </h3>
                <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">FULL PAGE CINEMA</span>
                  <span>•</span>
                  <span>{readingPdf.fileSize}</span>
                </span>
              </div>
            </div>

            {/* Center: Page Controls, Zoom & Modes */}
            <div className="flex items-center gap-2">
              {/* Page Jumper */}
              <div className="flex items-center gap-1 bg-stone-900/90 px-2 py-1 rounded-xl border border-white/10 text-xs font-mono font-bold">
                <button
                  type="button"
                  disabled={pdfPageNum <= 1}
                  onClick={() => setPdfPageNum(Math.max(1, pdfPageNum - 1))}
                  className="p-1 rounded hover:bg-stone-800 disabled:opacity-30"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={pdfTotalPages}
                  value={pdfPageNum}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= pdfTotalPages) {
                      setPdfPageNum(v);
                    }
                  }}
                  className="w-11 text-center font-mono text-xs font-black py-0.5 rounded bg-black/60 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs opacity-70">
                  / {pdfTotalPages}
                </span>
                <button
                  type="button"
                  disabled={pdfPageNum >= pdfTotalPages}
                  onClick={() => setPdfPageNum(Math.min(pdfTotalPages, pdfPageNum + 1))}
                  className="p-1 rounded hover:bg-stone-800 disabled:opacity-30"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden md:flex items-center gap-1 bg-stone-900/90 px-2 py-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPdfScale(Math.max(0.6, pdfScale - 0.2))}
                  className="p-1 rounded hover:bg-stone-800"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold min-w-[36px] text-center">
                  {Math.round(pdfScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPdfScale(Math.min(3.0, pdfScale + 0.2))}
                  className="p-1 rounded hover:bg-stone-800"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPdfScale(1.0)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 ml-1"
                >
                  Fit
                </button>
              </div>

              {/* Mode Selector */}
              <div className="hidden sm:flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-white/10 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (!readingPdfBuffer && !readingPdf.dataUrl) {
                      onShowToast('Visual canvas requires binary PDF. Showing smart text view.', 'info');
                      setPdfMode('text');
                    } else {
                      setPdfMode('canvas');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    pdfMode === 'canvas' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Canvas
                </button>
                {pdfBlobUrl && (
                  <button
                    type="button"
                    onClick={() => setPdfMode('native')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      pdfMode === 'native' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Native PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPdfMode('text')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    pdfMode === 'text' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Smart Text
                </button>
              </div>
            </div>

            {/* Right: Notes Drawer Toggle & Exit */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFullScreenNotes(!showFullScreenNotes)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                  showFullScreenNotes 
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-extrabold shadow-sm' 
                    : 'bg-white/5 border-white/15 text-stone-300 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Chapter Notes Drawer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chapter Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenPdf(false)}
                className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 border border-red-500/40 shadow-sm active:scale-95"
                title="Exit Full Screen (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Exit (Esc)</span>
              </button>
            </div>
          </div>

          {/* Full-Screen Reading Viewport */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Main Center Reading Viewport */}
            <div className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-start p-4 sm:p-6 bg-[#080A0E] relative select-text">
              {/* Highlight-to-Note Floating Action Bar inside Full Screen */}
              {selectedPdfText && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-3 rounded-2xl bg-[#1A1F2C] border border-amber-500/70 shadow-2xl flex items-center gap-3 animate-fade-slide-up">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Highlighter className="w-4 h-4" />
                    <span>Highlight ({selectedPdfText.length} chars)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSelectionToNotes()}
                      className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs active:scale-95 shadow-sm"
                    >
                      📝 + Add to Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSelectionToFlashcard()}
                      className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs active:scale-95"
                    >
                      🃏 + Flashcard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSelectionToPyq()}
                      className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs active:scale-95"
                    >
                      🔥 + Save PYQ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPdfText('')}
                      className="p-1 text-stone-400 hover:text-white ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Viewport Rendering */}
              {isPdfLoading ? (
                <div className="p-20 text-center text-sm font-mono text-stone-400 flex flex-col items-center justify-center gap-3 my-auto">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <span>Loading full page high-resolution PDF...</span>
                </div>
              ) : pdfMode === 'native' && pdfBlobUrl ? (
                <iframe 
                  src={`${pdfBlobUrl}#page=${pdfPageNum}&zoom=${Math.round(pdfScale * 100)}`}
                  title={readingPdf.fileName}
                  className="w-full h-full rounded-xl border border-white/10 shadow-2xl"
                />
              ) : pdfMode === 'canvas' && readingPdfBuffer ? (
                <div className="flex justify-center w-full py-4 overflow-auto">
                  <canvas ref={fullScreenCanvasRef} className="max-w-full h-auto shadow-2xl rounded-md border border-white/10" />
                </div>
              ) : (
                <div className="max-w-3xl w-full bg-[#12161F] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl my-auto text-stone-200 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-wrap select-text">
                  <div className="border-b border-white/10 pb-3 mb-4 text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                    <span>PAGE {pdfPageNum} OF {pdfTotalPages}</span>
                    <span>{readingPdf.fileName}</span>
                  </div>
                  {pdfPageTexts[pdfPageNum - 1] || readingPdf.extractedText || readingPdf.summary || 'No text extracted for this page.'}
                </div>
              )}
            </div>

            {/* Side Notes Drawer (Take chapter notes while viewing in Cinema Full Screen) */}
            {showFullScreenNotes && (
              <aside className="w-80 sm:w-96 h-full bg-[#12161F] border-l border-white/10 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl animate-fade-slide-right select-text shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chapter Notes Drawer</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowFullScreenNotes(false)}
                      className="p-1 text-stone-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Note Input */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-300">Take Note from PDF:</span>
                    <textarea
                      rows={3}
                      placeholder="Type key formula, exam point, or theorem..."
                      value={newFullScreenNoteText}
                      onChange={(e) => setNewFullScreenNoteText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-stone-500 font-serif focus:outline-none focus:border-amber-500 resize-none"
                    />
                    <button
                      type="button"
                      disabled={!newFullScreenNoteText.trim()}
                      onClick={() => {
                        const targetUnitId = readingPdf?.unitId || activeUnitId !== 'all' ? activeUnitId : units[0]?.id;
                        if (!targetUnitId) return;

                        onAddTopic({
                          id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          subjectId: subject.id,
                          unitId: targetUnitId,
                          title: newFullScreenNoteText.slice(0, 50) + (newFullScreenNoteText.length > 50 ? '...' : ''),
                          notes: newFullScreenNoteText.trim(),
                          completed: false,
                          mastery: 'okay',
                          createdAt: Date.now()
                        });
                        setNewFullScreenNoteText('');
                        onShowToast('Note saved to chapter! 📝', 'success');
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs transition-all active:scale-95 shadow-sm"
                    >
                      + Save to Chapter Notes
                    </button>
                  </div>

                  {/* List of current notes in this chapter */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-mono font-bold text-stone-400 uppercase">
                      Existing Chapter Notes:
                    </span>
                    <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                      {subjectTopics
                        .filter(t => !readingPdf?.unitId || t.unitId === readingPdf.unitId)
                        .map(topic => (
                          <div 
                            key={topic.id}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1"
                          >
                            <div className="font-bold text-stone-100 flex items-center justify-between">
                              <span className="line-clamp-1">{topic.title}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                topic.mastery === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                                topic.mastery === 'okay' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-rose-500/20 text-rose-400'
                              }`}>
                                {topic.mastery}
                              </span>
                            </div>
                            {topic.notes && (
                              <p className="text-[11px] text-stone-400 font-serif line-clamp-2">
                                {topic.notes}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-stone-500 flex items-center justify-between">
                  <span>Press Esc to exit Full Screen</span>
                  <span>Study OS</span>
                </div>
              </aside>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
