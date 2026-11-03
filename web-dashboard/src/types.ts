export type SubjectId = string;

export type QuestionMarks = 2 | 5 | 10;

export type QuestionStatus = 'not-started' | 'mastered';

export type TopicMastery = 'weak' | 'okay' | 'strong';

export interface ExamSession {
  id: string; // e.g. 'mid-sem', 'end-sem', 'internals'
  name: string; // e.g. 'Mid Sem', 'End Sem', 'Internals'
  isDefault?: boolean;
  createdAt: number;
}

export interface SubjectUnit {
  id: string; // e.g. 'u1' or 'unit-1'
  unitLabel?: string; // User-typed label: e.g. "Unit 3", "Module A", "Section 1"
  unit?: number; // 1, 2, 3... (legacy fallback)
  unitNumber?: string | number; // e.g. "Unit 3", "Unit 4", or custom
  title: string; // e.g. 'Continuous Distribution, Central Limit Theorem'
  name?: string; // alias for title
  unitProgress?: number; // 0 - 100% live readiness
  studyMinutes?: number;
}

export interface SyllabusTopic {
  id: string;
  subjectId: SubjectId;
  unitId: string;
  unitNumber?: string | number;
  unitLabel?: string;
  title: string;
  completed: boolean;
  mastery: TopicMastery;
  videoUrls?: string[]; // YouTube video links attached to this topic
  notes?: string;
  pyqCount?: number;
  createdAt?: number;
}

export interface PYQQuestion {
  id: string;
  subjectId: SubjectId;
  subjectName: string;
  unit: number;
  unitTitle: string;
  unitLabel?: string;
  unitId?: string; // Links question to a specific SubjectUnit
  topicId?: string;
  topicTitle?: string;
  question: string;
  marks: QuestionMarks;
  yearsAsked: number[];
  repeatCount: number;
  isHighProbability: boolean;
  expectedKeywords: string[];
  
  // Student-friendly exam model answers
  bullets: string[];
  diagramFormulaTip: string;
  
  userStatus: QuestionStatus;
  userNotes?: string;
  lastAttemptScore?: number;
  lastAttemptAnswer?: string;
  bookmarked?: boolean;
  isCustom?: boolean;
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  code?: string;
  semester?: string;
  examDate?: string; // ISO datetime string: 'YYYY-MM-DDTHH:mm' (optional if unset)
  iconName: string;
  accentColor: string; // 10 distinct swatches
  units: SubjectUnit[];
  syllabus?: any;
  topics?: any;
  studyMinutes?: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  label: string;
  urgency: 'critical' | 'high' | 'normal';
}

export interface ExamUrgency {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  fractionalDays: number;
  hue: number;
  hslColor: string;
  isUrgent: boolean; // fractionalDays <= 5
  hasDate?: boolean;
  statusLabel: string;
  formattedCountdown: string;
  formattedExamDate: string;
}

export interface StudyTask {
  id: string;
  subjectId: SubjectId;
  text: string;
  completed: boolean;
  isMission: boolean;
  createdAt: number;
  category?: string;
  unitId?: string; // Links task to a specific SubjectUnit
  unit?: number;
}

export interface VideoResource {
  id: string;
  subjectId: SubjectId;
  title: string;
  youtubeUrl: string;
  videoId: string;
  notes: string;
  isWatched: boolean;
  addedAt: number;
  unitId?: string; // Links video to a specific SubjectUnit
  unit?: number;
}

export interface PdfResource {
  id: string;
  subjectId: SubjectId;
  fileName: string;
  uploadDate: string;
  fileSize: string;
  extractedText: string;
  summary: string;
  extractedQuestions?: string[];
  unitId?: string; // Links PDF to a specific SubjectUnit
  unit?: number;
}

export interface ConceptExplainer {
  id: string;
  subjectId: SubjectId;
  unit: number;
  topicTitle: string;
  oneMinuteSummary: string;
  architectureFlow: {
    title: string;
    steps: string[];
  };
  examPoints: string[];
  rubricKeywords: string[];
}

export interface EvaluationResult {
  scoreOutOf10: number;
  percentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  wordCount: number;
  feedback: string;
  passedThreshold: boolean;
}

export interface SyncPayload {
  version: string;
  timestamp: number;
  subjects: SubjectMeta[];
  questions: PYQQuestion[];
  activeSubjectId: SubjectId;
  theme: 'light' | 'dark';
}

export interface PomodoroSession {
  id: string;
  subjectId: SubjectId;
  subjectName?: string;
  accentColor?: string;
  minutes: number;
  date: string; // 'YYYY-MM-DD'
  timestamp: number;
}

export interface Flashcard {
  id: string;
  subjectId: SubjectId;
  unitId?: string;
  topicId?: string;
  topicTitle?: string;
  front: string;
  back: string;
  intervalStep: 0 | 1 | 2 | 3; // 0=new (today), 1=1d, 2=3d, 3=7d
  nextReviewDate: string; // 'YYYY-MM-DD'
  createdAt: number;
  lastReviewedAt?: number;
}

export interface PlannerDayTopic {
  topicId: string;
  subjectId: SubjectId;
  subjectName: string;
  accentColor: string;
  unitNumber?: string | number;
  title: string;
  mastery: TopicMastery;
  frequency: number; // PYQ count
  completed: boolean;
  estimatedMinutes: number;
}

export interface DayStudyPlan {
  date: string; // 'YYYY-MM-DD'
  dayNumber: number;
  label: string; // e.g. "Today (Day 1)", "Tomorrow (Day 2)"
  isToday: boolean;
  isPast: boolean;
  topics: PlannerDayTopic[];
}

export interface MasterAppState {
  version: string;
  timestamp: number;
  sourceDevice?: string;
  activeExamId: string;
  examSessions: ExamSession[];
  activeSubjectId: string;
  themeMode: string;
  theme: string;
  liquidMotionEnabled: boolean;
  subjectSortMode: 'date' | 'custom';
  timerSettings?: {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    soundEnabled: boolean;
  };
  videoPositions?: Record<string, number>;
  vaultActiveVideoId?: string;
  exams: Record<string, {
    subjects: SubjectMeta[];
    questions: PYQQuestion[];
    tasks: StudyTask[];
    videos: VideoResource[];
    pdfs: PdfResource[];
    topics: SyllabusTopic[];
    pomodoroLogs: PomodoroSession[];
    flashcards: Flashcard[];
  }>;
  rawKeys?: Record<string, string>;
}

export interface FullBackupData {
  version: string;
  exportedAt: string;
  subjects: SubjectMeta[];
  topics: SyllabusTopic[];
  questions: PYQQuestion[];
  tasks: StudyTask[];
  videos: VideoResource[];
  pdfs: PdfResource[];
  pomodoroLogs: PomodoroSession[];
  flashcards: Flashcard[];
  videoPositions?: Record<string, number>;
  vaultActiveVideoId?: string;
}

export type FileCategory = 'pyq' | 'notes' | 'images';

export interface SubjectFile {
  id: string;
  examId?: string; // Links file to a specific ExamSession
  subjectId: string;
  unitId?: string; // Links file to a specific SubjectUnit
  name: string; // Title / filename
  description?: string;
  category: FileCategory; // 'pyq' | 'notes' | 'images'
  fileType: 'pdf' | 'image' | string;
  dataUrl: string; // Base64 data URL for instant offline preview & rendering
  content?: string; // Optional raw text content for notes
  size: number; // Bytes
  year?: string; // For PYQ Papers: e.g. "2024", "2023"
  examType?: string; // For PYQ Papers: e.g. "End Sem", "Mid Sem", "Internal 1"
  date?: string; // For Teacher Notes: optional date string
  isImportant: boolean; // Star ⭐ (pinned to top)
  isDone: boolean; // Tick as completed / studied ✅
  createdAt: number;
  updatedAt?: number;
}

export interface SubjectNote {
  subjectId: string;
  content: string;
  lastUpdated: number;
}

export interface HubBackupData {
  version: string;
  exportedAt: string;
  subjects: SubjectMeta[];
  files: SubjectFile[];
  notes: SubjectNote[];
  videos: VideoResource[];
  storageBytes?: number;
}

