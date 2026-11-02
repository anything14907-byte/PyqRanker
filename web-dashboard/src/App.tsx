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
import { SpaceScene } from './components/SpaceScene';
import { LiquidAuroraScene } from './components/LiquidAuroraScene';
import { CommandSubHeader } from './components/CommandSubHeader';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { InstallAppModal } from './components/InstallAppModal';
import { deviceSyncService, SyncPayload } from './services/deviceSyncService';

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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [syncPeersCount, setSyncPeersCount] = useState(1);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Ticker for live 1-second countdown rerender across the entire app
  const [, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Specular Liquid Rim Light Tracking: pointermove & touchmove -> --mouse-x, --mouse-y
  useEffect(() => {
    const updatePointer = (e: MouseEvent | TouchEvent) => {
      let clientX = window.innerWidth / 2;
      let clientY = window.innerHeight / 2;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      const x = Math.round((clientX / window.innerWidth) * 100);
      const y = Math.round((clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', updatePointer, { passive: true });
    window.addEventListener('touchmove', updatePointer, { passive: true });
    return () => {
      window.removeEventListener('mousemove', updatePointer);
      window.removeEventListener('touchmove', updatePointer);
    };
  }, []);

  // Interactive Optical Glass Specular Glare: updates --x and --y on hovered cards
  useEffect(() => {
    const handleCardGlare = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      const cards = document.querySelectorAll('.hardware-card, .liquid-glass-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (
          clientX >= rect.left - 20 &&
          clientX <= rect.right + 20 &&
          clientY >= rect.top - 20 &&
          clientY <= rect.bottom + 20
        ) {
          (card as HTMLElement).style.setProperty('--x', `${clientX - rect.left}px`);
          (card as HTMLElement).style.setProperty('--y', `${clientY - rect.top}px`);
        }
      });
    };

    window.addEventListener('mousemove', handleCardGlare, { passive: true });
    window.addEventListener('touchmove', handleCardGlare, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleCardGlare);
      window.removeEventListener('touchmove', handleCardGlare);
    };
  }, []);

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

  // WebRTC PeerJS & BroadcastChannel Multi-Device State Sync
  useEffect(() => {
    const unsubSync = deviceSyncService.subscribe((msg: SyncPayload) => {
      if (msg.type === 'SYNC_STATE' && msg.payload) {
        try {
          storageService.restoreBackup(msg.payload);
          setExamSessions(storageService.getExamSessions());
          const newActive = storageService.getActiveExam();
          setActiveExamId(newActive);
          reloadExamData(newActive);
          showToast(`⚡ Synced live from ${msg.senderDevice}`, 'info');
        } catch (e) {
          console.error('Failed to apply sync state', e);
        }
      } else if (msg.type === 'VIEW_CHANGE' && msg.payload?.view) {
        setCurrentView(msg.payload.view as MainNavView);
        if (msg.payload.activeSubjectId) {
          setActiveSubjectId(msg.payload.activeSubjectId);
        }
        showToast(`Navigated via ${msg.senderDevice}`, 'info');
      } else if (msg.type === 'REQUEST_STATE') {
        try {
          const fullBackup = storageService.getBackupObject();
          deviceSyncService.broadcastState(fullBackup);
        } catch (e) {
          console.error('Failed to broadcast state on request', e);
        }
      }
    });

    const unsubStatus = deviceSyncService.onStatus((status) => {
      setSyncPeersCount(Math.max(1, status.connectedPeersCount));
    });

    return () => {
      unsubSync();
      unsubStatus();
    };
  }, [reloadExamData, showToast]);

  const handleSelectView = (view: MainNavView) => {
    setCurrentView(view);
    deviceSyncService.syncView(view, activeSubjectId);
  };

  // Exam switcher handlers (Requirement 3)
  const handleSelectExam = (examId: string) => {
    storageService.setActiveExam(examId);
    setActiveExamId(examId);
    reloadExamData(examId);
    const session = examSessions.find(e => e.id === examId);
    showToast(`Switched to: ${session?.name || examId}`, 'info');
  };

  const handleAddExam = (name: string) => {
    const newSession = storageService.addExamSession(name);
    setExamSessions(storageService.getExamSessions());
    setActiveExamId(newSession.id);
    reloadExamData(newSession.id);
    showToast(`Created exam: "${name}"! 🎓`, 'success');
  };

  const handleRenameExam = (examId: string, newName: string) => {
    const updated = storageService.renameExamSession(examId, newName);
    setExamSessions(updated);
    showToast(`Renamed exam to "${newName}"`, 'success');
  };

  const handleDeleteExam = (examId: string) => {
    const updated = storageService.deleteExamSession(examId);
    setExamSessions(updated);
    const nextExam = storageService.getActiveExam();
    setActiveExamId(nextExam);
    reloadExamData(nextExam);
    showToast('Exam deleted.', 'info');
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
  };

  const handleUpdateSubject = (updatedSubject: SubjectMeta) => {
    const updated = storageService.updateSubject(updatedSubject, activeExamId);
    setSubjects(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
    showToast(`Updated "${updatedSubject.name}"!`, 'success');
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
  };

  const handleReorderSubjects = (reordered: SubjectMeta[]) => {
    storageService.saveSubjects(reordered, activeExamId);
    setSubjects(reordered);
  };

  // ==========================================
  // UNIT HANDLERS (Requirement 5: Custom unit title/number, rename, delete, reorder)
  // ==========================================
  const handleAddUnit = (subjectId: string, unitLabel: string, unitTitle?: string) => {
    const updated = storageService.addUnit(subjectId, unitLabel, unitTitle, activeExamId);
    setSubjects(updated);
  };

  const handleRenameUnit = (subjectId: string, unitId: string, newLabel: string, newTitle?: string) => {
    const updated = storageService.renameUnit(subjectId, unitId, newLabel, newTitle, activeExamId);
    setSubjects(updated);
  };

  const handleDeleteUnit = (subjectId: string, unitId: string) => {
    const updated = storageService.deleteUnit(subjectId, unitId, activeExamId);
    setSubjects(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
  };

  const handleReorderUnit = (subjectId: string, unitId: string, direction: 'up' | 'down') => {
    const updated = storageService.reorderUnit(subjectId, unitId, direction, activeExamId);
    setSubjects(updated);
  };

  // ==========================================
  // SYLLABUS TOPIC HANDLERS (Requirement 6: Videos, Weak/Okay/Strong, Checkbox)
  // ==========================================
  const handleToggleTopicCompleted = (topicId: string) => {
    const updated = storageService.toggleTopicCompleted(topicId, activeExamId);
    setTopics(updated);
  };

  const handleSetTopicMastery = (topicId: string, mastery: TopicMastery) => {
    const updated = storageService.setTopicMastery(topicId, mastery, activeExamId);
    setTopics(updated);
    showToast(`Marked topic as ${mastery.toUpperCase()}`, 'info');
  };

  const handleAddTopic = (topic: SyllabusTopic) => {
    const updated = storageService.addTopic(topic, activeExamId);
    setTopics(updated);
  };

  const handleDeleteTopic = (topicId: string) => {
    const updated = storageService.deleteTopic(topicId, activeExamId);
    setTopics(updated);
    showToast('Topic removed from syllabus.', 'info');
  };

  const handleAddTopicVideo = (topicId: string, videoUrl: string) => {
    const updated = storageService.addTopicVideo(topicId, videoUrl, activeExamId);
    setTopics(updated);
  };

  const handleRemoveTopicVideo = (topicId: string, videoUrl: string) => {
    const updated = storageService.removeTopicVideo(topicId, videoUrl, activeExamId);
    setTopics(updated);
  };

  const handleUpdateTopicTitle = (topicId: string, newTitle: string) => {
    const updated = storageService.updateTopicTitle(topicId, newTitle, activeExamId);
    setTopics(updated);
    showToast('Topic title updated!', 'success');
  };

  const handleReorderTopics = (reorderedTopics: SyllabusTopic[]) => {
    const updated = storageService.reorderTopics(reorderedTopics, activeExamId);
    setTopics(updated);
  };

  // ==========================================
  // QUESTION HANDLERS
  // ==========================================
  const handleToggleMastered = (id: string) => {
    const updated = storageService.toggleQuestionMastered(id);
    setQuestions(updated);
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
  };

  const handleAddQuestion = (q: PYQQuestion) => {
    const updated = storageService.addQuestion(q, activeExamId);
    setQuestions(updated);
    setTopics(storageService.getTopics(undefined, activeExamId));
    showToast('Question saved to subject PYQ bank! 🔥', 'success');
  };

  // ==========================================
  // FOCUS TIMER / POMODORO HANDLERS
  // ==========================================
  const handleLogPomodoro = (subjectId: string, minutes: number) => {
    const updated = storageService.logPomodoroSession(subjectId, minutes, activeExamId);
    setPomodoroLogs(updated);
    const subName = subjects.find(s => s.id === subjectId)?.name || 'Subject';
    showToast(`Logged ${minutes} min focus session for ${subName}! 🔥`, 'success');
  };

  const handleResetPomodoro = () => {
    storageService.resetPomodoroLogs(activeExamId);
    setPomodoroLogs([]);
    showToast('Focus timer data reset to 0 mins.', 'info');
  };

  // ==========================================
  // FLASHCARD HANDLERS
  // ==========================================
  const handleAddFlashcard = (card: Flashcard) => {
    const updated = storageService.addFlashcard(card, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard saved! 🧠', 'success');
  };

  const handleUpdateFlashcard = (card: Flashcard) => {
    const updated = storageService.updateFlashcard(card, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard updated!', 'success');
  };

  const handleReviewCard = (cardId: string, rating: 'hard' | 'good' | 'easy') => {
    const updated = storageService.reviewFlashcard(cardId, rating, activeExamId);
    setFlashcards(updated);
  };

  const handleDeleteFlashcard = (cardId: string) => {
    const updated = storageService.deleteFlashcard(cardId, activeExamId);
    setFlashcards(updated);
    showToast('Flashcard deleted.', 'info');
  };

  // ==========================================
  // VIDEO HANDLERS (YOUTUBE VAULT)
  // ==========================================
  const handleAddVideo = useCallback((video: VideoResource) => {
    const updated = storageService.addVideo(video, activeExamId);
    setVideos(updated);
    showToast('Lecture saved to YouTube Vault! 🎥', 'success');
  }, [activeExamId, showToast]);

  const handleUpdateVideoNotes = useCallback((id: string, notes: string) => {
    const updated = storageService.updateVideoNotes(id, notes, activeExamId);
    setVideos(updated);
  }, [activeExamId]);

  const handleToggleVideoWatched = useCallback((id: string) => {
    const updated = storageService.toggleVideoWatched(id, activeExamId);
    setVideos(updated);
  }, [activeExamId]);

  const handleDeleteVideo = useCallback((id: string) => {
    const updated = storageService.deleteVideo(id, activeExamId);
    setVideos(updated);
    showToast('Video removed from Vault.', 'info');
  }, [activeExamId, showToast]);

  // ==========================================
  // PDF HANDLERS
  // ==========================================
  const handleAddPdf = (pdf: PdfResource) => {
    const updated = storageService.addPdf(pdf, activeExamId);
    setPdfs(updated);
    showToast('PDF saved to notes! 📄', 'success');
  };

  const handleDeletePdf = (id: string) => {
    const updated = storageService.deletePdf(id, activeExamId);
    setPdfs(updated);
    showToast('Document removed.', 'info');
  };

  // Task Handlers for Workspace
  const handleToggleTask = (id: string) => {
    const updated = storageService.toggleTask(id, activeExamId);
    setTasks(updated);
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
  };

  const handleDeleteTask = (id: string) => {
    const updated = storageService.deleteTask(id, activeExamId);
    setTasks(updated);
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
  };

  const handleDataReloaded = () => {
    setExamSessions(storageService.getExamSessions());
    reloadExamData(activeExamId);
  };

  return (
    <div className="relative min-h-screen w-full bg-paper-bg dark:bg-[#070b14] text-paper-ink dark:text-night-text transition-colors duration-200">
      {/* Living Fluid Aurora & Micro Caustic Wave Mesh Backdrop */}
      <LiquidAuroraScene />
      
      <div className="relative z-10 w-full min-h-screen">
        {/* ROW 1: Ultra-Clean Main Liquid Glass Header Bar */}
        <Navbar
          currentView={currentView}
          onSelectView={handleSelectView}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenSyncDevices={() => setIsSyncModalOpen(true)}
          onOpenInstallApp={() => setIsInstallModalOpen(true)}
          syncPeersCount={syncPeersCount}
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

      {/* Main Content Area: 100% corner-to-corner full viewport width (16px 28px edge padding) */}
      <main className="w-full px-4 sm:px-7 py-4 pb-28 md:pb-12 box-border">
        
        {/* VIEW 1: TODAY / DASHBOARD SCREEN (Restored + without auto-generated planner + single + Add Subject) */}
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
              setCurrentView('workspace');
            }}
            onNavigateView={setCurrentView}
            onShowToast={showToast}
            onOpenAddSubject={() => setIsAddSubjectOpen(true)}
            onEditSubject={(sub) => setEditingSubject(sub)}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onReorderSubjects={handleReorderSubjects}
          />
        )}

        {/* VIEW 2: SYLLABUS TRACKER (Restored + custom units + topic videos + unit reorder + IndexedDB files + topic highlight) */}
        {currentView === 'syllabus' && (
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

        {/* VIEW 9: SUBJECT WORKSPACE */}
        {currentView === 'workspace' && activeSubject && (
          <SubjectWorkspace
            subject={activeSubject}
            initialUnitId={activeUnitId}
            questions={questions}
            tasks={tasks}
            videos={videos}
            pdfs={pdfs}
            onToggleMastered={handleToggleMastered}
            onSaveAnswer={handleSaveAnswer}
            onAddQuestion={handleAddQuestion}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onAddVideo={handleAddVideo}
            onUpdateVideoNotes={handleUpdateVideoNotes}
            onToggleVideoWatched={handleToggleVideoWatched}
            onDeleteVideo={handleDeleteVideo}
            onAddPdf={handleAddPdf}
            onDeletePdf={handleDeletePdf}
            onMoveItemToUnit={handleMoveItemToUnit}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            activeExamId={activeExamId}
            topics={topics}
            pomodoroLogs={pomodoroLogs}
            onLogPomodoro={handleLogPomodoro}
            onBackToOverview={() => setCurrentView('overview')}
            onShowToast={showToast}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation (Persistent on mobile screens with Liquid Glass Dock) */}
      <MobileBottomNav
        currentView={currentView as ExtendedNavView}
        onSelectView={(view) => handleSelectView(view as MainNavView)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenSyncDevices={() => setIsSyncModalOpen(true)}
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

      {/* Real-Time Multi-Device Connection Hub Modal (WebRTC + QR Code) */}
      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onShowToast={showToast}
        onStateSynced={() => {
          handleDataReloaded();
          showToast('Devices synced successfully! ✨', 'success');
        }}
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
