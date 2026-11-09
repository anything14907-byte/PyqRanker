import React, { useState, useEffect } from 'react';
import { SubjectMeta, SubjectUnit, SyllabusTopic, TopicMastery, SubjectFile, FileCategory } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  BookOpen, 
  X, 
  ArrowUp,
  ArrowDown,
  Edit2,
  Video,
  Play,
  FileText,
  Image,
  Upload,
  Calendar,
  ExternalLink,
  Tag,
  ChevronDown,
  Flame,
  GripVertical,
  Clock,
  Layers,
  Edit3
} from 'lucide-react';
import { getExamUrgencyColor, extractYoutubeId, formatUnitDisplayName } from '../utils/storageService';
import { indexedDbService } from '../utils/indexedDbService';
import { ConfirmModal } from './ConfirmModal';

interface SyllabusTrackerViewProps {
  subjects: SubjectMeta[];
  activeSubjectId: string;
  activeExamId: string;
  highlightedTopicId?: string;
  onSelectSubject: (id: string) => void;
  topics: SyllabusTopic[];
  onToggleTopicCompleted: (topicId: string) => void;
  onSetTopicMastery: (topicId: string, mastery: TopicMastery) => void;
  onAddTopic: (topic: SyllabusTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onUpdateTopicTitle?: (topicId: string, newTitle: string) => void;
  onReorderTopics?: (topics: SyllabusTopic[]) => void;
  onAddTopicVideo?: (topicId: string, videoUrl: string) => void;
  onRemoveTopicVideo?: (topicId: string, videoUrl: string) => void;
  onAddUnit: (subjectId: string, unitLabel: string, unitTitle?: string) => void;
  onRenameUnit?: (subjectId: string, unitId: string, newLabel: string, newTitle?: string) => void;
  onDeleteUnit?: (subjectId: string, unitId: string) => void;
  onReorderUnit?: (subjectId: string, unitId: string, direction: 'up' | 'down') => void;
  onOpenAddSubject?: () => void;
  onEditSubject?: (subject: SubjectMeta) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SyllabusTrackerView: React.FC<SyllabusTrackerViewProps> = ({
  subjects,
  activeSubjectId,
  activeExamId,
  highlightedTopicId,
  onSelectSubject,
  topics,
  onToggleTopicCompleted,
  onSetTopicMastery,
  onAddTopic,
  onDeleteTopic,
  onUpdateTopicTitle,
  onReorderTopics,
  onAddTopicVideo,
  onRemoveTopicVideo,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
  onReorderUnit,
  onOpenAddSubject,
  onEditSubject,
  onShowToast
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubjectId || subjects[0]?.id || 'os');
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Auto-scroll to highlighted topic if provided
  useEffect(() => {
    if (highlightedTopicId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`topic-${highlightedTopicId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [highlightedTopicId]);

  // Topic creation form state
  const [isAddingTopicUnitId, setIsAddingTopicUnitId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicMastery, setNewTopicMastery] = useState<TopicMastery>('weak');
  const [newTopicVideoUrl, setNewTopicVideoUrl] = useState('');

  // Topic editing state (Requirement 7)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');

  // Drag and drop state for topics (Requirement 8)
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);

  // Unit creation and rename form state (Requirement 5: Separate Label and Title)
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitLabel, setNewUnitLabel] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitLabel, setEditingUnitLabel] = useState('');
  const [editingUnitTitle, setEditingUnitTitle] = useState('');

  // Confirm deletion modals state (Requirement 7 & 12)
  const [topicToDelete, setTopicToDelete] = useState<SyllabusTopic | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; name: string } | null>(null);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);

  // Adding video link to existing topic
  const [addingVideoTopicId, setAddingVideoTopicId] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Active embedded video modal
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);

  // Subject Files (IndexedDB) state
  const [subjectFiles, setSubjectFiles] = useState<SubjectFile[]>([]);
  const [fileFilter, setFileFilter] = useState<'all' | 'pyq' | 'notes' | 'images'>('all');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('pyq');
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString());
  const [uploadExamType, setUploadExamType] = useState('End Sem');
  const [uploadTitle, setUploadTitle] = useState('');

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectTopics = topics.filter(t => t.subjectId === currentSubject?.id);

  // Sync selectedSubjectId if activeSubjectId changes from outside
  useEffect(() => {
    if (activeSubjectId) {
      const match = subjects.find(s => s.id === activeSubjectId);
      if (match && match.id !== selectedSubjectId) {
        setSelectedSubjectId(match.id);
      }
    }
  }, [activeSubjectId, subjects, selectedSubjectId]);

  // Load subject files from IndexedDB whenever subject or exam changes
  useEffect(() => {
    if (currentSubject) {
      indexedDbService.getFiles(currentSubject.id, activeExamId).then(files => {
        setSubjectFiles(files);
      }).catch(err => {
        console.warn('Error loading files from IndexedDB:', err);
      });
    }
  }, [currentSubject?.id, activeExamId]);

  if (!currentSubject) {
    return (
      <div className="p-8 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border space-y-3">
        <h3 className="text-base font-bold text-paper-ink dark:text-night-text">No subjects found for this exam.</h3>
        <p className="text-xs text-paper-muted dark:text-night-muted">
          Add subjects using "+ Add Subject" on the Dashboard (Today screen).
        </p>
      </div>
    );
  }

  // Metrics
  const totalTopics = subjectTopics.length;
  const completedTopics = subjectTopics.filter(t => t.completed).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const weakCount = subjectTopics.filter(t => t.mastery === 'weak').length;
  const okayCount = subjectTopics.filter(t => t.mastery === 'okay').length;
  const strongCount = subjectTopics.filter(t => t.mastery === 'strong').length;
  const urgency = getExamUrgencyColor(currentSubject.examDate);

  // Handlers
  const handleCreateTopic = (unit: SubjectUnit, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTopicTitle.trim()) return;

    const videoUrls: string[] = [];
    if (newTopicVideoUrl.trim()) {
      videoUrls.push(newTopicVideoUrl.trim());
    }

    const newTopic: SyllabusTopic = {
      id: `top-${currentSubject.id}-${unit.id}-${Date.now().toString(36)}`,
      subjectId: currentSubject.id,
      unitId: unit.id,
      unitNumber: unit.unitNumber || unit.unit || unit.title,
      title: newTopicTitle.trim(),
      completed: false,
      mastery: newTopicMastery,
      videoUrls,
      pyqCount: 0
    };

    onAddTopic(newTopic);
    setNewTopicTitle('');
    setNewTopicVideoUrl('');
    setIsAddingTopicUnitId(null);
    onShowToast(`Added topic to ${formatUnitDisplayName(unit)}!`, 'success');
  };

  // Topic Edit Name (Requirement 7)
  const handleEditTopicSubmit = (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingTopicTitle.trim()) return;
    if (onUpdateTopicTitle) {
      onUpdateTopicTitle(topicId, editingTopicTitle.trim());
    }
    setEditingTopicId(null);
    setEditingTopicTitle('');
  };

  // Reorder topics with Up/Down buttons (Requirement 8)
  const handleMoveTopic = (unitId: string, topicId: string, direction: 'up' | 'down') => {
    const unitTopics = subjectTopics.filter(t => t.unitId === unitId);
    const index = unitTopics.findIndex(t => t.id === topicId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= unitTopics.length) return;

    const newUnitTopics = [...unitTopics];
    const [moved] = newUnitTopics.splice(index, 1);
    newUnitTopics.splice(targetIndex, 0, moved);

    const otherTopics = topics.filter(t => t.unitId !== unitId);
    const reordered = [...otherTopics, ...newUnitTopics];
    if (onReorderTopics) {
      onReorderTopics(reordered);
      onShowToast('Topic order updated!', 'success');
    }
  };

  // Reorder topics with Drag & Drop (Requirement 8)
  const handleTopicDrop = (targetTopicId: string, unitId: string) => {
    if (!draggedTopicId || draggedTopicId === targetTopicId) return;
    const unitTopics = subjectTopics.filter(t => t.unitId === unitId);
    const fromIdx = unitTopics.findIndex(t => t.id === draggedTopicId);
    const toIdx = unitTopics.findIndex(t => t.id === targetTopicId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newUnitTopics = [...unitTopics];
    const [moved] = newUnitTopics.splice(fromIdx, 1);
    newUnitTopics.splice(toIdx, 0, moved);

    const otherTopics = topics.filter(t => t.unitId !== unitId);
    const reordered = [...otherTopics, ...newUnitTopics];
    if (onReorderTopics) {
      onReorderTopics(reordered);
      onShowToast('Topic order updated!', 'success');
    }
    setDraggedTopicId(null);
  };

  // Unit creation with separate Label and Title (Requirement 5)
  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newUnitTitle.trim()) return;
    onAddUnit(currentSubject.id, newUnitLabel.trim() || `Unit ${(currentSubject.units?.length || 0) + 1}`, newUnitTitle.trim());
    setNewUnitTitle('');
    setNewUnitLabel('');
    setIsAddingUnit(false);
    onShowToast(`Created unit!`, 'success');
  };

  // Unit rename with separate Label and Title (Requirement 5)
  const handleRenameUnitSubmit = (unitId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingUnitTitle.trim()) return;
    if (onRenameUnit) {
      onRenameUnit(currentSubject.id, unitId, editingUnitLabel.trim() || 'Unit', editingUnitTitle.trim());
      onShowToast('Unit updated successfully.', 'success');
    }
    setEditingUnitId(null);
  };

  const handleAddVideoToTopicSubmit = (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoUrlInput.trim()) return;
    if (onAddTopicVideo) {
      onAddTopicVideo(topicId, videoUrlInput.trim());
      onShowToast('YouTube video attached to topic! 🎥', 'success');
    }
    setVideoUrlInput('');
    setAddingVideoTopicId(null);
  };

  // File Upload Handler (Requirement 8: Stored in IndexedDB, separated by exam)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);

      const newSubjectFile: SubjectFile = {
        id: `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        examId: activeExamId,
        subjectId: currentSubject.id,
        name: uploadTitle.trim() || file.name,
        category: uploadCategory,
        fileType: isPdf ? 'pdf' : (isImg ? 'image' : 'file'),
        dataUrl,
        size: file.size,
        year: uploadCategory === 'pyq' ? uploadYear : undefined,
        examType: uploadCategory === 'pyq' ? uploadExamType : undefined,
        isImportant: false,
        isDone: false,
        createdAt: Date.now()
      };

      await indexedDbService.addFile(newSubjectFile);
      setSubjectFiles(prev => [newSubjectFile, ...prev]);
      setIsUploadingFile(false);
      setUploadTitle('');
      onShowToast(`Uploaded "${newSubjectFile.name}" to IndexedDB! 📄`, 'success');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteFileConfirm = async () => {
    if (fileToDeleteId) {
      await indexedDbService.deleteFile(fileToDeleteId);
      setSubjectFiles(prev => prev.filter(f => f.id !== fileToDeleteId));
      onShowToast('File deleted.', 'info');
      setFileToDeleteId(null);
    }
  };

  const filteredFiles = subjectFiles.filter(f => {
    if (fileFilter === 'all') return true;
    return f.category === fileFilter;
  });

  return (
    <div className="w-full flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-6 animate-fade-slide-up pb-16 items-start">
      
      {/* 1. LEFT PANEL: SUBJECT LIST SWITCHER, EXAM DATE & URGENCY COUNTDOWN, QUICK UNIT JUMP */}
      <aside className="w-full space-y-4 lg:sticky lg:top-20 self-start">
        {/* Subject Switcher List */}
        <div className="p-4 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
            <span className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Subjects ({subjects.length})</span>
            </span>
            {onOpenAddSubject && (
              <button
                onClick={onOpenAddSubject}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                title="Add New Subject"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {subjects.map(s => {
              const isSelected = s.id === currentSubject.id;
              const sTopics = topics.filter(t => t.subjectId === s.id);
              const sCompleted = sTopics.filter(t => t.completed).length;
              const sPercent = sTopics.length > 0 ? Math.round((sCompleted / sTopics.length) * 100) : 0;
              const sUrgency = getExamUrgencyColor(s.examDate);

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSubjectId(s.id);
                    onSelectSubject(s.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left btn-tactile ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text hover:border-emerald-500'
                  }`}
                  style={{ borderLeft: `4px solid ${s.accentColor}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{s.name}</div>
                    <div className={`text-[10px] font-normal truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-paper-muted dark:text-night-muted'}`}>
                      {sUrgency.hasDate ? sUrgency.formattedCountdown : 'No date set'}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-paper-card dark:bg-night-card text-emerald-600 dark:text-emerald-400 border border-paper-border dark:border-night-border'}`}>
                    {sPercent}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Subject Exam Date & Urgency Countdown Card */}
        <div 
          className="p-4 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3"
          style={{ borderTop: `4px solid ${currentSubject.accentColor}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Target Exam Date</span>
            </span>
            {onEditSubject && (
              <button
                onClick={() => onEditSubject(currentSubject)}
                className="text-[11px] font-semibold text-paper-muted hover:text-paper-ink dark:hover:text-night-text flex items-center gap-1"
                title="Edit Exam Date"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div 
            className="p-3 rounded-2xl border text-center transition-all space-y-1"
            style={{
              backgroundColor: urgency.hasDate ? `${urgency.hslColor}10` : 'rgba(91, 101, 115, 0.08)',
              borderColor: urgency.hasDate ? `${urgency.hslColor}35` : 'rgba(91, 101, 115, 0.2)'
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" style={{ color: urgency.hslColor }} />
              <span>{urgency.statusLabel}</span>
            </div>
            <div className="text-xl font-extrabold font-mono tracking-tight" style={{ color: urgency.hslColor }}>
              {urgency.formattedCountdown}
            </div>
            <div className="text-[11px] text-paper-muted dark:text-night-muted truncate">
              {urgency.formattedExamDate}
            </div>
          </div>
        </div>

        {/* Quick Unit Jump List */}
        <div className="p-4 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
            <span className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Unit Jump</span>
            </span>
            <button
              onClick={() => setIsAddingUnit(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              title="Add New Unit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Unit</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {(currentSubject.units || []).map((u, uIdx) => {
              const uTopics = subjectTopics.filter(t => t.unitId === u.id || t.unitNumber === u.unit || t.unitNumber === u.title);
              const uDone = uTopics.filter(t => t.completed).length;
              const uPct = uTopics.length > 0 ? Math.round((uDone / uTopics.length) * 100) : 0;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    const el = document.getElementById(`unit-${u.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated hover:border-emerald-500 border border-paper-border dark:border-night-border text-left transition-all btn-tactile flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-paper-ink dark:text-night-text truncate">
                      {formatUnitDisplayName(u)}
                    </div>
                    <div className="text-[10px] text-paper-muted dark:text-night-muted">
                      {uDone}/{uTopics.length} topics
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {uPct}%
                  </span>
                </button>
              );
            })}
            {(currentSubject.units || []).length === 0 && (
              <p className="text-xs text-paper-muted dark:text-night-muted italic text-center py-2">
                No units created yet.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* 2. RIGHT WIDESCREEN PANEL: SUBJECT BANNER & UNITS CHECKLIST */}
      <div className="min-w-0 w-full space-y-6">
        {/* Selected Subject Banner with Progress */}
        <div 
          className="p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-4"
          style={{ borderTop: `5px solid ${currentSubject.accentColor}` }}
        >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-paper-muted dark:text-night-muted">
                {currentSubject.code}
              </span>
              {currentSubject.semester && (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted">
                  {currentSubject.semester}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-paper-ink dark:text-night-text">
              {currentSubject.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-paper-ink dark:text-night-text">{urgency.formattedExamDate}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold" style={{ backgroundColor: `${urgency.hslColor}20`, color: urgency.hslColor }}>
                {urgency.formattedCountdown}
              </span>
            </div>

            <button
              onClick={() => setIsAddingUnit(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 btn-tactile shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Unit</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Mastery Stats */}
        <div className="space-y-2 pt-2 border-t border-paper-border dark:border-night-border">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-paper-ink dark:text-night-text">
              Syllabus Completion: {completedTopics} of {totalTopics} topics ({progressPercent}%)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-rose-600 font-semibold">{weakCount} Weak</span>
              <span className="text-amber-600 font-semibold">{okayCount} Okay</span>
              <span className="text-emerald-600 font-semibold">{strongCount} Strong</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-paper-cardElevated dark:bg-night-cardElevated overflow-hidden border border-paper-border dark:border-night-border">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Unit Form with Separate Label and Title (Requirement 5) */}
      {isAddingUnit && (
        <form onSubmit={handleCreateUnit} className="p-5 rounded-2xl bg-paper-card dark:bg-night-card border border-emerald-500/40 space-y-3 animate-fade-slide-up shadow-md">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Add Custom Unit to {currentSubject.name}</span>
            </h4>
            <button type="button" onClick={() => setIsAddingUnit(false)} className="text-paper-muted hover:text-paper-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted mb-1">Unit Label</label>
              <input
                type="text"
                placeholder="e.g. Unit 3 or Module 1"
                value={newUnitLabel}
                onChange={e => setNewUnitLabel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-paper-muted dark:text-night-muted mb-1">Unit Title</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Continuous Distribution, Central Limit Theorem..."
                  value={newUnitTitle}
                  onChange={e => setNewUnitTitle(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold btn-tactile shadow-sm shrink-0"
                >
                  Add Unit
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Units List */}
      <div className="space-y-6">
        {(currentSubject.units || []).length === 0 && (
          <div className="p-8 rounded-3xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border text-center space-y-3">
            <BookOpen className="w-8 h-8 text-paper-muted dark:text-night-muted mx-auto opacity-50" />
            <h4 className="text-base font-bold text-paper-ink dark:text-night-text">No units yet</h4>
            <p className="text-xs text-paper-muted dark:text-night-muted max-w-sm mx-auto">
              Add your first unit to begin organizing syllabus topics, lecture videos, and notes.
            </p>
            <button
              onClick={() => setIsAddingUnit(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold btn-tactile inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Unit</span>
            </button>
          </div>
        )}

        {(currentSubject.units || []).map((unit, unitIdx) => {
          const unitTopics = subjectTopics.filter(t => t.unitId === unit.id || t.unitNumber === unit.unit || t.unitNumber === unit.title || t.unitNumber === unit.name);
          const unitCompleted = unitTopics.filter(t => t.completed).length;
          const unitPercent = unitTopics.length > 0 ? Math.round((unitCompleted / unitTopics.length) * 100) : 0;
          const isAddingToThisUnit = isAddingTopicUnitId === unit.id;
          const isEditingThisUnit = editingUnitId === unit.id;

          const unitDisplayName = formatUnitDisplayName(unit);
          const unitNotesCount = subjectFiles.filter(f => f.unitId === unit.id).length;

          return (
            <div 
              key={unit.id}
              id={`unit-${unit.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-4"
              style={{ borderLeft: `5px solid ${currentSubject.accentColor}` }}
            >
              {/* Unit Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                
                {isEditingThisUnit ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRenameUnitSubmit(unit.id, e);
                    }} 
                    className="flex items-center gap-2 flex-1 flex-wrap"
                  >
                    <input
                      type="text"
                      placeholder="Unit Label"
                      value={editingUnitLabel}
                      onChange={(e) => setEditingUnitLabel(e.target.value)}
                      className="w-24 px-3 py-1.5 text-xs font-bold rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-emerald-500 text-paper-ink dark:text-night-text focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Unit Title"
                      value={editingUnitTitle}
                      onChange={(e) => setEditingUnitTitle(e.target.value)}
                      autoFocus
                      required
                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs font-bold rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-emerald-500 text-paper-ink dark:text-night-text focus:outline-none"
                    />
                    <button type="submit" className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg">Save</button>
                    <button type="button" onClick={() => setEditingUnitId(null)} className="px-2 py-1.5 text-xs text-paper-muted">Cancel</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-paper-ink dark:text-night-text">
                          {unitDisplayName}
                        </h4>
                        
                        {/* Unit Edit / Rename Button */}
                        {onRenameUnit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUnitId(unit.id);
                              setEditingUnitLabel(unit.unitLabel || `Unit ${unit.unit || unitIdx + 1}`);
                              setEditingUnitTitle(unit.title || '');
                            }}
                            className="p-1 rounded text-paper-muted hover:text-paper-ink dark:text-night-muted"
                            title="Rename unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reorder Up / Down Controls (Mobile friendly) */}
                        {onReorderUnit && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={unitIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderUnit(currentSubject.id, unit.id, 'up');
                              }}
                              className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move unit up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={unitIdx === (currentSubject.units?.length || 0) - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderUnit(currentSubject.id, unit.id, 'down');
                              }}
                              className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move unit down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Delete Unit */}
                        {onDeleteUnit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnitToDelete({ id: unit.id, name: unitDisplayName });
                            }}
                            className="p-1 rounded text-paper-muted hover:text-rose-500"
                            title="Delete unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-paper-muted dark:text-night-muted font-mono">
                        {unitCompleted} of {unitTopics.length} topics finished ({unitPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* + Add Topic Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingTopicUnitId(isAddingToThisUnit ? null : unit.id);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border hover:border-emerald-500 text-paper-ink dark:text-night-text flex items-center gap-1.5 btn-tactile self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>+ Add Topic</span>
                </button>
              </div>

              {/* Inline Form to Add Topic */}
              {isAddingToThisUnit && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreateTopic(unit, e);
                  }} 
                  className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-emerald-500/30 space-y-3 animate-fade-slide-up"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-paper-ink dark:text-night-text">
                      Add Topic to {unitDisplayName}
                    </span>
                    <button type="button" onClick={() => setIsAddingTopicUnitId(null)} className="text-paper-muted hover:text-paper-ink">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Topic title (e.g. Banker's Algorithm Safe Sequences)..."
                        value={newTopicTitle}
                        onChange={e => setNewTopicTitle(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-medium"
                      />

                      {/* Mastery Selector */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNewTopicMastery('weak')}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${newTopicMastery === 'weak' ? 'bg-rose-600 text-white' : 'bg-paper-card dark:bg-night-card text-rose-600'}`}
                        >
                          Weak
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTopicMastery('okay')}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${newTopicMastery === 'okay' ? 'bg-amber-600 text-white' : 'bg-paper-card dark:bg-night-card text-amber-600'}`}
                        >
                          Okay
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTopicMastery('strong')}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${newTopicMastery === 'strong' ? 'bg-emerald-600 text-white' : 'bg-paper-card dark:bg-night-card text-emerald-600'}`}
                        >
                          Strong
                        </button>
                      </div>
                    </div>

                    {/* Optional YouTube Video link */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Video className="w-3.5 h-3.5 text-paper-muted absolute left-3 top-2.5" />
                        <input
                          type="url"
                          placeholder="Optional YouTube Video link (e.g. https://youtube.com/watch?v=...)"
                          value={newTopicVideoUrl}
                          onChange={e => setNewTopicVideoUrl(e.target.value)}
                          className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold btn-tactile shadow-sm shrink-0"
                      >
                        Save Topic
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Topics List with Reordering (Drag and drop + Up/Down) & Edit (Requirement 7 & 8) */}
              <div className="space-y-2.5">
                {unitTopics.map((topic, tIdx) => {
                  const videosList = topic.videoUrls || [];
                  const isAddingVideo = addingVideoTopicId === topic.id;
                  const isHighlighted = highlightedTopicId === topic.id;
                  const isEditingThisTopic = editingTopicId === topic.id;

                  return (
                    <div 
                      key={topic.id}
                      id={`topic-${topic.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', topic.id);
                        setDraggedTopicId(topic.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleTopicDrop(topic.id, unit.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 group ${
                        isHighlighted
                          ? 'ring-2 ring-emerald-500 bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/20'
                          : topic.completed
                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                          : 'bg-paper-cardElevated dark:bg-night-cardElevated border-paper-border dark:border-night-border hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Checkbox + Title / Edit Form */}
                        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                          {/* Drag Handle & Reorder Up / Down buttons (Requirement 8) */}
                          <div className="flex items-center gap-0.5 text-paper-muted shrink-0 mt-0.5 sm:mt-0">
                            <span className="cursor-grab active:cursor-grabbing p-1 hover:text-paper-ink hidden sm:inline" title="Drag to reorder">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <button
                              type="button"
                              disabled={tIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTopic(unit.id, topic.id, 'up');
                              }}
                              className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Move topic up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={tIdx === unitTopics.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTopic(unit.id, topic.id, 'down');
                              }}
                              className="p-1 rounded text-paper-muted hover:text-paper-ink disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Move topic down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopicCompleted(topic.id);
                            }}
                            className="p-1 mt-0.5 sm:mt-0 text-paper-muted hover:text-emerald-600 dark:text-night-muted dark:hover:text-emerald-400 transition-colors btn-tactile shrink-0"
                            title={topic.completed ? 'Mark uncompleted' : 'Mark completed'}
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-paper-muted dark:text-night-muted" />
                            )}
                          </button>

                          {/* Inline Edit Form OR Wrapped Topic Title (Requirement 7 & 9) */}
                          {isEditingThisTopic ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditTopicSubmit(topic.id, e);
                              }} 
                              className="flex items-center gap-2 flex-1 min-w-0"
                            >
                              <input
                                type="text"
                                value={editingTopicTitle}
                                onChange={(e) => setEditingTopicTitle(e.target.value)}
                                autoFocus
                                required
                                className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-paper-card dark:bg-night-card border border-emerald-500 text-paper-ink dark:text-night-text focus:outline-none"
                              />
                              <button type="submit" onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-sm">Save</button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTopicId(null); }} className="px-2 py-1.5 text-xs text-paper-muted">Cancel</button>
                            </form>
                          ) : (
                            <div className="flex flex-col flex-1 min-w-0">
                              <span 
                                title={topic.title}
                                className={`text-xs font-bold whitespace-normal break-words select-text leading-snug ${
                                  topic.completed 
                                    ? 'line-through text-paper-muted dark:text-night-muted' 
                                    : 'text-paper-ink dark:text-night-text'
                                }`}
                              >
                                {topic.title}
                              </span>

                              {/* Topic Row Resource Icons (Requirement 14: Videos, Notes/Files, PYQs) */}
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-paper-muted dark:text-night-muted">
                                <span className="flex items-center gap-1" title={`${videosList.length} Video(s)`}>
                                  <Video className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                  <span>{videosList.length}</span>
                                </span>
                                <span className="flex items-center gap-1" title={`${unitNotesCount} Notes & Files in unit`}>
                                  <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>{unitNotesCount}</span>
                                </span>
                                <span className="flex items-center gap-1" title={`${topic.pyqCount || 0} PYQ(s)`}>
                                  <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>{topic.pyqCount || 0}</span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mastery Tags & Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          
                          {/* Weak / Okay / Strong Pills */}
                          <div className="flex items-center gap-1 p-1 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetTopicMastery(topic.id, 'weak');
                              }}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                topic.mastery === 'weak'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                              }`}
                              title="Mark as Weak"
                            >
                              Weak
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetTopicMastery(topic.id, 'okay');
                              }}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                topic.mastery === 'okay'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                              }`}
                              title="Mark as Okay"
                            >
                              Okay
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetTopicMastery(topic.id, 'strong');
                              }}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                topic.mastery === 'strong'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title="Mark as Strong"
                            >
                              Strong
                            </button>
                          </div>

                          {/* Edit Topic Name Button (Requirement 7) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTopicId(topic.id);
                              setEditingTopicTitle(topic.title);
                            }}
                            className="p-1.5 text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text rounded-lg hover:bg-paper-card dark:hover:bg-night-card transition-colors"
                            title="Edit topic name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* + Attach Video Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingVideoTopicId(isAddingVideo ? null : topic.id);
                            }}
                            className="p-1.5 text-paper-muted hover:text-emerald-600 dark:text-night-muted dark:hover:text-emerald-400 rounded-lg hover:bg-paper-card dark:hover:bg-night-card transition-colors flex items-center gap-1 text-[11px] font-semibold"
                            title="Attach YouTube video to topic"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">+ Video</span>
                          </button>

                          {/* Delete Topic Button with Confirmation (Requirement 7 & 12) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTopicToDelete(topic);
                            }}
                            className="p-1.5 text-paper-muted hover:text-rose-600 dark:text-night-muted dark:hover:text-rose-400 rounded-lg hover:bg-paper-card dark:hover:bg-night-card transition-colors opacity-70 group-hover:opacity-100"
                            title="Delete topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Attached YouTube Video Links for this topic */}
                      {videosList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pl-8 pt-1">
                          {videosList.map((url, vIdx) => {
                            const ytId = extractYoutubeId(url);
                            return (
                              <div
                                key={vIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold group/video"
                              >
                                <button
                                  type="button"
                                  onClick={() => setActiveVideoModalUrl(url)}
                                  className="flex items-center gap-1 hover:underline"
                                  title="Watch Video"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Video {vIdx + 1} {ytId ? `(${ytId.slice(0, 5)}...)` : ''}</span>
                                </button>

                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 text-paper-muted hover:text-paper-ink"
                                  title="Open in new YouTube tab"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>

                                {onRemoveTopicVideo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveTopicVideo(topic.id, url);
                                    }}
                                    className="p-0.5 text-paper-muted hover:text-rose-500"
                                    title="Remove this video link"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline Form to add another YouTube link to this topic */}
                      {isAddingVideo && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddVideoToTopicSubmit(topic.id, e);
                          }}
                          className="flex items-center gap-2 pl-8 pt-1 animate-fade-slide-up"
                        >
                          <input
                            type="url"
                            required
                            placeholder="Paste YouTube link (https://youtube.com/watch?v=...)"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            autoFocus
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-paper-card dark:bg-night-card border border-emerald-500 text-paper-ink dark:text-night-text focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-sm"
                          >
                            Attach
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingVideoTopicId(null)}
                            className="px-2 py-1.5 text-xs text-paper-muted"
                          >
                            Cancel
                          </button>
                        </form>
                      )}

                    </div>
                  );
                })}

                {unitTopics.length === 0 && (
                  <div className="text-center py-6 text-xs text-paper-muted dark:text-night-muted italic border border-dashed border-paper-border dark:border-night-border rounded-2xl">
                    No topics yet. Add your first topic using "+ Add Topic" above.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Embedded YouTube Video Modal */}
      {activeVideoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-slide-up">
          <div className="w-full max-w-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl overflow-hidden shadow-2xl relative space-y-3 p-4">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-500" />
                <span>Embedded Lecture Player</span>
              </span>
              <button
                onClick={() => setActiveVideoModalUrl(null)}
                className="p-1.5 rounded-xl text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-paper-border dark:border-night-border">
              {extractYoutubeId(activeVideoModalUrl) ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(activeVideoModalUrl)}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <p className="text-xs text-paper-muted">Cannot embed this URL directly.</p>
                  <a
                    href={activeVideoModalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Modal (Requirement 7 & 12) */}
      <ConfirmModal
        isOpen={!!topicToDelete}
        title="Delete Topic?"
        message={`Are you sure you want to delete topic "${topicToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Topic"
        isDanger={true}
        onCancel={() => setTopicToDelete(null)}
        onConfirm={() => {
          if (topicToDelete) {
            onDeleteTopic(topicToDelete.id);
            setTopicToDelete(null);
          }
        }}
      />

      {/* Delete Unit Confirmation Modal (Requirement 12) */}
      <ConfirmModal
        isOpen={!!unitToDelete}
        title="Delete Unit?"
        message={`Are you sure you want to delete "${unitToDelete?.name}"? All topics inside this unit will be removed.`}
        confirmLabel="Delete Unit"
        isDanger={true}
        onCancel={() => setUnitToDelete(null)}
        onConfirm={() => {
          if (unitToDelete && onDeleteUnit) {
            onDeleteUnit(currentSubject.id, unitToDelete.id);
            onShowToast(`Deleted "${unitToDelete.name}".`, 'info');
            setUnitToDelete(null);
          }
        }}
      />

      {/* Delete File Confirmation Modal (Requirement 12) */}
      <ConfirmModal
        isOpen={!!fileToDeleteId}
        title="Delete File?"
        message="Are you sure you want to delete this file from IndexedDB? This action cannot be undone."
        confirmLabel="Delete File"
        isDanger={true}
        onCancel={() => setFileToDeleteId(null)}
        onConfirm={handleDeleteFileConfirm}
      />

    </div>
  );
};
