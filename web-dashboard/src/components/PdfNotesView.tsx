import React, { useState, useEffect, useMemo } from 'react';
import { SubjectMeta, PdfResource, PYQQuestion, Flashcard, SyllabusTopic, SubjectFile } from '../types';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { formatUnitDisplayName } from '../utils/storageService';
import { indexedDbService } from '../utils/indexedDbService';
import { 
  analyzeExtractedNotes, 
  cleanExtractedText,
  detectStructureAndHeadings,
  assessTextQuality,
  runOcrOnImage, 
  runOcrOnScannedPdf, 
  NotesAnalysisResult, 
  PracticeQuestionItem,
  SectionHeading
} from '../utils/notesAnalyzer';
import { 
  getSavedApiKey, 
  saveApiKey, 
  deleteApiKey, 
  getSavedModel, 
  saveModel, 
  listSupportedModels,
  testApiKey, 
  runSmartAnalysis 
} from '../utils/aiService';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  Check, 
  Trash2, 
  Eye, 
  BookOpen, 
  Plus, 
  ArrowRight,
  Brain,
  Flame,
  X,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  ListTree,
  FunctionSquare,
  Code2,
  Download,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  Settings,
  ShieldAlert,
  EyeOff,
  Lock
} from 'lucide-react';

interface PdfNotesViewProps {
  subjects: SubjectMeta[];
  activeSubjectId: string;
  topics?: SyllabusTopic[];
  pdfs: PdfResource[];
  onAddPdf: (pdf: PdfResource) => void;
  onDeletePdf: (id: string) => void;
  onAddQuestion: (q: PYQQuestion) => void;
  onAddFlashcard: (card: Flashcard) => void;
  onAddTopic?: (topic: SyllabusTopic) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PdfNotesView: React.FC<PdfNotesViewProps> = ({
  subjects,
  activeSubjectId,
  topics = [],
  pdfs,
  onAddPdf,
  onDeletePdf,
  onAddQuestion,
  onAddFlashcard,
  onAddTopic,
  onShowToast
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubjectId || subjects[0]?.id || 'os');
  // REQUIREMENT 5.a: Do not pre-select a subject. Show "Choose subject" and "Choose unit".
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [suggestedSubject, setSuggestedSubject] = useState<SubjectMeta | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ percent: number; status: string } | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<NotesAnalysisResult | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);

  // Editable practice questions state
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestionItem[]>([]);

  // Selected headings for "Add headings as topics"
  const [selectedHeadings, setSelectedHeadings] = useState<Record<string, boolean>>({});

  // Full Note Modal
  const [viewingPdf, setViewingPdf] = useState<PdfResource | null>(null);

  // ==========================================
  // SMART ANALYSIS (AI) STATE & SETTINGS
  // ==========================================
  const [smartAnalysisEnabled, setSmartAnalysisEnabled] = useState<boolean>(false);
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [hasSavedApiKey, setHasSavedApiKey] = useState<boolean>(false);
  // Do not hardcode any single model name
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [showAiSettings, setShowAiSettings] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKeyText, setShowApiKeyText] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testKeyResult, setTestKeyResult] = useState<{ success: boolean; message: string } | null>(null);

  // AI execution indicators
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiProgressMessage, setAiProgressMessage] = useState<string>('');
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [usedAiMode, setUsedAiMode] = useState<boolean>(false);

  // Load saved credentials from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    getSavedApiKey().then(key => {
      if (!isMounted) return;
      if (key) {
        setSavedApiKey(key);
        setApiKeyInput(key);
        setHasSavedApiKey(true);
      } else {
        setHasSavedApiKey(false);
        setSmartAnalysisEnabled(false);
      }
    });

    getSavedModel().then(m => {
      if (!isMounted) return;
      if (m) setSelectedModel(m);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // When opening Settings, fetch available models supporting generateContent
  useEffect(() => {
    if (showAiSettings) {
      const keyToUse = apiKeyInput.trim() || savedApiKey;
      if (keyToUse) {
        setIsLoadingModels(true);
        listSupportedModels(keyToUse)
          .then(models => {
            setAvailableModels(models);
            if (!selectedModel && models.length > 0) {
              // Leave default choice algorithm to pick if none chosen
            }
          })
          .catch(() => {
            // Error will be surfaced via Test Key if needed
          })
          .finally(() => setIsLoadingModels(false));
      }
    }
  }, [showAiSettings, savedApiKey, apiKeyInput, selectedModel]);

  const targetSubject = subjects.find(s => s.id === targetSubjectId);
  const selectedUnit = targetSubject?.units?.find(u => u.id === targetUnitId);
  const subjectPdfs = pdfs.filter(p => p.subjectId === selectedSubjectId);

  // Check which headings already exist as topics in current subject/unit
  const existingTopicTitles = useMemo(() => {
    return new Set(
      topics
        .filter(t => t.subjectId === targetSubjectId)
        .map(t => t.title.toLowerCase().trim())
    );
  }, [topics, targetSubjectId]);

  // Process and analyze extracted notes (Rule-based default with Optional Smart AI)
  const applyAnalysis = async (rawText: string, fileName: string) => {
    const quality = assessTextQuality(rawText);
    const cleanedText = cleanExtractedText(rawText);
    const headings = detectStructureAndHeadings(cleanedText);
    setEditableText(cleanedText || rawText);

    // Initialize heading checkboxes: pre-check non-existing headings
    const initialHeadingSelection: Record<string, boolean> = {};
    headings.forEach(h => {
      const alreadyExists = existingTopicTitles.has(h.cleanTitle.toLowerCase().trim());
      initialHeadingSelection[h.id] = !alreadyExists;
    });
    setSelectedHeadings(initialHeadingSelection);

    // OPTIONAL SMART ANALYSIS MODE
    if (smartAnalysisEnabled && savedApiKey && rawText.trim().length >= 45) {
      setIsAiAnalyzing(true);
      setAiAnalysisError(null);
      setAiProgressMessage('Connecting to AI model...');

      try {
        const aiResult = await runSmartAnalysis(
          cleanedText,
          savedApiKey,
          selectedModel,
          (msg) => setAiProgressMessage(msg),
          (workingModel) => {
            setSelectedModel(workingModel);
          }
        );

        setAnalysis({
          rawText,
          cleanedText,
          quality,
          headings, // keeps the detected outline sections
          summary: aiResult.summary,
          keyTerms: aiResult.keyTerms,
          formulasAndAlgorithms: aiResult.formulasAndAlgorithms,
          practiceQuestions: aiResult.practiceQuestions
        });
        setPracticeQuestions(aiResult.practiceQuestions);
        setUsedAiMode(true);
      } catch (aiErr: any) {
        console.warn('Smart AI Analysis failed, falling back to rule-based analysis:', aiErr);
        // Requirement 4: Short, plain messages, never printing the raw provider stack or API key
        setAiAnalysisError('Could not reach any model, check your key or internet. Fell back to Rule-Based Extractor.');
        
        // Fall back to rule-based extractor
        const ruleResult = analyzeExtractedNotes(rawText);
        setAnalysis(ruleResult);
        setPracticeQuestions(ruleResult.practiceQuestions);
        setUsedAiMode(false);
      } finally {
        setIsAiAnalyzing(false);
        setAiProgressMessage('');
      }
    } else {
      // RULE-BASED EXTRACTOR (Default & Fallback)
      const ruleResult = analyzeExtractedNotes(rawText);
      setAnalysis(ruleResult);
      setPracticeQuestions(ruleResult.practiceQuestions);
      setUsedAiMode(false);
      setAiAnalysisError(null);
    }
  };

  // File Upload & OCR Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_SIZE) {
      onShowToast(`Warning: "${file.name}" exceeds 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Large files may impact performance or exceed browser memory.`, 'error');
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setOcrProgress(null);
    setAnalysis(null);
    setAiAnalysisError(null);

    // Requirement 5.a: Suggest subject if file name matches a subject, but do NOT select it
    const cleanFileName = file.name.toLowerCase().replace(/[_\-\.]+/g, ' ');
    const matchedSubject = subjects.find(s => {
      const sName = s.name.toLowerCase();
      const sCode = s.code ? s.code.toLowerCase() : '';
      return cleanFileName.includes(sName) || (sCode && cleanFileName.includes(sCode)) ||
        s.name.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => cleanFileName.includes(w));
    });
    setSuggestedSubject(matchedSubject || null);
    setTargetSubjectId('');
    setTargetUnitId('');

    // Read Data URL for saving to IndexedDB / previewing
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
      let rawText = '';

      if (isImg) {
        // Image OCR with progress
        setOcrProgress({ percent: 10, status: 'Loading OCR engine for image...' });
        rawText = await runOcrOnImage(file, (percent, status) => {
          setOcrProgress({ percent, status });
        });
      } else {
        // PDF: first attempt native text layer extraction
        setOcrProgress({ percent: 15, status: 'Extracting text layer from PDF...' });
        try {
          rawText = await extractTextFromPdf(file);
        } catch (pdfErr) {
          console.warn('Native PDF extraction failed, falling back to OCR:', pdfErr);
          rawText = '';
        }

        // If PDF text is empty or virtually non-existent (< 50 chars), it's a scanned PDF
        const cleanCheck = rawText.replace(/[-—_]{2,}\s*Page\s*\d+\s*[-—_]{2,}/gi, '').trim();
        if (cleanCheck.length < 50) {
          setOcrProgress({ percent: 25, status: 'Scanned PDF detected (no text layer). Running OCR on pages...' });
          rawText = await runOcrOnScannedPdf(file, (percent, status) => {
            setOcrProgress({ percent, status });
          });
        }
      }

      await applyAnalysis(rawText, file.name);

      if (rawText.trim().length >= 45) {
        onShowToast('Notes extracted successfully! Review outline, summary, and questions below.', 'success');
      } else {
        onShowToast('File text was too sparse or unreadable. See Quality Guard below.', 'info');
      }
    } catch (err: any) {
      console.error('File processing error:', err);
      onShowToast(err.message || 'Error processing file. Try another file or paste text below.', 'error');
      await applyAnalysis('', file.name);
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  // Re-run analysis on user-edited text
  const handleReanalyze = async () => {
    if (!editableText.trim()) {
      onShowToast('Please enter or paste notes text to analyze.', 'info');
      return;
    }
    const fileName = selectedFile?.name || 'Manual Notes';
    await applyAnalysis(editableText, fileName);
    onShowToast('Re-analyzed notes successfully!', 'success');
  };

  // Update question marks
  const handleQuestionMarksChange = (id: string, newMarks: 2 | 5 | 10) => {
    setPracticeQuestions(prev => prev.map(q => q.id === id ? { ...q, marks: newMarks } : q));
  };

  // Update question text
  const handleQuestionTextChange = (id: string, newText: string) => {
    setPracticeQuestions(prev => prev.map(q => q.id === id ? { ...q, question: newText } : q));
  };

  // ACTION: Toggle Smart AI Mode
  const handleToggleSmartMode = () => {
    if (!hasSavedApiKey) {
      setShowAiSettings(true);
      onShowToast('Please configure and save your Gemini API Key in Settings first.', 'info');
      return;
    }
    const nextState = !smartAnalysisEnabled;
    setSmartAnalysisEnabled(nextState);
    if (nextState) {
      onShowToast('Smart Analysis (AI) enabled! Next analysis will use your Gemini key.', 'success');
    } else {
      onShowToast('Smart Analysis OFF. Using fast offline rule-based extractor.', 'info');
    }
  };

  // ACTION: Test API Key
  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestKeyResult({ success: false, message: 'Please enter an API key to test.' });
      return;
    }
    setIsTestingKey(true);
    setTestKeyResult(null);
    try {
      const res = await testApiKey(apiKeyInput.trim(), selectedModel);
      setTestKeyResult({ success: res.success, message: res.message });
      if (res.models && res.models.length > 0) {
        setAvailableModels(res.models);
      }
      if (res.workingModel) {
        setSelectedModel(res.workingModel);
      }
      if (res.success) {
        onShowToast(res.message, 'success');
      } else {
        onShowToast(res.message, 'error');
      }
    } catch (e: any) {
      const msg = e.message || 'Could not reach any model, check your key or internet';
      setTestKeyResult({ success: false, message: msg });
      onShowToast(msg, 'error');
    } finally {
      setIsTestingKey(false);
    }
  };

  // ACTION: Save API Key
  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      onShowToast('Please enter an API key before saving.', 'info');
      return;
    }
    try {
      await saveApiKey(apiKeyInput.trim());
      if (selectedModel) {
        await saveModel(selectedModel);
      }
      setSavedApiKey(apiKeyInput.trim());
      setHasSavedApiKey(true);
      setShowAiSettings(false);
      onShowToast('API Key securely stored in browser IndexedDB! 🔑', 'success');
    } catch (e: any) {
      onShowToast('Failed to save API key in IndexedDB: ' + e.message, 'error');
    }
  };

  // ACTION: Delete API Key
  const handleDeleteKey = async () => {
    if (!window.confirm('Are you sure you want to delete your API key from IndexedDB?')) {
      return;
    }
    try {
      await deleteApiKey();
      setSavedApiKey(null);
      setApiKeyInput('');
      setHasSavedApiKey(false);
      setSmartAnalysisEnabled(false);
      setTestKeyResult(null);
      setShowAiSettings(false);
      onShowToast('API key deleted from browser.', 'info');
    } catch (e: any) {
      onShowToast('Error deleting API key: ' + e.message, 'error');
    }
  };

  // ACTION 1: Add Headings as Topics to Selected Unit
  const handleAddHeadingsAsTopics = () => {
    if (!analysis || !onAddTopic) return;
    if (!targetSubject || !selectedUnit) {
      onShowToast('Please choose a subject and unit first.', 'info');
      return;
    }
    const unitId = selectedUnit.id || 'u1';
    const unitNum = selectedUnit.unit || 1;

    const headingsToAdd = analysis.headings.filter(h => {
      const isChecked = selectedHeadings[h.id];
      const alreadyExists = existingTopicTitles.has(h.cleanTitle.toLowerCase().trim());
      return isChecked && !alreadyExists;
    });

    if (headingsToAdd.length === 0) {
      onShowToast('No new headings selected to add as topics.', 'info');
      return;
    }

    let addedCount = 0;
    headingsToAdd.forEach(h => {
      const newTopic: SyllabusTopic = {
        id: `topic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        subjectId: targetSubjectId,
        unitNumber: unitNum,
        unitId,
        unitLabel: formatUnitDisplayName(selectedUnit),
        title: h.cleanTitle,
        completed: false,
        mastery: 'weak',
        createdAt: Date.now()
      };
      onAddTopic(newTopic);
      addedCount++;
    });

    setSelectedHeadings(prev => {
      const updated = { ...prev };
      headingsToAdd.forEach(h => { updated[h.id] = false; });
      return updated;
    });

    onShowToast(`Added ${addedCount} topics to ${targetSubject.name} (${formatUnitDisplayName(selectedUnit)})! 📚`, 'success');
  };

  // ACTION 2: Create Flashcards from Key Terms
  const handleCreateFlashcards = () => {
    if (!analysis || analysis.keyTerms.length === 0) {
      onShowToast('No key terms found to create flashcards.', 'info');
      return;
    }
    if (!targetSubject || !selectedUnit) {
      onShowToast('Please choose a subject and unit first.', 'info');
      return;
    }

    analysis.keyTerms.forEach((kt, idx) => {
      const card: Flashcard = {
        id: `fc-pdf-${Date.now().toString(36)}-${idx}`,
        subjectId: targetSubjectId as any,
        unitId: selectedUnit.id || `u1`,
        front: kt.term,
        back: kt.definition,
        intervalStep: 0,
        nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: Date.now()
      };
      onAddFlashcard(card);
    });

    onShowToast(`Created ${analysis.keyTerms.length} flashcards under ${targetSubject.name}! 🗂️`, 'success');
  };

  // ACTION 3: Add Practice Questions to PYQ Bank
  const handleSaveQuestionsToPyqBank = () => {
    if (practiceQuestions.length === 0) {
      onShowToast('No practice questions available to add.', 'info');
      return;
    }
    if (!targetSubject || !selectedUnit) {
      onShowToast('Please choose a subject and unit first.', 'info');
      return;
    }

    const currentYear = new Date().getFullYear();
    practiceQuestions.forEach((pq) => {
      const newQuestion: PYQQuestion = {
        id: `pq-bank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        subjectId: targetSubjectId as any,
        subjectName: targetSubject.name,
        unit: selectedUnit.unit || 1,
        unitTitle: formatUnitDisplayName(selectedUnit),
        unitLabel: formatUnitDisplayName(selectedUnit),
        unitId: selectedUnit.id,
        question: pq.question,
        marks: pq.marks,
        yearsAsked: [currentYear],
        repeatCount: 1,
        isHighProbability: false,
        expectedKeywords: [],
        bullets: [],
        diagramFormulaTip: '',
        userStatus: 'not-started',
        isCustom: true
      };
      onAddQuestion(newQuestion);
    });

    onShowToast(`Added ${practiceQuestions.length} practice questions to PYQ Bank for ${targetSubject.name}! 📝`, 'success');
  };

  // ACTION 4: Save Original File to IndexedDB & Notes Library
  const handleSaveToSubject = async () => {
    if (!targetSubject || !selectedUnit) {
      onShowToast('Please choose a subject and unit before saving.', 'info');
      return;
    }
    if (!selectedFile && !editableText) {
      onShowToast('No file or text to save.', 'info');
      return;
    }

    const fileName = selectedFile?.name || `${targetSubject.name}_Notes.txt`;
    const unitLabelDisplay = formatUnitDisplayName(selectedUnit);

    // 1. Store original file in IndexedDB under selected subject & unit
    if (fileDataUrl && selectedFile) {
      try {
        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
        const newSubjectFile: SubjectFile = {
          id: `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId: targetSubjectId,
          name: fileName,
          category: 'notes',
          fileType: isPdf ? 'pdf' : 'image',
          dataUrl: fileDataUrl,
          size: selectedFile.size,
          year: String(new Date().getFullYear()),
          examType: 'Lecture Notes',
          isImportant: false,
          isDone: false,
          unitId: selectedUnit.id,
          createdAt: Date.now()
        };
        await indexedDbService.addFile(newSubjectFile);
      } catch (idbErr) {
        console.error('Error saving to IndexedDB:', idbErr);
      }
    }

    // 2. Save note in PDF state library
    const newPdf: PdfResource = {
      id: `pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId: targetSubjectId,
      unit: selectedUnit.unit || 1,
      unitId: selectedUnit.id || `u1`,
      fileName,
      uploadDate: new Date().toLocaleDateString(),
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
      extractedText: editableText || analysis?.cleanedText || '',
      summary: analysis?.summary?.join(' ') || 'Summary not available.',
      extractedQuestions: practiceQuestions.map(q => q.question)
    };

    onAddPdf(newPdf);
    onShowToast(`Saved file & notes under ${targetSubject.name} (${unitLabelDisplay}) in IndexedDB! 💾`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-slide-up w-full pb-16">
      
      {/* 1. HONEST NAMING: Header & Smart Analysis Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-paper-ink dark:text-night-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>PDF Notes Extractor</span>
          </h2>
          <p className="text-xs text-paper-muted dark:text-night-muted mt-0.5">
            Extract clean outlines, key terms, formulas, and practice questions from chapter PDFs, scanned notes, and images.
          </p>
        </div>

        {/* Smart Analysis Mode Toggle & Settings Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Smart Analysis Toggle */}
          <div 
            onClick={handleToggleSmartMode}
            className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
              smartAnalysisEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                : 'bg-paper-cardElevated dark:bg-night-cardElevated border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted'
            }`}
            title={hasSavedApiKey ? "Toggle Smart AI Analysis" : "Click to configure your Gemini API Key in Settings"}
          >
            <Sparkles className={`w-3.5 h-3.5 ${smartAnalysisEnabled ? 'text-amber-500 fill-amber-500' : 'text-paper-muted'}`} />
            <span>Smart Analysis (AI)</span>
            <div className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
              smartAnalysisEnabled ? 'bg-amber-500' : 'bg-paper-border dark:bg-night-border'
            }`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                smartAnalysisEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </div>

          {/* AI Settings Button */}
          <button
            onClick={() => setShowAiSettings(true)}
            className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-medium text-paper-ink dark:text-night-text hover:border-paper-ink/30 flex items-center gap-1.5 btn-tactile"
            title="Configure Gemini API Key & Model Settings"
          >
            <Key className="w-3.5 h-3.5 text-paper-muted dark:text-night-muted" />
            <span>Settings</span>
            <span className={`w-2 h-2 rounded-full ${hasSavedApiKey ? 'bg-emerald-500' : 'bg-paper-border dark:bg-night-border'}`} />
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-8 rounded-3xl bg-paper-card dark:bg-night-card border-2 border-dashed border-paper-border dark:border-night-border hover:border-emerald-500 transition-all text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
          {isProcessing || isAiAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-paper-ink dark:text-night-text">
            {isProcessing ? (ocrProgress?.status || 'Processing Document...') : isAiAnalyzing ? (aiProgressMessage || 'Running Smart AI Analysis...') : 'Upload University Notes, Scanned PDFs, or Photos'}
          </h3>
          <p className="text-xs text-paper-muted dark:text-night-muted max-w-md mx-auto">
            Drag and drop chapter PDFs or photos of notes (.pdf, .png, .jpg). Built-in local OCR handles scanned pages in your browser.
          </p>
        </div>

        {/* OCR Progress Bar */}
        {isProcessing && ocrProgress && (
          <div className="max-w-md mx-auto space-y-2 pt-2">
            <div className="w-full bg-paper-cardElevated dark:bg-night-cardElevated h-2.5 rounded-full overflow-hidden border border-paper-border dark:border-night-border">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-paper-muted dark:text-night-muted">
              <span>{ocrProgress.status}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{ocrProgress.percent}%</span>
            </div>
          </div>
        )}

        {/* AI Analysis Spinner Bar */}
        {isAiAnalyzing && (
          <div className="max-w-md mx-auto p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>{aiProgressMessage || 'Connecting to Gemini API with your personal key...'}</span>
          </div>
        )}

        <div>
          <label className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer btn-tactile shadow-sm">
            <span>Choose PDF or Image File</span>
            <input 
              type="file" 
              accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/jpg" 
              onChange={handleFileUpload} 
              disabled={isProcessing || isAiAnalyzing}
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* QUALITY GUARD: Banner when text is unreadable or too short */}
      {analysis && !analysis.quality.isReliable && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Could not analyze this file reliably</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {analysis.quality.reason || 'The extracted text contains insufficient readable characters to build an accurate outline, summary, or questions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {fileDataUrl && (
              <a 
                href={fileDataUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 btn-tactile shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Original File</span>
              </a>
            )}
            <button
              onClick={() => setIsTextEditorOpen(!isTextEditorOpen)}
              className="px-3.5 py-1.5 rounded-xl bg-paper-card dark:bg-night-card border border-amber-500/30 text-xs font-semibold text-paper-ink dark:text-night-text inline-flex items-center gap-1.5 hover:bg-paper-cardElevated"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit text manually & try again</span>
            </button>
          </div>
        </div>
      )}

      {/* AI ERROR & FALLBACK NOTICE BANNER */}
      {aiAnalysisError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-0.5">
            <span className="font-bold">Smart Analysis Fallback: </span>
            <span>{aiAnalysisError}</span>
          </div>
        </div>
      )}

      {/* ANALYSIS OUTPUT BLOCKS (50% Left / 50% Right Widescreen Split Layout) */}
      {analysis && analysis.quality.isReliable && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* LEFT 50%: EMBEDDED DOCUMENT VIEWER & CLEANED TEXT DRAWER */}
          <div className="w-full space-y-4 lg:sticky lg:top-20">
            <div className="p-5 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                <span className="font-bold text-xs uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Document Viewer</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-paper-ink dark:text-night-text truncate max-w-[200px]">
                  {selectedFile?.name || 'Document Preview'}
                </span>
              </div>

              {fileDataUrl ? (
                <div className="w-full h-[520px] rounded-2xl overflow-hidden bg-night-card border border-paper-border dark:border-night-border">
                  {selectedFile?.type === 'application/pdf' ? (
                    <iframe
                      src={fileDataUrl}
                      title="PDF Document Preview"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <img
                      src={fileDataUrl}
                      alt="Uploaded Document"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-paper-muted text-xs border border-dashed border-paper-border dark:border-night-border rounded-2xl">
                  <FileText className="w-8 h-8 opacity-50 mb-2" />
                  <span>Original Document Preview</span>
                </div>
              )}

              {/* EDITABLE TEXT DRAWER */}
              <div className="border border-paper-border dark:border-night-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setIsTextEditorOpen(!isTextEditorOpen)}
                  className="w-full px-4 py-2.5 bg-paper-cardElevated dark:bg-night-cardElevated flex items-center justify-between text-xs font-semibold text-paper-ink dark:text-night-text hover:bg-paper-cardElevated/80"
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-paper-muted" />
                    <span>View Extracted & Cleaned Text (Editable)</span>
                  </div>
                  {isTextEditorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isTextEditorOpen && (
                  <div className="p-4 space-y-3 bg-paper-card dark:bg-night-card border-t border-paper-border dark:border-night-border">
                    <p className="text-[11px] text-paper-muted dark:text-night-muted">
                      Page markers (like --- Page N ---) and repeated headers were cleaned. You can edit this text to correct any scan mistakes, then click "Analyze again".
                    </p>
                    <textarea
                      value={editableText}
                      onChange={e => setEditableText(e.target.value)}
                      rows={8}
                      className="w-full p-3 rounded-xl bg-paper-bg dark:bg-night-bg border border-paper-border dark:border-night-border font-mono text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
                      placeholder="Extracted cleaned text..."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-paper-muted font-mono">
                        {editableText.length} characters • {editableText.split(/\s+/).filter(Boolean).length} words
                      </span>
                      <button
                        onClick={handleReanalyze}
                        disabled={isProcessing || isAiAnalyzing}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 btn-tactile shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Analyze again</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 50%: EXTRACTED NOTES, OUTLINE, KEY TERMS & PRACTICE QUESTIONS */}
          <div className="w-full space-y-6 p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card">
            
            {/* Header Bar with Subject & Unit Destination */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-border dark:border-night-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-paper-ink dark:text-night-text">
                    {selectedFile?.name || 'Analyzed Document'}
                  </span>
                  {/* Requirement 5.b: High-contrast badges in both light and dark mode */}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-paper-cardElevated text-paper-ink dark:bg-night-cardElevated dark:text-night-text border border-paper-border dark:border-night-border shadow-xs">
                    {analysis.cleanedText.length} characters
                  </span>
                  {usedAiMode ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
                      <span>Smart AI Mode</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 shadow-xs">
                      Rule-Based Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-paper-muted dark:text-night-muted">
                  Review contents, outline, key terms, and practice questions below.
                </p>
              </div>

              {/* Target Subject and Unit Selectors (Requirement 5.a: Do not pre-select, show Choose subject/Choose unit) */}
              <div className="flex items-center gap-2 flex-wrap">
                {suggestedSubject && !targetSubjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSubjectId(suggestedSubject.id);
                      setTargetUnitId('');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-semibold hover:bg-amber-500/25 transition-colors flex items-center gap-1"
                    title="Click to apply suggested subject"
                  >
                    <span>💡 Suggested: <strong>{suggestedSubject.name}</strong></span>
                  </button>
                )}

                <select
                  value={targetSubjectId}
                  onChange={e => {
                    setTargetSubjectId(e.target.value);
                    setTargetUnitId('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none"
                >
                  <option value="">Choose subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={targetUnitId}
                  onChange={e => setTargetUnitId(e.target.value)}
                  disabled={!targetSubjectId || !targetSubject?.units || targetSubject.units.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none max-w-[200px] truncate disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">Choose unit</option>
                  {targetSubject?.units?.map(u => (
                    <option key={u.id} value={u.id}>
                      {formatUnitDisplayName(u)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          {/* BLOCK 1: Contents / Outline (Detected Sections in Order) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
                  <ListTree className="w-4 h-4 text-emerald-600" />
                  <span>1. Contents / Outline ({analysis.headings.length} Sections)</span>
                </h4>
                <p className="text-[11px] text-paper-muted dark:text-night-muted">
                  Hierarchical outline detected from numbered sections, units, and headers in your notes.
                </p>
              </div>

              {onAddTopic && (
                <button
                  onClick={handleAddHeadingsAsTopics}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 btn-tactile shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add headings as topics</span>
                </button>
              )}
            </div>

            {analysis.headings.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-1.5 max-h-60 overflow-y-auto">
                {analysis.headings.map((h) => {
                  const isChecked = !!selectedHeadings[h.id];
                  const alreadyExists = existingTopicTitles.has(h.cleanTitle.toLowerCase().trim());

                  return (
                    <div 
                      key={h.id} 
                      className={`flex items-center justify-between gap-2 p-1.5 rounded-lg text-xs transition-colors ${
                        alreadyExists ? 'opacity-50' : 'hover:bg-paper-card dark:hover:bg-night-card'
                      }`}
                      style={{ paddingLeft: `${Math.max(6, (h.level - 1) * 16 + 6)}px` }}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked && !alreadyExists}
                          disabled={alreadyExists}
                          onChange={e => setSelectedHeadings({ ...selectedHeadings, [h.id]: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={`font-medium truncate ${h.level === 1 ? 'font-bold text-paper-ink dark:text-night-text' : 'text-paper-muted'}`}>
                          {h.title}
                        </span>
                      </label>

                      {alreadyExists && (
                        <span className="text-[10px] font-mono text-paper-muted uppercase shrink-0">
                          (Already added)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-center text-xs text-paper-muted italic">
                No distinct numbered headings detected. You can add section headings in the text editor above.
              </div>
            )}
          </div>

          {/* BLOCK 2: Executive Summary (3 to 5 Complete Sentences from Whole Document) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>2. Executive Summary ({analysis.summary.length} Sentences)</span>
              {usedAiMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Summary</span>
                </span>
              )}
            </h4>
            <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-2 text-xs leading-relaxed text-paper-ink dark:text-night-text">
              {analysis.summary.map((sentence, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{sentence}</span>
                </div>
              ))}
              {analysis.summary.length === 0 && (
                <div className="text-paper-muted italic">No complete prose sentences could be extracted for summary.</div>
              )}
            </div>
          </div>

          {/* BLOCK 3: Key Terms & Definitions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  <span>3. Key Terms & Definitions ({analysis.keyTerms.length})</span>
                </h4>
                <p className="text-[11px] text-paper-muted dark:text-night-muted">
                  Strict academic terms and definitions. Terms displayed in bold with separated definitions.
                </p>
              </div>

              <button
                onClick={handleCreateFlashcards}
                disabled={analysis.keyTerms.length === 0}
                className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border hover:border-emerald-500 text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5 btn-tactile shadow-xs self-start sm:self-auto disabled:opacity-40"
              >
                <Brain className="w-3.5 h-3.5 text-emerald-600" />
                <span>Create Flashcards ({analysis.keyTerms.length})</span>
              </button>
            </div>

            {analysis.keyTerms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {analysis.keyTerms.map((kt, idx) => (
                  <div 
                    key={`${kt.term}-${idx}`} 
                    className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-1 text-xs"
                  >
                    <div className="font-bold text-paper-ink dark:text-night-text text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <strong>{kt.term}</strong>
                    </div>
                    <div className="text-paper-muted dark:text-night-muted pl-3 leading-relaxed">
                      {kt.definition}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-center text-xs text-paper-muted italic">
                No formal definition patterns ("is defined as", "is called", "means", "refers to") detected.
              </div>
            )}
          </div>

          {/* BLOCK 4: Formulas & Algorithms (Separately Listed) */}
          {(analysis.formulasAndAlgorithms.formulas.length > 0 || analysis.formulasAndAlgorithms.algorithms.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formulas */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
                  <FunctionSquare className="w-4 h-4 text-blue-500" />
                  <span>4A. Mathematical Formulas ({analysis.formulasAndAlgorithms.formulas.length})</span>
                </h4>
                <div className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-2 max-h-52 overflow-y-auto font-mono text-xs">
                  {analysis.formulasAndAlgorithms.formulas.map((f, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text">
                      {f}
                    </div>
                  ))}
                  {analysis.formulasAndAlgorithms.formulas.length === 0 && (
                    <div className="text-center py-3 text-xs text-paper-muted italic">No formulas detected.</div>
                  )}
                </div>
              </div>

              {/* Algorithms */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>4B. Step-by-Step Algorithms ({analysis.formulasAndAlgorithms.algorithms.length})</span>
                </h4>
                <div className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border space-y-2 max-h-52 overflow-y-auto font-mono text-xs">
                  {analysis.formulasAndAlgorithms.algorithms.map((a, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text">
                      {a}
                    </div>
                  ))}
                  {analysis.formulasAndAlgorithms.algorithms.length === 0 && (
                    <div className="text-center py-3 text-xs text-paper-muted italic">No numbered algorithm steps detected.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BLOCK 5: Practice Questions from your Notes (Complete Sentences, Editable Marks) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5 flex-wrap">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>5. Practice Questions from your Notes ({practiceQuestions.length})</span>
                  {usedAiMode ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI-suggested practice questions, not real predictions</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-paper-border/40 dark:bg-night-border/40 text-paper-muted dark:text-night-muted">
                      Rule-based templates
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-paper-muted dark:text-night-muted">
                  Generated from outlines, key terms, and formulas. Every question is complete with editable suggested marks.
                </p>
              </div>

              <button
                onClick={handleSaveQuestionsToPyqBank}
                disabled={practiceQuestions.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 btn-tactile shadow-xs self-start sm:self-auto"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Add to PYQ Bank ({practiceQuestions.length})</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {practiceQuestions.map((pq) => (
                <div 
                  key={pq.id} 
                  className="p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={pq.question}
                      onChange={e => handleQuestionTextChange(pq.id, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-paper-border focus:border-emerald-500 focus:outline-none font-semibold text-paper-ink dark:text-night-text py-0.5 text-xs"
                      title="Click to edit question text"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-paper-muted uppercase font-mono">Suggested Marks:</span>
                    <select
                      value={pq.marks}
                      onChange={e => handleQuestionMarksChange(pq.id, Number(e.target.value) as 2 | 5 | 10)}
                      className="px-2 py-1 rounded-lg text-xs font-bold font-mono bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-amber-600 dark:text-amber-400 focus:outline-none"
                    >
                      <option value={2}>2 Marks</option>
                      <option value={5}>5 Marks</option>
                      <option value={10}>10 Marks</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS (Save original file to IndexedDB, Create Flashcards, Add to PYQ) */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-paper-border dark:border-night-border">
            <button
              onClick={handleSaveToSubject}
              disabled={!targetSubjectId || !targetUnitId || (!selectedFile && !editableText)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 btn-tactile shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{targetSubject ? `Save to ${targetSubject.name} (IndexedDB)` : 'Save to Subject (IndexedDB)'}</span>
            </button>
          </div>

        </div>
        </div>
      )}

      {/* SAVED NOTES VAULT FOR SELECTED SUBJECT */}
      <div className="p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Saved Notes Library for {targetSubject?.name}</span>
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              Notes and summaries saved into your local browser database.
            </p>
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {subjectPdfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {subjectPdfs.map(pdf => (
              <div 
                key={pdf.id}
                className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-paper-ink dark:text-night-text line-clamp-1">
                      {pdf.fileName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-paper-border/60 text-paper-muted shrink-0">
                      Unit {pdf.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-paper-muted dark:text-night-muted line-clamp-2 leading-relaxed">
                    {pdf.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-paper-border/50 text-[11px] font-mono text-paper-muted">
                  <span>{pdf.uploadDate}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingPdf(pdf)}
                      className="p-1.5 rounded-lg hover:bg-paper-card text-emerald-600 hover:text-emerald-700"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePdf(pdf.id)}
                      className="p-1.5 rounded-lg hover:bg-paper-card text-red-500 hover:text-red-700"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-paper-muted italic">
            No saved notes in this subject yet. Upload a document above to save.
          </div>
        )}
      </div>

      {/* FULL NOTE MODAL */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-paper-border dark:border-night-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-paper-ink dark:text-night-text">{viewingPdf.fileName}</h3>
                <span className="text-xs text-paper-muted">Unit {viewingPdf.unit} • {viewingPdf.uploadDate}</span>
              </div>
              <button 
                onClick={() => setViewingPdf(null)}
                className="p-1.5 rounded-full hover:bg-paper-cardElevated text-paper-muted hover:text-paper-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted">Summary</h4>
              <p className="text-xs text-paper-ink dark:text-night-text leading-relaxed p-3.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border">
                {viewingPdf.summary}
              </p>

              <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted">Practice Questions</h4>
              <div className="space-y-1.5">
                {viewingPdf.extractedQuestions?.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART ANALYSIS & API KEY SETTINGS MODAL */}
      {showAiSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-slide-up">
            
            <div className="flex items-center justify-between border-b border-paper-border dark:border-night-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-paper-ink dark:text-night-text">
                    Smart Analysis Settings (Optional AI)
                  </h3>
                  <span className="text-[11px] text-paper-muted dark:text-night-muted">
                    Google Gemini API Configuration
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAiSettings(false);
                  setTestKeyResult(null);
                }}
                className="p-1.5 rounded-full hover:bg-paper-cardElevated text-paper-muted hover:text-paper-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PRIVACY WARNING & ZERO LEAKAGE COMMITMENT */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Provider Transmission & Privacy Warning</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When Smart Analysis is turned ON, your cleaned notes text is transmitted directly from your browser to <strong>Google AI Studio</strong> (Google Generative Language API) to generate academic summaries, formulas, and questions.
              </p>
              <div className="pt-1 border-t border-amber-500/20 text-[10px] space-y-1 font-mono">
                <div>🔒 <strong>Stored strictly in this browser</strong> (IndexedDB)</div>
                <div>🚫 <strong>Never in source code</strong>, never in backups, never on remote servers</div>
                <div>💡 <strong>100% Offline fallback</strong>: Leave OFF anytime to use local rule-based parsing</div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Get free key at Google AI Studio</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showApiKeyText ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-paper-bg dark:bg-night-bg border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeyText(!showApiKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-muted hover:text-paper-ink"
                  title={showApiKeyText ? "Hide key" : "Show key"}
                >
                  {showApiKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Model Selector (Requirement 1: Dropdown named "AI model") */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center justify-between">
                <span>AI model</span>
                {isLoadingModels && (
                  <span className="text-[10px] text-paper-muted flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                    <span>Fetching models...</span>
                  </span>
                )}
              </label>
              <select
                value={selectedModel}
                onChange={e => {
                  setSelectedModel(e.target.value);
                  saveModel(e.target.value);
                }}
                disabled={availableModels.length === 0}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-paper-bg dark:bg-night-bg border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                {availableModels.length > 0 ? (
                  availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  <option value="">{selectedModel || 'Click "Test Key" to discover available models'}</option>
                )}
              </select>
              {availableModels.length > 0 && !selectedModel && (
                <p className="text-[10px] text-paper-muted dark:text-night-muted">
                  Auto-selection is active. Choose a specific model above if you prefer.
                </p>
              )}
            </div>

            {/* Test Key Result Banner */}
            {testKeyResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testKeyResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              }`}>
                {testKeyResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testKeyResult.message}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-paper-border dark:border-night-border">
              {hasSavedApiKey ? (
                <button
                  type="button"
                  onClick={handleDeleteKey}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 btn-tactile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Key</span>
                </button>
              ) : (
                <span className="text-[11px] text-paper-muted">No key currently stored</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !apiKeyInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text hover:bg-paper-card flex items-center gap-1.5 disabled:opacity-40 btn-tactile"
                >
                  {isTestingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Test Key</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 btn-tactile shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
