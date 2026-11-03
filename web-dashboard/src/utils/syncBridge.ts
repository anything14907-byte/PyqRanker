import { SubjectMeta, PYQQuestion, SubjectId, SyncPayload } from '../types';
import { storageService } from './storageService';

const STORAGE_KEY = 'pyq_ranker_questions_v1';
const SUBJECT_KEY = 'pyq_ranker_active_subject_v1';
const THEME_KEY = 'pyq_ranker_theme_v1';
const EXAM_DATE_KEY = 'pyq_ranker_target_exam_v1';

/**
 * Broadcast sync data to extension and local storage
 */
export function broadcastSync(questions: PYQQuestion[], activeSubjectId: SubjectId, theme: 'light' | 'dark', subjects?: SubjectMeta[]) {
  const currentSubjects = subjects || storageService.getSubjects();

  // Save locally in localStorage for web dashboard persistence
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    localStorage.setItem(SUBJECT_KEY, activeSubjectId);
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }

  // Dispatch postMessage event for the Manifest V3 content script
  const payload: SyncPayload = {
    version: '2.0.0',
    timestamp: Date.now(),
    subjects: currentSubjects,
    questions,
    activeSubjectId,
    theme
  };

  window.postMessage({ type: 'PYQ_SYNC_DATA', payload }, '*');
}

/**
 * Load questions from localStorage or fallback to defaults
 */
export function loadSavedQuestions(defaultQuestions: PYQQuestion[]): PYQQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved questions, using default dataset:', e);
  }
  return defaultQuestions;
}

/**
 * Export full JSON snapshot file
 */
export function exportJsonSnapshot(questions: PYQQuestion[], activeSubjectId: SubjectId) {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    appName: 'Study OS',
    version: '1.0.0',
    activeSubjectId,
    questionsCount: questions.length,
    questions
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `StudyOS_Backup_${activeSubjectId.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Import JSON snapshot file
 */
export function importJsonSnapshot(file: File): Promise<PYQQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.questions)) {
          resolve(parsed.questions);
        } else if (Array.isArray(parsed)) {
          resolve(parsed);
        } else {
          reject(new Error('Invalid snapshot format. Expected an array of questions.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read snapshot file.'));
    reader.readAsText(file);
  });
}

/**
 * Save / Read Target Exam date
 */
export function getSavedExamDate(subjectId: SubjectId): string {
  try {
    const dates = JSON.parse(localStorage.getItem(EXAM_DATE_KEY) || '{}');
    if (dates[subjectId]) return dates[subjectId];
  } catch {}
  // Default target: 14 days from today at 09:30 AM
  const target = new Date();
  target.setDate(target.getDate() + 14);
  target.setHours(9, 30, 0, 0);
  return target.toISOString();
}

export function saveExamDate(subjectId: SubjectId, isoDate: string) {
  try {
    const dates = JSON.parse(localStorage.getItem(EXAM_DATE_KEY) || '{}');
    dates[subjectId] = isoDate;
    localStorage.setItem(EXAM_DATE_KEY, JSON.stringify(dates));
  } catch (e) {
    console.error('Failed to save exam date', e);
  }
}
