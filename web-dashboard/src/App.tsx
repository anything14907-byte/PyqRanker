import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SubjectMeta, 
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  SyllabusTopic, 
  TopicMastery, 
  Flashcard, 
  PomodoroSession,
  ExamSession
} from './types';
import { storageService } from './utils/storageService';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar, MainNavView } from './components/Navbar';
import { TodayScreen } from './components/TodayScreen';
import { SyllabusTrackerView } from './components/SyllabusTrackerView';
import { FocusTimerView } from './components/FocusTimerView';
import { FlashcardsView } from './components/FlashcardsView';
import { YouTubeVaultView } from './components/YouTubeVaultView';
import { PdfNotesView } from './components/PdfNotesView';
import { CommandCenterOverview } from './components/CommandCenterOverview';
import { SubjectWorkspace } from './components/SubjectWorkspace';
import { AddSubjectModal } from './components/AddSubjectModal';
import { EditSubjectModal } from './components/EditSubjectModal';
import { BackupModal } from './components/BackupModal';
import { MobileBottomNav, ExtendedNavView } from './components/MobileBottomNav';
import { Toast, ToastMessage } from './components/Toast';
import { SearchIndexItem } from './utils/searchService';
import { CommandSubHeader } from './components/CommandSubHeader';
import { InstallAppModal } from './components/InstallAppModal';
import { OpenBookBinder } from './components/OpenBookBinder';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

function DashboardContent() {
  // 1. Multiple Exams State (Requirement 3)
  const [examSessions, setExamSessions] = useState<ExamSession[]>(() => storageService.getExamSessions());
  const [activeExamId, setActiveExamId] = useState<string>(() => storageService.getActiveExam());

  // 2. Core Study Data Scoped to Active Exam (Zero Data Loss on 'mid-sem')
  const [subjects, setSubjects] = useState<SubjectMeta[]>(() => storageService.getSubjects(activeExamId));
  const [questions, setQuestions] = useState<PYQQuestion[]>(() => storageService.getQuestions(activeExamId));
  const [tasks, setTasks] = useState<StudyTask[]>(() => storageService.getTasks(activeExamId));
  const [videos, setVideos] = useState<VideoResource[]>(() => storageService.getVideos(activeExamId));
  const [pdfs, setPdfs] = useState<PdfResource[]>(() => storageService.getPdfs(activeExamId));
  const [topics, setTopics] = useState<SyllabusTopic[]>(() => storageService.getTopics(undefined, activeExamId));
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => storageService.getFlashcards(undefined, activeExamId));
  const [pomodoroLogs, setPomodoroLogs] = useState<PomodoroSession[]>(() => storageService.getPomodoroLogs(activeExamId));

  // Active navigation view: default to 'today' (Dashboard screen)
  const [currentView, setCurrentView] = useState<MainNavView>('today');

  // Currently focused subject & unit
  const [activeSubjectId, setActiveSubjectId] = useState<string>(() => {
    return localStorage.getItem('exam_hub_v3_active_subject') || subjects[0]?.id || 'os';
  });
  const [activeUnitId, setActiveUnitId] = useState<string>('all');
  const [highlightedTopicId, setHighlightedTopicId] = useState<string | undefined>(undefined);

  // Redirect 'pyqs' view to 'syllabus' if previously selected
  useEffect(() => {
    if (currentView === ('pyqs' as any)) {
      setCurrentView('syllabus');
    }
  }, [currentView]);

  // Modal states
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectMeta | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSyncSuccessBanner, setShowSyncSuccessBanner] = useState(false);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA Native Install Prompt Capture
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleUpdate = () => {
      showToast('Update available! Reload to apply latest changes. 🔄', 'info');
    };
    window.addEventListener('pyq-app-update-available', handleUpdate);
    return () => window.removeEventListener('pyq-app-update-available', handleUpdate);
  }, [showToast]);

  // Reload all data when active exam changes (Requirement 3: Each exam has separate data)
  const reloadExamData = useCallback((examId: string) => {
    const subs = storageService.getSubjects(examId);
    setSubjects(subs);
    setQuestions(storageService.getQuestions(examId));
    setTasks(storageService.getTasks(examId));
    setVideos(storageService.getVideos(examId));
    setPdfs(storageService.getPdfs(examId));
    setTopics(storageService.getTopics(undefined, examId));
    setFlashcards(storageService.getFlashcards(undefined, examId));
    setPomodoroLogs(storageService.getPomodoroLogs(examId));

    if (subs.length > 0) {
      setActiveSubjectId(subs[0].id);
      localStorage.setItem('exam_hub_v3_active_subject', subs[0].id);
    } else {
      setActiveSubjectId('');
    }
  }, []);

  // Cross-Tab Broadcast Helper (Lightweight Native Web BroadcastChannel)
  const broadcastLiveState = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('study_os_channel');
        bc.postMessage({ type: 'LOCAL_DATA_CHANGED', timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  }, []);

  // Listen for multi-tab updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('study_os_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'LOCAL_DATA_CHANGED') {
        const active = storageService.getActiveExam();
        setActiveExamId(active);
        reloadExamData(active);
      }
    };
    return () => {
      bc.close();
    };
  }, [reloadExamData]);

  // Fast 1-Click JSON Backup & Smart Sync Handlers
  const handleFastExport = useCallback(() => {
    try {
      storageService.exportBackup();
      showToast('📦 Study OS backup exported successfully!', 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  const handleFastImport = useCallback((jsonStr: string) => {
    try {
      const res = storageService.importFullAppState(jsonStr);
      if (res.success) {
        setExamSessions(storageService.getExamSessions());
        const active = storageService.getActiveExam();
        setActiveExamId(active);
        reloadExamData(active);
        setShowSyncSuccessBanner(true);
        showToast('✨ Study OS data imported & merged successfully!', 'success');
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.55 }
          });
        } catch {}
      } else {
        showToast(`Import error: ${res.message}`, 'error');
      }
    } catch (err: any) {
      showToast(`Failed to parse backup file: ${err?.message || err}`, 'error');
    }
  }, [reloadExamData, showToast]);

  // Listen for master state imported (from BackupModal, fast import, or BroadcastChannel)
  useEffect(() => {
    const handleMasterStateImported = () => {
      setExamSessions(storageService.getExamSessions());
      const activeExam = storageService.getActiveExam();
      setActiveExamId(activeExam);
      reloadExamData(activeExam);
      const activeSub = localStorage.getItem('exam_hub_v3_active_subject') || '';
      if (activeSub) setActiveSubjectId(activeSub);
    };

    const handleQrSynced = () => {
      handleMasterStateImported();
      setShowSyncSuccessBanner(true);
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.55 }
        });
      } catch {}
    };

    window.addEventListener('pyq-master-state-imported', handleMasterStateImported);
    window.addEventListener('pyq-qr-state-synced', handleQrSynced);

    return () => {
      window.removeEventListener('pyq-master-state-imported', handleMasterStateImported);
      window.removeEventListener('pyq-qr-state-synced', handleQrSynced);
    };
  }, [reloadExamData]);

  const handleSelectView = (view: MainNavView) => {
    setCurrentView(view);
  };

  // Exam switcher handlers (Requirement 3)
  const handleSelectExam = (examId: string) => {
    storageService.setActiveExam(examId);
    setActiveExamId(examId);
    reloadExamData(examId);
    const session = examSessions.find(e => e.id === examId);
    showToast(`Switched to: ${session?.name || examId}`, 'info');
    broadcastLiveState();
  };

  const handleAddExam = (name: string) => {
    const newSession = storageService.addExamSession(name);
    setExamSessions(storageService.getExamSessions());
    setActiveExamId(newSession.id);
    reloadExamData(newSession.id);
    showToast(`Created exam: "${name}"! 🎓`, 'success');
    broadcastLiveState();
  };

  const handleRenameExam = (examId: string, newName: string) => {
    const updated = storageService.renameExamSession(examId, newName);
    setExamSessions(updated);
    showToast(`Renamed exam to "${newName}"`, 'success');
    broadcastLiveState();
  };

  const handleDeleteExam = (examId: string) => {
    const updated = storageService.deleteExamSession(examId);
    setExamSessions(updated);
    const nextExam = storageService.getActiveExam();
    setActiveExamId(nextExam);
    reloadExamData(nextExam);
    showToast('Exam deleted.', 'info');
    broadcastLiveState();
  };

  // Find active subject object
  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];

  // Calculate due flashcards count for mobile badge
  const todayDateStr = new Date().toISOString().split('T')[0];
  const dueFlashcardsCount = useMemo(() => {
    return flashcards.filter(c => !c.nextReviewDate || c.nextReviewDate <= todayDateStr).length;
  }, [flashcards, todayDateStr]);

  // ==========================================
  // SUBJECT HANDLERS (Requirement 4: Edit subject name & exam date)
  // ==========================================
  const handleSelectSubject = (id: string, unitId?: string) => {
    setActiveSubjectId(id);
    setActiveUnitId(unitId || 'all');
    localStorage.setItem('exam_hub_v3_active_subject', id);
  };

  // Search navigation handlers
  const handleNavigateToTopic = (subId: string, unitId: string, topicId: string) => {
    handleSelectSubject(subId, unitId);
    setHighlightedTopicId(topicId);
    setCurrentView('syllabus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setHighlightedTopicId(undefined);
    }, 4500);
  };

  const handleNavigateToSubject = (subId: string) => {
    handleSelectSubject(subId);
    setCurrentView('syllabus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToSearchResult = (item: SearchIndexItem) => {
    if (item.examId && item.examId !== activeExamId) {
      handleSelectExam(item.examId);
    }
    handleSelectSubject(item.subjectId, item.unitId);

    if (item.type === 'flashcard') {
      setCurrentView('flashcards');
    } else if (item.type === 'task') {
      setCurrentView('today');
    } else {
      setCurrentView('syllabus');
    }

    if (item.type === 'topic') {
      setHighlightedTopicId(item.id);
      setTimeout(() => {
        setHighlightedTopicId(undefined);
      }, 4500);
    }

    // Scroll to element after view renders and flash highlight
    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      if (item.type === 'topic') {
        targetEl = document.getElementById(`topic-${item.id}`);
      } else if (item.type === 'unit') {
        targetEl = document.getElementById(`unit-${item.unitId || item.id}`);
      } else if (item.type === 'subject') {
        targetEl = document.getElementById(`subject-${item.subjectId}`);
      } else if (item.type === 'pyq') {
        targetEl = document.getElementById(`q-${item.id}`) || document.getElementById(`pyq-${item.id}`);
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2', 'transition-all', 'duration-500');
        setTimeout(() => {
          targetEl?.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2');
        }, 3000);
      }
    }, 200);
  };

  const handleSelectSubjectAndOpenWorkspace = (id: string, unitId?: string) => {
    handleSelectSubject(id, unitId);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSubject = (newSubject: SubjectMeta) => {
    const updated = storageService.addSubject(newSubject, activeExamId);
    setSubjects(updated);
    setActiveSubjectId(newSubject.id);
    setActiveUnitId('all');
    localStorage.setItem('exam_hub_v3_active_subject', newSubject.id);
    setTopics(storageService.getTopics(undefined, activeExamId));
    setIsAddSubjectOpen(false);
    setCurrentView('syllabus');
    showToast(`Created subject "${newSubject.name}"! 🚀`, 'success');
    broadcastLiveState();
  };

  const handleUpdateSubject = (updatedSubject: SubjectMeta) => {
    const updated = storageService.updateSubject(updatedSubject, activeExamId);
    setSubjects(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
    showToast(`Updated "${updatedSubject.name}"!`, 'success');
    broadcastLiveState();
  };

  const handleDeleteSubject = (id: string) => {
    const updated = storageService.deleteSubject(id);
    setSubjects(updated);
    setQuestions(storageService.getQuestions(activeExamId));
    setTasks(storageService.getTasks(activeExamId));
    setVideos(storageService.getVideos(activeExamId));
    setPdfs(storageService.getPdfs(activeExamId));
    setTopics(storageService.getTopics(undefined, activeExamId));
    setFlashcards(storageService.getFlashcards(undefined, activeExamId));
    if (activeSubjectId === id && updated.length > 0) {
      setActiveSubjectId(updated[0].id);
      localStorage.setItem('exam_hub_v3_active_subject', updated[0].id);
    }
    showToast('Subject deleted.', 'info');
    broadcastLiveState();
  };

  const handleReorderSubjects = (reordered: SubjectMeta[]) => {
    storageService.saveSubjects(reordered, activeExamId);
    setSubjects(reordered);
    broadcastLiveState();
  };

  // ==========================================
  // UNIT HANDLERS (Requirement 5: Custom unit title/number, rename, delete, reorder)
  // ==========================================
  const handleAddUnit = (subjectId: string, unitLabel: string, unitTitle?: string) => {
    const updated = storageService.addUnit(subjectId, unitLabel, unitTitle, activeExamId);
    setSubjects(updated);
    broadcastLiveState();
  };

  const handleRenameUnit = (subjectId: string, unitId: string, newLabel: string, newTitle?: string) => {
    const updated = storageService.renameUnit(subjectId, unitId, newLabel, newTitle, activeExamId);
    setSubjects(updated);
    broadcastLiveState();
  };

  const handleDeleteUnit = (subjectId: string, unitId: string) => {
    const updated = storageService.deleteUnit(subjectId, unitId, activeExamId);
    setSubjects(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
    broadcastLiveState();
  };

  const handleReorderUnit = (subjectId: string, unitId: string, direction: 'up' | 'down') => {
    const updated = storageService.reorderUnit(subjectId, unitId, direction, activeExamId);
    setSubjects(updated);
    broadcastLiveState();
  };

  // ==========================================
  // SYLLABUS TOPIC HANDLERS (Requirement 6: Videos, Weak/Okay/Strong, Checkbox)
  // ==========================================
  const handleToggleTopicCompleted = (topicId: string) => {
    const updated = storageService.toggleTopicCompleted(topicId, activeExamId);
    setTopics(updated);
    broadcastLiveState();
  };

  const handleSetTopicMastery = (topicId: string, mastery: TopicMastery) => {
    const updated = storageService.setTopicMastery(topicId, mastery, activeExamId);
    setTopics(updated);
    showToast(`Marked topic as ${mastery.toUpperCase()}`, 'info');
    broadcastLiveState();
  };

  const handleAddTopic = (topic: SyllabusTopic) => {
    const updated = storageService.addTopic(topic, activeExamId);
    setTopics(updated);
    broadcastLiveState();
  };

  const handleDeleteTopic = (topicId: string) => {
    const updated = storageService.deleteTopic(topicId, activeExamId);
    setTopics(updated);
    showToast('Topic removed from syllabus.', 'info');
    broadcastLiveState();
  };

  const handleAddTopicVideo = (topicId: string, videoUrl: string) => {
    const updated = storageService.addTopicVideo(topicId, videoUrl, activeExamId);
    setTopics(updated);
    broadcastLiveState();
  };

  const handleRemoveTopicVideo = (topicId: string, videoUrl: string) => {
    const updated = storageService.removeTopicVideo(topicId, videoUrl, activeExamId);
    setTopics(updated);
    broadcastLiveState();
  };

  const handleUpdateTopicTitle = (topicId: string, newTitle: string) => {
    const updated = storageService.updateTopicTitle(topicId, newTitle, activeExamId);
    setTopics(updated);
    showToast('Topic title updated!', 'success');
    broadcastLiveState();
  };

  const handleReorderTopics = (reorderedTopics: SyllabusTopic[]) => {
    const updated = storageService.reorderTopics(reorderedTopics, activeExamId);
    setTopics(updated);
    broadcastLiveState();
  };

  // ==========================================
  // QUESTION HANDLERS
  // ==========================================
  const handleToggleMastered = (id: string) => {
    const updated = storageService.toggleQuestionMastered(id);
    setQuestions(updated);
    broadcastLiveState();
  };

  const handleSaveAnswer = (id: string, answer: string, score: number) => {
    const updated = questions.map(q => {
      if (q.id === id) {
        return { ...q, lastAttemptAnswer: answer, lastAttemptScore: score };
      }
      return q;
    });
    setQuestions(updated);
    storageService.saveQuestions(updated, activeExamId);
    broadcastLiveState();
  };

  const handleAddQuestion = (q: PYQQuestion) => {
    const updated = storageService.addQuestion(q, activeExamId);
    setQuestions(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
    showToast('Question saved to subject PYQ bank! 🔥', 'success');
    broadcastLiveState();
  };

  // ==========================================
  // FOCUS TIMER / POMODORO HANDLERS
  // ==========================================
  const handleLogPomodoro = (subjectId: string, minutes: number) => {
    const updated = storageService.logPomodoroSession(subjectId, minutes, activeExamId);
    setPomodoroLogs(updated);
    const subName = subjects.find(s => s.id === subjectId)?.name || 'Subject';
    showToast(`Logged ${minutes} min focus session for ${subName}! 🔥`, 'success');
    broadcastLiveState();
  };

  const handleResetPomodoro = () => {
    storageService.resetPomodoroLogs(activeExamId);
    setPomodoroLogs([]);
    showToast('Focus timer data reset to 0 mins.', 'info');
    broadcastLiveState();
  };

  // ==========================================
  // FLASHCARD HANDLERS
  // ==========================================
  const handleAddFlashcard = (card: Flashcard) => {
    const updated = storageService.addFlashcard(card, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard saved! 🧠', 'success');
    broadcastLiveState();
  };

  const handleUpdateFlashcard = (card: Flashcard) => {
    const updated = storageService.updateFlashcard(card, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard updated!', 'success');
    broadcastLiveState();
  };

  const handleReviewCard = (cardId: string, rating: 'hard' | 'good' | 'easy') => {
    const updated = storageService.reviewFlashcard(cardId, rating, activeExamId);
    setFlashcards(updated);
    broadcastLiveState();
  };

  const handleDeleteFlashcard = (cardId: string) => {
    const updated = storageService.deleteFlashcard(cardId, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard deleted.', 'info');
    broadcastLiveState();
  };

  // ==========================================
  // VIDEO HANDLERS (YOUTUBE VAULT)
  // ==========================================
  const handleAddVideo = useCallback((video: VideoResource) => {
    const updated = storageService.addVideo(video, activeExamId);
    setVideos(updated);
    showToast('Lecture saved to YouTube Vault! 🎥', 'success');
    broadcastLiveState();
  }, [activeExamId, showToast, broadcastLiveState]);

  const handleUpdateVideoNotes = useCallback((id: string, notes: string) => {
    const updated = storageService.updateVideoNotes(id, notes, activeExamId);
    setVideos(updated);
    broadcastLiveState();
  }, [activeExamId, broadcastLiveState]);

  const handleToggleVideoWatched = useCallback((id: string) => {
    const updated = storageService.toggleVideoWatched(id, activeExamId);
    setVideos(updated);
    broadcastLiveState();
  }, [activeExamId, broadcastLiveState]);

  const handleDeleteVideo = useCallback((id: string) => {
    const updated = storageService.deleteVideo(id, activeExamId);
    setVideos(updated);
    showToast('Video removed from Vault.', 'info');
    broadcastLiveState();
  }, [activeExamId, showToast, broadcastLiveState]);

  // ==========================================
  // PDF HANDLERS
  // ==========================================
  const handleAddPdf = (pdf: PdfResource) => {
    const updated = storageService.addPdf(pdf, activeExamId);
    setPdfs(updated);
    showToast('PDF saved to notes! 📄', 'success');
    broadcastLiveState();
  };

  const handleDeletePdf = (id: string) => {
    const updated = storageService.deletePdf(id, activeExamId);
    setPdfs(updated);
    showToast('Document removed.', 'info');
    broadcastLiveState();
  };

  // Task Handlers for Workspace
  const handleToggleTask = (id: string) => {
    const updated = storageService.toggleTask(id, activeExamId);
    setTasks(updated);
    broadcastLiveState();
  };

  const handleAddTask = (text: string, unitId?: string, unitNum?: number) => {
    const newTask: StudyTask = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId: activeSubjectId,
      unitId,
      unit: unitNum,
      text,
      completed: false,
      isMission: false,
      category: 'custom',
      createdAt: Date.now()
    };
    const updated = storageService.addTask(newTask, activeExamId);
    setTasks(updated);
    showToast('Task added to checklist!', 'success');
    broadcastLiveState();
  };

  const handleDeleteTask = (id: string) => {
    const updated = storageService.deleteTask(id, activeExamId);
    setTasks(updated);
    broadcastLiveState();
  };

  const handleMoveItemToUnit = (
    type: 'task' | 'video' | 'pdf' | 'question', 
    itemId: string, 
    targetUnitId: string, 
    targetUnitNumber?: number
  ) => {
    storageService.moveItemToUnit(type, itemId, targetUnitId, targetUnitNumber);
    if (type === 'task') setTasks(storageService.getTasks(activeExamId));
    if (type === 'video') setVideos(storageService.getVideos(activeExamId));
    if (type === 'pdf') setPdfs(storageService.getPdfs(activeExamId));
    broadcastLiveState();
  };

  const handleDataReloaded = () => {
    setExamSessions(storageService.getExamSessions());
    reloadExamData(activeExamId);
    broadcastLiveState();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#E5DFD3] dark:bg-[#0C0E12] text-paper-ink dark:text-night-text transition-colors duration-200">
      <div className="relative z-10 w-full min-h-screen">
        {/* ROW 1: Studio Hardcover Navigation Bar */}
        <Navbar
          currentView={currentView}
          onSelectView={handleSelectView}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenAddSubject={() => setIsAddSubjectOpen(true)}
          onOpenInstallApp={() => setIsInstallModalOpen(true)}
        />

        {/* ROW 2: Dedicated Hero Command & Filter Bar (Exam Type Pills + Global Spotlight Search) */}
        <CommandSubHeader
          examSessions={examSessions}
          activeExamId={activeExamId}
          onSelectExam={handleSelectExam}
          onAddExam={handleAddExam}
          onRenameExam={handleRenameExam}
          onDeleteExam={handleDeleteExam}
          subjects={subjects}
          topics={topics}
          questions={questions}
          tasks={tasks}
          videos={videos}
          pdfs={pdfs}
          flashcards={flashcards}
          onNavigateToSearchResult={handleNavigateToSearchResult}
        />

        {/* Full-State Synchronized Celebratory Banner */}
        {showSyncSuccessBanner && (
          <div className="w-full px-4 sm:px-7 pt-3 animate-fade-slide-up">
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-emerald-950 border border-emerald-500 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-amber-400 text-black flex items-center justify-center shrink-0 font-bold shadow-md">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>✨ Full website state successfully synced from connected device!</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your subjects, syllabus completion status, exam dates, timers, and flashcards are now 100% up to date and in sync across all devices.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncSuccessBanner(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 self-end sm:self-center shrink-0 active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      {/* Main Content Area: 100% corner-to-corner full viewport width (16px 28px edge padding) */}
      <main className="w-full px-4 sm:px-7 py-4 pb-28 md:pb-12 box-border">
        
        {/* VIEW 1: TODAY / DASHBOARD SCREEN (Tactile 3D Hardcover Bookshelf Desk) */}
        {currentView === 'today' && (
          <TodayScreen
            subjects={subjects}
            topics={topics}
            questions={questions}
            tasks={tasks}
            flashcards={flashcards}
            pomodoroLogs={pomodoroLogs}
            videos={videos}
            onToggleTopicCompleted={handleToggleTopicCompleted}
            onSelectSubject={(id, unitId) => {
              handleSelectSubject(id, unitId);
              setCurrentView('syllabus');
            }}
            onNavigateView={setCurrentView}
            onShowToast={showToast}
            onOpenAddSubject={() => setIsAddSubjectOpen(true)}
            onEditSubject={(sub) => setEditingSubject(sub)}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onReorderSubjects={handleReorderSubjects}
          />
        )}

        {/* VIEW 2 & 9: OPEN BOOK BINDER (Widescreen 2-Page Spread with Chapters & Attachments) */}
        {(currentView === 'syllabus' || currentView === 'workspace') && (
          activeSubject ? (
            <OpenBookBinder
              subject={activeSubject}
              initialUnitId={activeUnitId}
              topics={topics}
              questions={questions}
              videos={videos}
              pdfs={pdfs}
              onToggleTopicCompleted={handleToggleTopicCompleted}
              onSetTopicMastery={handleSetTopicMastery}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
              onAddUnit={handleAddUnit}
              onRenameUnit={handleRenameUnit}
              onDeleteUnit={handleDeleteUnit}
              onAddVideo={handleAddVideo}
              onToggleVideoWatched={handleToggleVideoWatched}
              onDeleteVideo={handleDeleteVideo}
              onAddPdf={handleAddPdf}
              onDeletePdf={handleDeletePdf}
              onAddQuestion={handleAddQuestion}
              onToggleQuestionMastered={handleToggleMastered}
              onSaveQuestionAnswer={handleSaveAnswer}
              onBackToShelf={() => setCurrentView('today')}
              onShowToast={showToast}
            />
          ) : (
            <SyllabusTrackerView
              subjects={subjects}
              activeSubjectId={activeSubjectId}
              activeExamId={activeExamId}
              highlightedTopicId={highlightedTopicId}
              onSelectSubject={handleSelectSubject}
              topics={topics}
              onToggleTopicCompleted={handleToggleTopicCompleted}
              onSetTopicMastery={handleSetTopicMastery}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
              onUpdateTopicTitle={handleUpdateTopicTitle}
              onReorderTopics={handleReorderTopics}
              onAddTopicVideo={handleAddTopicVideo}
              onRemoveTopicVideo={handleRemoveTopicVideo}
              onAddUnit={handleAddUnit}
              onRenameUnit={handleRenameUnit}
              onDeleteUnit={handleDeleteUnit}
              onReorderUnit={handleReorderUnit}
              onOpenAddSubject={() => setIsAddSubjectOpen(true)}
              onEditSubject={(sub) => setEditingSubject(sub)}
              onShowToast={showToast}
            />
          )
        )}

        {/* VIEW 4: FOCUS TIMER / POMODORO (25/5) */}
        {currentView === 'timer' && (
          <FocusTimerView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            pomodoroLogs={pomodoroLogs}
            onLogSession={handleLogPomodoro}
            onResetTimerData={handleResetPomodoro}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 5: FLASHCARDS / SPACED REPETITION */}
        {currentView === 'flashcards' && (
          <FlashcardsView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            flashcards={flashcards}
            onAddFlashcard={handleAddFlashcard}
            onUpdateFlashcard={handleUpdateFlashcard}
            onReviewCard={handleReviewCard}
            onDeleteFlashcard={handleDeleteFlashcard}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 6: YOUTUBE VAULT */}
        <div className={currentView === 'vault' ? 'block' : 'hidden'} key="pyq-vault-view-wrapper">
          <YouTubeVaultView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            videos={videos}
            onAddVideo={handleAddVideo}
            onUpdateVideoNotes={handleUpdateVideoNotes}
            onToggleVideoWatched={handleToggleVideoWatched}
            onDeleteVideo={handleDeleteVideo}
            onShowToast={showToast}
            isViewActive={currentView === 'vault'}
          />
        </div>

        {/* VIEW 7: PDF NOTES EXTRACTOR */}
        {currentView === 'pdf' && (
          <PdfNotesView
            subjects={subjects}
            activeSubjectId={activeSubjectId}
            topics={topics}
            pdfs={pdfs}
            onAddPdf={handleAddPdf}
            onDeletePdf={handleDeletePdf}
            onAddQuestion={handleAddQuestion}
            onAddFlashcard={handleAddFlashcard}
            onAddTopic={handleAddTopic}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 8: ALL SUBJECTS GRID OVERVIEW */}
        {currentView === 'overview' && (
          <CommandCenterOverview
            subjects={subjects}
            questions={questions}
            tasks={tasks}
            onSelectSubject={handleSelectSubjectAndOpenWorkspace}
            onOpenAddSubject={() => setIsAddSubjectOpen(true)}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onReorderSubjects={handleReorderSubjects}
          />
        )}



      </main>

      {/* Mobile Bottom Navigation (Persistent on mobile screens with Liquid Glass Dock) */}
      <MobileBottomNav
        currentView={currentView as ExtendedNavView}
        onSelectView={(view) => handleSelectView(view as MainNavView)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        dueFlashcardsCount={dueFlashcardsCount}
      />

      {/* Modal: Add Subject (Single instance opened only from Dashboard/Syllabus + Add Subject button) */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAdd={handleAddSubject}
      />

      {/* Modal: Edit Subject (Requirement 4: Edit subject name & exam date) */}
      <EditSubjectModal
        subject={editingSubject}
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        onUpdate={handleUpdateSubject}
        onDelete={handleDeleteSubject}
      />

      {/* Modal: Backup and Restore JSON */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataReloaded={handleDataReloaded}
        onShowToast={showToast}
      />

      {/* Smart Device-Aware Install App Modal (PWA / iOS Safari / Desktop QR) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onPromptHandled={() => setDeferredPrompt(null)}
        onShowToast={showToast}
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}

export default App;
