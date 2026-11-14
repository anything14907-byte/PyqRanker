import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  VideoResource, 
  PdfResource, 
  TopicMastery,
  Flashcard,
  SubjectUnit,
  UnitImageResource,
  UnitImageCategory
} from '../types';
import { 
  formatUnitDisplayName, 
  getUnitDisplayLabel,
  extractYoutubeId, 
  getExamUrgencyColor, 
  storageService,
  sortUnitsByNumber,
  getNextMissingUnitNumber,
  parseUnitNumber,
  getUnitNum
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
  ChevronUp,
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
  FileUp,
  Image as ImageIcon,
  Brain,
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  uploadAndProcessPdfFile, 
  getPdfArrayBuffer, 
  renderPdfPageToCanvas, 
  extractTextFromPdfBuffer, 
  generateExamNotesAndPYQs 
} from '../utils/pdfStorageService';
import { 
  loadUnitImages, 
  createAndSaveUnitImage, 
  deleteUnitImage, 
  compressAndReadFile, 
  formatImageCategoryBadge 
} from '../utils/unitImageService';
import { DiagramLightboxModal } from './DiagramLightboxModal';

interface OpenBookBinderProps {
  subject: SubjectMeta;
  initialUnitId?: string;
  initialPdfId?: string;
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
  videos: VideoResource[];
  pdfs: PdfResource[];
  onSelectUnit?: (unitId: string) => void;
  onToggleTopicCompleted: (topicId: string) => void;
  onSetTopicMastery: (topicId: string, mastery: TopicMastery) => void;
  onAddTopic: (topic: SyllabusTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onUpdateTopicTitle?: (topicId: string, newTitle: string) => void;
  onReorderTopics?: (topics: SyllabusTopic[]) => void;
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
  onAutoFillSyllabus?: (subjectId: string) => void;
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
  onSelectUnit,
  onToggleTopicCompleted,
  onSetTopicMastery,
  onAddTopic,
  onDeleteTopic,
  onUpdateTopicTitle,
  onReorderTopics,
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
  onAutoFillSyllabus,
  onBackToShelf,
  onShowToast
}) => {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';
  const cloth = getBookClothColor(subject.accentColor);

  const units = useMemo(() => sortUnitsByNumber(subject.units || []), [subject.units]);

  // Active Chapter Selection ('all' or specific unitId)
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    if (initialUnitId && initialUnitId !== 'all') {
      const found = units.find(u => u.id === initialUnitId);
      if (found) return found.id;
    }
    return units[0]?.id || 'all';
  });

  // Sync initialUnitId if changed from URL hash or parent
  useEffect(() => {
    if (initialUnitId && initialUnitId !== 'all') {
      const found = units.find(u => u.id === initialUnitId);
      if (found && found.id !== activeUnitId) {
        setActiveUnitId(found.id);
      }
    } else if (initialUnitId === 'all' && activeUnitId !== 'all') {
      setActiveUnitId('all');
    }
  }, [initialUnitId, units]);

  const handleSelectUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    onSelectUnit?.(unitId);
  };

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

  // Unit Creation & Editing State (Explicit Unit Number + Auto-suggest missing integer)
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);
  const [newUnitNumber, setNewUnitNumber] = useState<number>(() => getNextMissingUnitNumber(units));
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitNumber, setEditingUnitNumber] = useState<number>(1);
  const [editingUnitTitle, setEditingUnitTitle] = useState<string>('');

  // Unit Images & Diagrams State (Permanent IndexedDB StudyOS_Unit_Images)
  const [unitImages, setUnitImages] = useState<UnitImageResource[]>([]);
  const [lightboxImageId, setLightboxImageId] = useState<string | null>(null);
  const [isDiagramsOnlyView, setIsDiagramsOnlyView] = useState<boolean>(false);
  const [diagramCategoryFilter, setDiagramCategoryFilter] = useState<string>('all');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Clipboard Paste Modal State (Instant Cmd+V / Ctrl+V capture)
  const [pastedImageDataUrl, setPastedImageDataUrl] = useState<string | null>(null);
  const [pastedImageCategory, setPastedImageCategory] = useState<UnitImageCategory>('diagram');
  const [pastedImageTitle, setPastedImageTitle] = useState<string>('');
  const [pastedImageUnitId, setPastedImageUnitId] = useState<string>('');
  const [pastedImagePyqId, setPastedImagePyqId] = useState<string | undefined>(undefined);

  // Reload Images from IndexedDB
  const reloadImages = useCallback(async () => {
    try {
      const loaded = await loadUnitImages(subject.id);
      setUnitImages(loaded);
    } catch (e) {
      console.error('Failed to load unit images from IndexedDB:', e);
    }
  }, [subject.id]);

  useEffect(() => {
    reloadImages();
  }, [reloadImages]);

  // Instant Clipboard Paste Listener (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInput && !e.clipboardData?.types.includes('Files')) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const { dataUrl } = await compressAndReadFile(file);
            setPastedImageDataUrl(dataUrl);
            setPastedImageCategory('diagram');
            setPastedImageTitle(`Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            const targetUId = (activeUnitId && activeUnitId !== 'all') ? activeUnitId : (units[0]?.id || '');
            setPastedImageUnitId(targetUId);
            onShowToast('Screenshot captured from clipboard! Confirm unit & category to save. 📸', 'info');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeUnitId, units, onShowToast]);

  const handleImageFilesUpload = async (files: FileList | File[], targetUnitId: string, pyqId?: string) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    let count = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const { dataUrl, fileSize, mimeType } = await compressAndReadFile(file);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        let cat: UnitImageCategory = 'diagram';
        if (/graph|chart|plot/i.test(nameWithoutExt)) cat = 'graph';
        else if (/pyq|exam|question/i.test(nameWithoutExt) || pyqId) cat = 'pyq';
        else if (/formula|sheet|math/i.test(nameWithoutExt)) cat = 'formula';
        else if (/note|hand|written/i.test(nameWithoutExt)) cat = 'handwritten';

        await createAndSaveUnitImage({
          subjectId: subject.id,
          unitId: targetUnitId,
          pyqId,
          title: nameWithoutExt,
          category: cat,
          dataUrl,
          mimeType,
          fileSize
        });
        count++;
      }
      await reloadImages();
      onShowToast(`Saved ${count} visual diagram(s) to Unit gallery! 🖼️`, 'success');
    } catch (err) {
      console.error('Failed to upload image:', err);
      onShowToast('Error saving image to IndexedDB.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteUnitImageClick = async (imageId: string, imageTitle: string) => {
    if (window.confirm(`Delete diagram "${imageTitle}"?`)) {
      try {
        await deleteUnitImage(imageId);
        await reloadImages();
        onShowToast(`Deleted "${imageTitle}"`, 'info');
      } catch (err) {
        onShowToast('Error deleting image.', 'error');
      }
    }
  };

  const handleSavePastedImage = async () => {
    if (!pastedImageDataUrl || !pastedImageUnitId) return;
    try {
      setIsUploadingImage(true);
      await createAndSaveUnitImage({
        subjectId: subject.id,
        unitId: pastedImageUnitId,
        pyqId: pastedImagePyqId,
        title: pastedImageTitle.trim() || 'Pasted Diagram',
        category: pastedImageCategory,
        dataUrl: pastedImageDataUrl,
        mimeType: 'image/png'
      });
      await reloadImages();
      setPastedImageDataUrl(null);
      setPastedImageTitle('');
      onShowToast('Diagram saved to Unit gallery! 🖼️', 'success');
    } catch (err) {
      console.error('Failed to save image:', err);
      onShowToast('Could not save image to IndexedDB.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Inline quick inputs per chapter
  const [addTopicUnitId, setAddTopicUnitId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Inline Topic Editing State
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState<string>('');

  const handleMoveTopic = (topic: SyllabusTopic, direction: 'up' | 'down', unitTopics: SyllabusTopic[]) => {
    if (!onReorderTopics) return;
    const idx = unitTopics.findIndex(t => t.id === topic.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= unitTopics.length) return;

    const newUnitTopics = [...unitTopics];
    const [moved] = newUnitTopics.splice(idx, 1);
    newUnitTopics.splice(targetIdx, 0, moved);

    const otherTopics = topics.filter(t => !unitTopics.some(ut => ut.id === t.id));
    onReorderTopics([...otherTopics, ...newUnitTopics]);
    onShowToast(`Moved "${topic.title.slice(0, 20)}" ${direction}!`, 'success');
  };

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

  // Scoped data for this subject (case-insensitive and ID-normalized match)
  const subjectTopics = useMemo(() => {
    const subIdLower = subject.id.toLowerCase();
    const subNameLower = subject.name.toLowerCase();
    return topics.filter(t => 
      t.subjectId === subject.id || 
      t.subjectId.toLowerCase() === subIdLower ||
      t.subjectId.toLowerCase() === subNameLower
    );
  }, [topics, subject.id, subject.name]);
  const subjectQuestions = useMemo(() => questions.filter(q => q.subjectId === subject.id), [questions, subject.id]);
  const subjectVideos = useMemo(() => videos.filter(v => v.subjectId === subject.id), [videos, subject.id]);
  const subjectPdfs = useMemo(() => pdfs.filter(p => p.subjectId === subject.id), [pdfs, subject.id]);

  // Helper to determine whether a topic belongs to a specific chapter/unit
  const isTopicInUnit = useCallback((t: SyllabusTopic, u: SubjectUnit) => {
    // 1. Direct unit ID match
    if (t.unitId && (t.unitId === u.id || t.unitId === (u as any).chapterId)) return true;
    if ((t as any).chapterId && (t as any).chapterId === u.id) return true;

    // 2. Extracted integer number match
    const tNum = parseUnitNumber(t.unitNumber ?? (t as any).unit ?? (t as any).chapter ?? t.unitId ?? (t as any).chapterId);
    const uNum = parseUnitNumber(u);
    if (tNum !== Infinity && uNum !== Infinity && tNum === uNum) return true;

    // 3. Substring number match in ID (e.g. u3 vs unit-3-...)
    if (t.unitId && u.id) {
      const tMatch = t.unitId.match(/\d+/);
      const uMatch = u.id.match(/\d+/);
      if (tMatch && uMatch && parseInt(tMatch[0], 10) === parseInt(uMatch[0], 10)) return true;
    }

    // 4. Unit title / label match
    const tLabel = String(t.unitNumber || (t as any).unitLabel || (t as any).unitTitle || '').trim().toLowerCase();
    const uLabel = String(u.unitLabel || u.unitNumber || '').trim().toLowerCase();
    const uTitle = String(u.title || u.name || '').trim().toLowerCase();
    if (tLabel && (tLabel === uLabel || tLabel === uTitle)) return true;

    // 5. Fallback: single unit in subject
    if (units.length === 1 && (!tNum || tNum === Infinity || tNum === uNum)) return true;

    return false;
  }, [units]);

  // Recovered topics belonging to this subject but not currently mapped to any chapter
  const unassignedTopics = useMemo(() => {
    return subjectTopics.filter(t => !units.some(u => isTopicInUnit(t, u)));
  }, [subjectTopics, units, isTopicInUnit]);

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
      const targetUnit = targetUnitId ? units.find(u => u.id === targetUnitId) : undefined;
      const targetUnitNum = targetUnit?.unit ?? (unitIndex !== undefined ? unitIndex + 1 : undefined);

      const { pdfResource, predictedQuestions } = await uploadAndProcessPdfFile(
        file,
        subject.id,
        targetUnitId,
        targetUnitNum,
        subject.name
      );

      onAddPdf(pdfResource);

      // Auto-add predicted questions if unitId is provided
      if (targetUnitId) {
        predictedQuestions.forEach(pq => {
          onAddQuestion({
            ...pq,
            unitId: targetUnitId,
            unit: typeof targetUnitNum === 'number' ? targetUnitNum : 1
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

  // Chapter Creation & Editing Handlers
  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    const unitNum = newUnitNumber || getNextMissingUnitNumber(units);

    if (onAddUnit) {
      onAddUnit(subject.id, `Unit ${unitNum}`, newUnitTitle.trim());
    } else {
      storageService.addUnit(subject.id, `Unit ${unitNum}`, newUnitTitle.trim());
    }

    setNewUnitTitle('');
    setShowAddUnitInput(false);
    onShowToast(`Unit ${unitNum}: "${newUnitTitle.trim()}" added to index! 📖`, 'success');
  };

  const handleSaveEditUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId || !editingUnitTitle.trim()) return;

    const unitNum = editingUnitNumber || 1;

    if (onRenameUnit) {
      onRenameUnit(subject.id, editingUnitId, `Unit ${unitNum}`, editingUnitTitle.trim());
    } else {
      storageService.renameUnit(subject.id, editingUnitId, `Unit ${unitNum}`, editingUnitTitle.trim());
    }

    setEditingUnitId(null);
    onShowToast(`Updated to Unit ${unitNum}: "${editingUnitTitle.trim()}"! ✏️`, 'success');
  };

  const handleDeleteUnitClick = (unitId: string, unitTitle: string) => {
    if (window.confirm(`Delete "${unitTitle}" and its topics? This cannot be undone.`)) {
      if (onDeleteUnit) {
        onDeleteUnit(subject.id, unitId);
      } else {
        storageService.deleteUnit(subject.id, unitId);
      }
      onShowToast(`Deleted "${unitTitle}"`, 'info');
      if (activeUnitId === unitId) {
        setActiveUnitId('all');
      }
    }
  };

  const handleAutoFillSyllabus = () => {
    if (onAutoFillSyllabus) {
      onAutoFillSyllabus(subject.id);
    } else {
      try {
        const res = storageService.autoFillSyllabusForSubject(subject.id);
        const updatedTopics = storageService.getTopics(undefined);
        if (onReorderTopics) onReorderTopics(updatedTopics);
        onShowToast(`✨ Populated ${res.topicsAdded} standard syllabus topics & ${res.pyqsAdded} PYQs for ${subject.name}!`, 'success');
      } catch (err) {
        console.error('Error auto-filling syllabus:', err);
        onShowToast('Could not auto-fill syllabus', 'error');
      }
    }
  };

  const handleCreateTopic = (unitId: string, unitIndex: number) => {
    if (!newTopicTitle.trim()) return;
    const targetUnit = units[unitIndex] || units.find(u => u.id === unitId);
    const unitLabel = targetUnit ? getUnitDisplayLabel(targetUnit) : `Unit ${unitIndex + 1}`;
    const unitNum = targetUnit?.unit ?? (unitIndex + 1);

    const newTopic: SyllabusTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: subject.id,
      unitId,
      unitNumber: unitNum,
      unitLabel,
      title: newTopicTitle.trim(),
      completed: false,
      mastery: 'weak',
      createdAt: Date.now()
    };

    onAddTopic(newTopic);
    setNewTopicTitle('');
    setAddTopicUnitId(null);
    onShowToast(`Topic added to ${unitLabel}! 📝`, 'success');
  };

  const handleCreateVideo = (unitId: string, unitIndex: number) => {
    if (!videoUrl.trim()) return;
    const extractedId = extractYoutubeId(videoUrl);
    if (!extractedId) {
      onShowToast('Please enter a valid YouTube video link', 'error');
      return;
    }
    const targetUnit = units[unitIndex] || units.find(u => u.id === unitId);
    const unitNum = targetUnit?.unit ?? (unitIndex + 1);

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
      unit: typeof unitNum === 'number' ? unitNum : 1
    };

    onAddVideo(newVid);
    setVideoTitle('');
    setVideoUrl('');
    setAddVideoUnitId(null);
    onShowToast('Video lecture attached to chapter! 🎬', 'success');
  };

  const handleCreatePyq = (unitId: string, unitIndex: number) => {
    if (!pyqQuestionText.trim()) return;
    const targetUnit = units[unitIndex] || units.find(u => u.id === unitId);
    const unitLabel = targetUnit ? getUnitDisplayLabel(targetUnit) : `Unit ${unitIndex + 1}`;
    const unitNum = targetUnit?.unit ?? (unitIndex + 1);

    const bulletsList = pyqBullets.split('\n').filter(b => b.trim().length > 0);

    const newQ: PYQQuestion = {
      id: `pyq_custom_${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      unit: typeof unitNum === 'number' ? unitNum : 1,
      unitTitle: targetUnit?.title || 'Chapter Questions',
      unitLabel,
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
              onClick={(e) => {
                e.stopPropagation();
                handleSelectUnit('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                activeUnitId === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              All Chapters ({units.length})
            </button>
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectUnit(u.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                  activeUnitId === u.id
                    ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                }`}
              >
                {getUnitDisplayLabel(u)}
              </button>
            ))}
          </div>

          {/* 3-Mode Revision Filter Pills: All Chapter Content | Weak Only | All Graphs & Diagrams */}
          <div className="flex items-center gap-1.5 shrink-0 bg-stone-200/80 dark:bg-stone-900/80 p-1 rounded-xl border border-stone-300 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setIsWeakOnly(false);
                setIsDiagramsOnlyView(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                !isWeakOnly && !isDiagramsOnlyView
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <span>📖 All Chapter Content</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWeakOnly(true);
                setIsDiagramsOnlyView(false);
                onShowToast('Exam Crunch: Showing only weak topics & pending items! 🎯', 'info');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                isWeakOnly && !isDiagramsOnlyView
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>🎯 Weak Only</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDiagramsOnlyView(true);
                setIsWeakOnly(false);
                onShowToast(`Viewing all visual graphs & diagrams for ${subject.name}! 🖼️`, 'info');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                isDiagramsOnlyView
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <span>🖼️ All Graphs & Diagrams</span>
              {unitImages.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 dark:bg-white/20 font-mono">
                  {unitImages.length}
                </span>
              )}
            </button>
          </div>
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

      {/* Empty Syllabus Auto-Fill Banner */}
      {subjectTopics.length === 0 && (
        <div className="w-full px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-stone-900 dark:text-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>This subject has empty chapters. Auto-fill verified college syllabus topics and past exam questions?</span>
          </div>
          <button 
            type="button" 
            onClick={handleAutoFillSyllabus}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Auto-Fill Standard Syllabus Topics</span>
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
                  {units.map((unit) => {
                    const isSelected = activeUnitId === unit.id;
                    const uTopics = subjectTopics.filter(t => isTopicInUnit(t, unit));
                    const uDone = uTopics.filter(t => t.completed).length;
                    const uVids = subjectVideos.filter(v => v.unitId === unit.id || v.unit === unit.unit).length;
                    const uPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === unit.unit).length;
                    const uPyqs = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === unit.unit).length;
                    const uImages = unitImages.filter(img => img.unitId === unit.id).length;

                    if (editingUnitId === unit.id) {
                      return (
                        <form 
                          key={unit.id}
                          onSubmit={handleSaveEditUnit} 
                          onClick={(e) => e.stopPropagation()} 
                          className="p-3 rounded-xl bg-stone-200 dark:bg-stone-900 border border-amber-500 space-y-2 animate-fade-slide-down"
                        >
                          <div className="text-[10px] font-mono font-bold text-amber-500 uppercase">
                            Edit Unit Number & Title
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20">
                              <label className="text-[9px] font-mono font-bold opacity-70">Unit #</label>
                              <input 
                                type="number" 
                                min={1} 
                                value={editingUnitNumber} 
                                onChange={(e) => setEditingUnitNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full px-2 py-1 text-xs font-mono font-bold rounded bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700" 
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[9px] font-mono font-bold opacity-70">Title</label>
                              <input 
                                type="text" 
                                value={editingUnitTitle} 
                                onChange={(e) => setEditingUnitTitle(e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700" 
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="submit" className="px-3 py-1 rounded bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button type="button" onClick={() => setEditingUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div 
                        key={unit.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUnit(unit.id);
                        }}
                        className={`group/toc p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected 
                            ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                            : 'border-transparent hover:border-stone-300 dark:hover:border-stone-800'
                        }`}
                      >
                        {/* Bold Chapter Title with Dotted Leaders leading to Done Count */}
                        <div className="flex items-baseline justify-between gap-1 text-sm">
                          <span className="font-extrabold tracking-tight text-amber-600 dark:text-amber-400 shrink-0">
                            {getUnitDisplayLabel(unit).toUpperCase()}:
                          </span>
                          <div className="flex-1 mx-1 border-b border-dotted border-stone-400/60 dark:border-stone-600" />
                          <span className="font-mono text-xs font-bold shrink-0 opacity-90">
                            {uDone}/{uTopics.length} Done
                          </span>
                        </div>

                        {/* Chapter Full Name + Action Buttons */}
                        <div className="flex items-start justify-between gap-2 mt-1 pl-1">
                          <div className="font-serif text-xs font-bold leading-snug flex-1">
                            {unit.title}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/toc:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUnitId(unit.id);
                                setEditingUnitNumber(parseUnitNumber(unit) !== Infinity ? parseUnitNumber(unit) : 1);
                                setEditingUnitTitle(unit.title);
                              }}
                              className="p-1 rounded hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-500 hover:text-amber-500"
                              title="Edit Chapter / Unit Number and Title"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnitClick(unit.id, unit.title);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-stone-500 hover:text-red-500"
                              title="Delete Chapter / Unit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Indented Sub-counts of Topics & Attachments */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pl-2 text-[10px] font-mono opacity-70">
                          <span>• {uTopics.length} Topics</span>
                          <span>• {uVids} Vids</span>
                          <span>• {uPdfs} PDFs</span>
                          <span>• {uPyqs} PYQs</span>
                          {uImages > 0 && <span className="text-amber-500 font-bold">• {uImages} Diagrams</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* + Add New Chapter (Unit) */}
                {showAddUnitInput ? (
                  <form onSubmit={handleCreateUnit} className="p-3 rounded-xl bg-stone-200 dark:bg-stone-900 border border-amber-500/50 space-y-2">
                    <div className="text-[10px] font-mono font-bold text-amber-500 uppercase">
                      New Chapter / Unit
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <label className="text-[10px] font-mono font-bold opacity-70">Unit #</label>
                        <input 
                          type="number" 
                          min={1}
                          value={newUnitNumber}
                          onChange={(e) => setNewUnitNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-mono font-bold opacity-70">Chapter Title</label>
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="e.g. Memory Management"
                          value={newUnitTitle}
                          onChange={(e) => setNewUnitTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                        />
                      </div>
                    </div>
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
                    onClick={() => {
                      setNewUnitNumber(getNextMissingUnitNumber(units));
                      setShowAddUnitInput(true);
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Chapter / Unit</span>
                  </button>
                )}

                {/* 1-Click Auto-Fill Syllabus in TOC */}
                <button
                  type="button"
                  onClick={handleAutoFillSyllabus}
                  className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Populate standard college syllabus topics and PYQs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Auto-Fill Standard Syllabus</span>
                </button>
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
                  📌 RECOVERED TOPICS & ITEMS TRAY (1-CLICK ASSIGN TO A CHAPTER)
                  ------------------------------------------------------------- */}
              {unassignedTopics.length > 0 && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 space-y-3 animate-fade-slide-up">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span className="text-sm">📌</span>
                      <span>Recovered Topics & Items ({unassignedTopics.length})</span>
                    </span>
                    <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400">
                      Select a chapter from the dropdown to assign immediately
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {unassignedTopics.map(topic => (
                      <div 
                        key={topic.id}
                        className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-amber-500/30 flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTopicCompleted(topic.id);
                                }}
                                className="text-stone-400 hover:text-emerald-500 transition-colors shrink-0"
                                title={topic.completed ? 'Mark pending' : 'Mark completed'}
                              >
                                {topic.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={`text-xs font-bold leading-snug line-clamp-2 ${
                                topic.completed ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'
                              }`}>
                                {topic.title}
                              </span>
                            </div>

                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                              topic.mastery === 'strong' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              topic.mastery === 'okay' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                              'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                              {topic.mastery}
                            </span>
                          </div>

                          {topic.notes && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-serif line-clamp-2 pl-6">
                              {topic.notes}
                            </p>
                          )}
                        </div>

                        {/* 1-Click "Assign to Unit ▾" Dropdown */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
                          <span className="text-[10px] font-mono opacity-60">
                            Unit Assignment:
                          </span>
                          <select
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold cursor-pointer transition-colors"
                            defaultValue=""
                            onChange={(e) => {
                              const targetUnitId = e.target.value;
                              if (!targetUnitId) return;
                              const targetUnit = units.find(u => u.id === targetUnitId);
                              if (!targetUnit) return;
                              const updatedTopic: SyllabusTopic = {
                                ...topic,
                                unitId: targetUnit.id,
                                unitNumber: targetUnit.unit
                              };
                              storageService.updateTopic(updatedTopic);
                              if (onReorderTopics) {
                                onReorderTopics(topics.map(t => t.id === topic.id ? updatedTopic : t));
                              }
                              onShowToast(`Topic assigned to ${getUnitDisplayLabel(targetUnit)}! 📌`, 'success');
                            }}
                          >
                            <option value="" disabled>Assign to Unit ▾</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>
                                {getUnitDisplayLabel(u)}: {u.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {getUnitDisplayLabel(u)}: {u.title.slice(0, 20)}...
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

              {/* =========================================================================
                  MASTER DIAGRAM & GRAPH GALLERY VIEW (1-Click Revision View)
                  ========================================================================= */}
              {isDiagramsOnlyView ? (
                <div className="space-y-6 animate-fade-slide-up">
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span>🖼️</span>
                        <span>Master Visual Diagram & Graph Review</span>
                      </h3>
                      <p className="text-xs font-serif opacity-80 mt-1 max-w-xl leading-relaxed">
                        Rapid high-yield review before your exam. All architecture diagrams, concept graphs, formula sheets, and visual PYQ question snapshots across all chapters of {subject.name}.
                      </p>
                    </div>

                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-amber-400 active:scale-95 shrink-0 transition-transform">
                      <Plus className="w-4 h-4" />
                      <span>+ Upload Diagram / Graph</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files) {
                            const defaultUId = (activeUnitId && activeUnitId !== 'all') ? activeUnitId : (units[0]?.id || '');
                            handleImageFilesUpload(e.target.files, defaultUId);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'all', label: 'All Visuals', count: unitImages.length },
                      { id: 'graph', label: '📊 Graphs', count: unitImages.filter(i => i.category === 'graph').length },
                      { id: 'diagram', label: '📐 Diagrams', count: unitImages.filter(i => i.category === 'diagram').length },
                      { id: 'pyq', label: '🔥 PYQ Snapshots', count: unitImages.filter(i => i.category === 'pyq').length },
                      { id: 'formula', label: '📝 Formulas', count: unitImages.filter(i => i.category === 'formula').length },
                      { id: 'handwritten', label: '✍️ Notes', count: unitImages.filter(i => i.category === 'handwritten').length }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDiagramCategoryFilter(tab.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          diagramCategoryFilter === tab.id
                            ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                        }`}
                      >
                        <span>{tab.label} ({tab.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* Diagrams Masonry Grid */}
                  {(() => {
                    const filtered = diagramCategoryFilter === 'all' 
                      ? unitImages 
                      : unitImages.filter(i => i.category === diagramCategoryFilter);

                    if (filtered.length === 0) {
                      return (
                        <div className="py-16 text-center border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-2xl p-6 space-y-2">
                          <div className="text-4xl">🖼️</div>
                          <h4 className="text-sm font-serif font-bold text-stone-700 dark:text-stone-300">
                            No visual diagrams found in this category.
                          </h4>
                          <p className="text-xs font-mono opacity-60">
                            Press Cmd+V / Ctrl+V anywhere to paste a diagram screenshot, or click Upload above.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filtered.map(img => {
                          const badge = formatImageCategoryBadge(img.category);
                          const parentUnit = units.find(u => u.id === img.unitId);
                          return (
                            <div 
                              key={img.id}
                              onClick={() => setLightboxImageId(img.id)}
                              className="group/mcard relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between"
                            >
                              <div>
                                <div className="relative w-full h-44 bg-stone-950 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={img.dataUrl} 
                                    alt={img.title} 
                                    className="w-full h-full object-cover group-hover/mcard:scale-105 transition-transform duration-300" 
                                  />
                                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border backdrop-blur-md ${badge.color}`}>
                                      {badge.icon} {badge.label}
                                    </span>
                                  </div>
                                  {parentUnit && (
                                    <div className="absolute bottom-2 left-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-amber-400 border border-amber-500/30">
                                        {getUnitDisplayLabel(parentUnit)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover/mcard:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteUnitImageClick(img.id, img.title);
                                      }}
                                      className="p-1 rounded-md bg-red-600/90 text-white shadow hover:bg-red-700"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3.5 space-y-1.5">
                                  <h4 className="font-serif font-black text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                                    {img.title}
                                  </h4>
                                  {img.examNotes ? (
                                    <p className="text-xs font-serif text-stone-600 dark:text-stone-400 line-clamp-2 italic">
                                      💡 {img.examNotes}
                                    </p>
                                  ) : (
                                    <p className="text-[10px] font-mono text-stone-400">
                                      Click to view full-screen, self-test labels, and zoom.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="px-3.5 pb-3 pt-1 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[10px] font-mono opacity-75">
                                <span>{img.fileSize || 'Visual'}</span>
                                <span className="text-amber-500 font-bold group-hover/mcard:underline flex items-center gap-1">
                                  <Maximize2 className="w-3 h-3" />
                                  <span>View Full Screen</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* RENDER EACH CHAPTER IN BOLD TEXTBOOK HIERARCHY */
                displayedUnits.map((unit) => {
                const uIndex = units.findIndex(u => u.id === unit.id);
                const uLabel = getUnitDisplayLabel(unit);

                // Filter nested items for this specific chapter (match unit.id or saved unit number, never array index)
                let cTopics = subjectTopics.filter(t => isTopicInUnit(t, unit));
                let cVids = subjectVideos.filter(v => v.unitId === unit.id || v.unit === unit.unit);
                let cPdfs = subjectPdfs.filter(p => p.unitId === unit.id || p.unit === unit.unit);
                let cPyqs = subjectQuestions.filter(q => q.unitId === unit.id || q.unit === unit.unit);
                const uImages = unitImages.filter(img => img.unitId === unit.id);

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
                          {uLabel.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* ✏️ Edit Chapter / Unit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnitId(unit.id);
                              setEditingUnitNumber(parseUnitNumber(unit) !== Infinity ? parseUnitNumber(unit) : 1);
                              setEditingUnitTitle(unit.title);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-mono font-bold text-[11px] flex items-center gap-1 active:scale-95"
                            title="Edit Unit Number and Title"
                          >
                            <Edit2 className="w-3 h-3 text-amber-500" />
                            <span>Edit Unit</span>
                          </button>

                          {/* 🗑️ Delete Chapter */}
                          <button
                            type="button"
                            onClick={() => handleDeleteUnitClick(unit.id, unit.title)}
                            className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-mono font-bold text-[11px] flex items-center gap-1 active:scale-95"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>

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
                                {/* Checkbox + Topic Title or Rename Form */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleTopicCompleted(topic.id);
                                    }}
                                    className="text-stone-400 hover:text-emerald-500 transition-colors shrink-0"
                                    title={topic.completed ? 'Mark pending' : 'Mark completed'}
                                  >
                                    {topic.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>

                                  {editingTopicId === topic.id ? (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (editingTopicTitle.trim()) {
                                          onUpdateTopicTitle?.(topic.id, editingTopicTitle.trim());
                                          setEditingTopicId(null);
                                        }
                                      }}
                                      className="flex items-center gap-1.5 flex-1 min-w-0"
                                    >
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editingTopicTitle}
                                        onChange={(e) => setEditingTopicTitle(e.target.value)}
                                        className="flex-1 px-2 py-0.5 rounded border border-amber-500 bg-white dark:bg-stone-900 text-xs font-serif font-bold text-stone-900 dark:text-stone-100"
                                      />
                                      <button type="submit" onClick={(e) => e.stopPropagation()} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded" title="Save Title">
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTopicId(null); }} className="p-1 text-stone-400 hover:text-stone-600 rounded" title="Cancel">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </form>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0 group/topic">
                                      <span 
                                        title={topic.title}
                                        className={`font-serif font-bold break-words cursor-pointer ${topic.completed ? 'line-through opacity-60' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTopicId(topic.id);
                                          setEditingTopicTitle(topic.title);
                                        }}
                                      >
                                        {tIdx + 1}. {topic.title}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTopicId(topic.id);
                                          setEditingTopicTitle(topic.title);
                                        }}
                                        className="opacity-0 group-hover/topic:opacity-100 p-0.5 text-stone-400 hover:text-amber-500 transition-opacity"
                                        title="Rename topic"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      {onReorderTopics && (
                                        <div className="opacity-0 group-hover/topic:opacity-100 flex items-center gap-0.5 transition-opacity">
                                          <button
                                            type="button"
                                            disabled={tIdx === 0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMoveTopic(topic, 'up', cTopics);
                                            }}
                                            className="p-0.5 text-stone-400 hover:text-stone-600 disabled:opacity-20"
                                            title="Move Up"
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={tIdx === cTopics.length - 1}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMoveTopic(topic, 'down', cTopics);
                                            }}
                                            className="p-0.5 text-stone-400 hover:text-stone-600 disabled:opacity-20"
                                            title="Move Down"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Dotted Leader Lines */}
                                <div className="flex-1 mx-2 border-b border-dotted border-stone-400/50 dark:border-stone-600" />

                                {/* Controls: Weak / Okay / Strong + Note Expander + Delete */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-700 p-0.5 text-[10px] font-mono">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSetTopicMastery(topic.id, 'weak');
                                      }}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isWeak ? 'bg-red-500 text-white' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Weak
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSetTopicMastery(topic.id, 'okay');
                                      }}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isOkay ? 'bg-amber-500 text-stone-950' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Okay
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSetTopicMastery(topic.id, 'strong');
                                      }}
                                      className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                        isStrong ? 'bg-emerald-500 text-white' : 'opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      Strong
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedTopicNoteId(isNoteOpen ? null : topic.id);
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-stone-300 dark:border-stone-700 hover:border-amber-500"
                                  >
                                    {topic.notes ? 'View Note' : '+ Note'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTopic(topic.id);
                                    }}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
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

                      {/* Empty Chapter State with 1-Click Auto-Fill */}
                      {cTopics.length === 0 && addTopicUnitId !== unit.id && (
                        <div className="py-6 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2.5">
                          <p className="text-xs font-serif text-stone-500 italic">No syllabus topics in this chapter yet.</p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAddTopicUnitId(unit.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 flex items-center gap-1.5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Topic</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleAutoFillSyllabus}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>✨ Auto-Fill Standard Topics</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Input to Add Topic */}
                      {addTopicUnitId === unit.id && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-200/80 dark:bg-stone-900 border border-amber-500/40">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Topic title (e.g. Critical Section & Peterson's Algorithm)" 
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateTopic(unit.id, uIndex);
                              }
                            }}
                            className="flex-1 px-3 py-1.5 rounded text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTopic(unit.id, uIndex);
                            }}
                            className="px-3 py-1.5 rounded bg-amber-500 text-stone-950 font-bold text-xs"
                          >
                            Add
                          </button>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddTopicUnitId(null);
                            }} 
                            className="p-1 text-stone-400"
                          >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddVideoUnitId(addVideoUnitId === unit.id ? null : unit.id);
                          }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleVideoWatched(vid.id);
                                    }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineVideoId(isPlaying ? null : vid.id);
                                    }}
                                    className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center gap-1"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>{isPlaying ? 'Close Player' : 'Watch Inline'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteVideo(vid.id);
                                    }}
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
                                  {units.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {getUnitDisplayLabel(u)}: {u.title.slice(0, 18)}...
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => onDeletePdf(pdf.id)}
                                  className="p-1 text-stone-400 hover:text-red-500"
                                  title="Delete Document"
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
                            <span>Upload PDF or Image Notes to IndexedDB</span>
                            <button type="button" onClick={() => setAddPdfUnitId(null)} className="p-1 text-stone-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* File Upload Button */}
                            <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-400 transition-colors shadow-sm">
                              <Upload className="w-4 h-4" />
                              <span>{isUploadingPdf ? 'Storing in IndexedDB...' : 'Choose PDF or Image File'}</span>
                              <input 
                                type="file" 
                                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/jpg" 
                                onChange={(e) => handleFileUpload(e, unit.id)}
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
                                  unit: unit.unit ?? (uIndex + 1)
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

                                  {/* Attached Diagram / Snapshots for this PYQ */}
                                  {(() => {
                                    const qImages = unitImages.filter(img => img.pyqId === q.id);
                                    if (qImages.length === 0) return null;
                                    return (
                                      <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                                        <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                                          <span>🖼️ Attached Question Diagrams ({qImages.length}):</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {qImages.map(img => (
                                            <div 
                                              key={img.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxImageId(img.id);
                                              }}
                                              className="group/qimg relative w-20 h-16 rounded-lg overflow-hidden border border-amber-500/40 bg-stone-950 cursor-pointer hover:scale-105 transition-all shadow-xs"
                                              title={`${img.title} (Click to Enlarge)`}
                                            >
                                              <img src={img.dataUrl} alt={img.title} className="w-full h-full object-cover" />
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/qimg:opacity-100 flex items-center justify-center text-white text-[9px] font-mono font-bold transition-opacity">
                                                🔍 Enlarge
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Attach Diagram to Question */}
                                  <label 
                                    className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1 shrink-0"
                                    title="Attach diagram, graph or question snapshot to this PYQ"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ImageIcon className="w-3 h-3 text-amber-500" />
                                    <span>+ Diagram</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      multiple 
                                      className="hidden" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          handleImageFilesUpload(e.target.files, unit.id, q.id);
                                        }
                                      }}
                                    />
                                  </label>

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

                    {/* -----------------------------------------------------------------
                        E. UNIT GRAPHS, DIAGRAMS & VISUAL PYQ SNAPSHOTS
                        ----------------------------------------------------------------- */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="text-sm">🖼️</span>
                          <span>E. Unit Graphs, Diagrams & Visuals ({uImages.length})</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Upload Image(s)</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleImageFilesUpload(e.target.files, unit.id);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Drag & Drop Zone + Gallery Grid */}
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files) {
                            handleImageFilesUpload(e.dataTransfer.files, unit.id);
                          }
                        }}
                        className="p-3 sm:p-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-800 bg-stone-500/5 transition-all"
                      >
                        {uImages.length === 0 ? (
                          <label className="cursor-pointer flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                              <ImageIcon className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-xs font-serif font-bold text-stone-700 dark:text-stone-300">
                              No diagrams or graphs added to this Chapter yet.
                            </p>
                            <p className="text-[10px] font-mono opacity-60 mt-0.5">
                              Click to upload, drag & drop files, or press <kbd className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono">Cmd+V</kbd> / <kbd className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono">Ctrl+V</kbd> to paste screenshots
                            </p>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleImageFilesUpload(e.target.files, unit.id);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {uImages.map(img => {
                              const badge = formatImageCategoryBadge(img.category);
                              return (
                                <div 
                                  key={img.id}
                                  onClick={() => setLightboxImageId(img.id)}
                                  className="group/img relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                                >
                                  <div className="absolute top-1.5 left-1.5 z-10">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border backdrop-blur-xs flex items-center gap-1 ${badge.color}`}>
                                      <span>{badge.icon}</span>
                                      <span className="hidden sm:inline">{badge.label}</span>
                                    </span>
                                  </div>

                                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteUnitImageClick(img.id, img.title);
                                      }}
                                      className="p-1 rounded-md bg-red-600/90 text-white shadow hover:bg-red-700"
                                      title="Delete diagram"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="w-full h-28 bg-stone-950 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={img.dataUrl} 
                                      alt={img.title} 
                                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                                    />
                                  </div>

                                  <div className="p-2 space-y-1">
                                    <div className="text-[11px] font-serif font-bold break-words line-clamp-2 text-stone-900 dark:text-stone-100" title={img.title}>
                                      {img.title}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono opacity-60">
                                      <span>{img.fileSize || 'Visual'}</span>
                                      <span className="text-amber-500 font-bold group-hover/img:underline flex items-center gap-0.5">
                                        <Maximize2 className="w-2.5 h-2.5" />
                                        <span>Enlarge</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </section>
                );
              })
              )}
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

      {/* =========================================================================
          FULL-SCREEN DIAGRAM LIGHTBOX MODAL (Rapid Flipper, Occlusion Self-Test & Zoom)
          ========================================================================= */}
      {lightboxImageId && (
        <DiagramLightboxModal
          images={unitImages}
          initialImageId={lightboxImageId}
          onClose={() => setLightboxImageId(null)}
          onDeleteImage={(id) => {
            const img = unitImages.find(i => i.id === id);
            handleDeleteUnitImageClick(id, img?.title || 'Diagram');
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* =========================================================================
          INSTANT CLIPBOARD SCREENSHOT (Cmd+V / Ctrl+V) SAVE MODAL
          ========================================================================= */}
      {pastedImageDataUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-amber-500/50 rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-black text-sm sm:text-base text-amber-400 flex items-center gap-2">
                <span>📸</span>
                <span>Attach Screenshot to Chapter Gallery</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setPastedImageDataUrl(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="w-full h-44 bg-black/60 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
              <img src={pastedImageDataUrl} alt="Pasted" className="w-full h-full object-contain" />
            </div>

            {/* Inputs: Title, Category, Chapter */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400">
                  Diagram / Snapshot Title:
                </label>
                <input
                  type="text"
                  value={pastedImageTitle}
                  onChange={(e) => setPastedImageTitle(e.target.value)}
                  placeholder="e.g. Memory Hierarchy Graph, Architecture Diagram..."
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-black/50 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-stone-400">
                    Category:
                  </label>
                  <select
                    value={pastedImageCategory}
                    onChange={(e) => setPastedImageCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-black/50 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="diagram">📐 Diagram</option>
                    <option value="graph">📊 Graph</option>
                    <option value="pyq">🔥 PYQ Snapshot</option>
                    <option value="formula">📝 Formula Sheet</option>
                    <option value="handwritten">✍️ Handwritten Note</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-stone-400">
                    Assign to Chapter:
                  </label>
                  <select
                    value={pastedImageUnitId}
                    onChange={(e) => setPastedImageUnitId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-black/50 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getUnitDisplayLabel(u)}: {u.title.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPastedImageDataUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={handleSavePastedImage}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>{isUploadingImage ? 'Saving...' : 'Save to Diagram Gallery'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
