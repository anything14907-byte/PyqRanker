/**
 * Unified Search Service for PyqRanker
 * 
 * Features:
 * 1. Substring matching anywhere in the text ("ing" -> "Routing", "cept" -> "Concept", "rout" -> "Ad hoc Routing").
 * 2. Case-insensitive, punctuation-ignoring, accent-insensitive normalization.
 * 3. Multi-word search in any order ("depreciation concept" -> "Concept of Depreciation").
 * 4. Light typo tolerance (Levenshtein distance <= 1 on words >= 5 characters) as fallback when 0 exact matches.
 * 5. Comprehensive search across Subjects, Units, Topics, Notes & Files, Videos, PYQs, Flashcards, Tasks.
 * 6. "Search all exams" toggle support.
 */

import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  Flashcard, 
  ExamSession,
  SubjectFile 
} from '../types';
import { storageService, formatUnitDisplayName } from './storageService';
import { indexedDbService } from './indexedDbService';

export type SearchItemType = 
  | 'subject' 
  | 'unit' 
  | 'topic' 
  | 'file' 
  | 'note' 
  | 'video' 
  | 'pyq' 
  | 'flashcard' 
  | 'task';

export type SearchItemGroup = 
  | 'Subjects' 
  | 'Units' 
  | 'Topics' 
  | 'Notes & Files' 
  | 'Videos' 
  | 'PYQs' 
  | 'Flashcards' 
  | 'Tasks';

export interface SearchIndexItem {
  id: string;
  type: SearchItemType;
  group: SearchItemGroup;
  title: string;
  subtitle?: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  subjectAccent?: string;
  unitId?: string;
  unitName?: string;
  breadcrumb: string;
  searchableText: string;
  normText: string;
  rawItem?: any;
}

export interface SearchResultGroup {
  group: SearchItemGroup;
  items: SearchIndexItem[];
  totalCount: number;
}

export interface SearchExecutionResult {
  groups: SearchResultGroup[];
  totalResults: number;
  isTypoMatch: boolean;
  queryWords: string[];
}

/**
 * Normalizes text for searching:
 * - Decomposes and strips accents / diacritics
 * - Lowercases
 * - Replaces punctuation and special symbols with spaces
 * - Collapses extra spaces and trims
 */
export function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s\-_—,.:;!?'"()\[\]{}\/\\#@$%^&*+=|<>~`]+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Check if a query word fuzzy-matches any word in targetText with edit distance <= 1
 * Applies only when query word length >= 5.
 */
function wordMatchesFuzzy(queryWord: string, targetWords: string[]): boolean {
  if (queryWord.length < 5) return false;

  for (const tw of targetWords) {
    if (tw.length < 3) continue;

    // Direct edit distance
    if (Math.abs(tw.length - queryWord.length) <= 1) {
      if (levenshtein(queryWord, tw) <= 1) return true;
    }

    // Substring edit distance for compound words
    if (tw.length > queryWord.length) {
      for (let i = 0; i <= tw.length - queryWord.length; i++) {
        const slice = tw.slice(i, i + queryWord.length);
        if (levenshtein(queryWord, slice) <= 1) return true;
      }
    }
  }

  return false;
}

/**
 * Break text into highlighted chunks according to query words
 */
export function getHighlightedChunks(
  text: string, 
  queryWords: string[]
): Array<{ text: string; isMatch: boolean }> {
  if (!text) return [];
  const cleanWords = queryWords
    .map(w => w.trim())
    .filter(w => w.length > 0)
    .sort((a, b) => b.length - a.length);

  if (cleanWords.length === 0) {
    return [{ text, isMatch: false }];
  }

  const escaped = cleanWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const tokens = text.split(regex);

  const testRegex = new RegExp(`^(${escaped.join('|')})$`, 'i');

  return tokens.map(token => ({
    text: token,
    isMatch: testRegex.test(token)
  }));
}

/**
 * Build unified in-memory search index for active exam (or all exams)
 */
export function buildSearchIndex(
  activeExamId: string,
  examSessions: ExamSession[],
  searchAllExams: boolean,
  currentExamData: {
    subjects: SubjectMeta[];
    topics: SyllabusTopic[];
    questions: PYQQuestion[];
    tasks: StudyTask[];
    videos: VideoResource[];
    pdfs: PdfResource[];
    flashcards: Flashcard[];
    files?: SubjectFile[];
  }
): SearchIndexItem[] {
  const items: SearchIndexItem[] = [];

  const examsToProcess = searchAllExams 
    ? examSessions 
    : examSessions.filter(e => e.id === activeExamId);

  // If no exams found, fallback to activeExamId
  if (examsToProcess.length === 0) {
    const fallbackName = activeExamId === 'end-sem' ? 'End Semester Exam' : 'Mid Semester Exam';
    examsToProcess.push({ id: activeExamId, name: fallbackName, createdAt: 0 });
  }

  for (const exam of examsToProcess) {
    const isCurrent = exam.id === activeExamId;

    // Read data for this exam
    const subjects = isCurrent ? currentExamData.subjects : storageService.getSubjects(exam.id);
    const topics = isCurrent ? currentExamData.topics : storageService.getTopics(undefined, exam.id);
    const questions = isCurrent ? currentExamData.questions : storageService.getQuestions(exam.id);
    const tasks = isCurrent ? currentExamData.tasks : storageService.getTasks(exam.id);
    const videos = isCurrent ? currentExamData.videos : storageService.getVideos(exam.id);
    const pdfs = isCurrent ? currentExamData.pdfs : storageService.getPdfs(exam.id);
    const flashcards = isCurrent ? currentExamData.flashcards : storageService.getFlashcards(undefined, exam.id);

    // Subject Map for fast lookup
    const subjectMap = new Map<string, SubjectMeta>();
    subjects.forEach(s => subjectMap.set(s.id, s));

    // 1. SUBJECTS
    for (const sub of subjects) {
      const text = `${sub.name}`;
      items.push({
        id: `sub-${exam.id}-${sub.id}`,
        type: 'subject',
        group: 'Subjects',
        title: sub.name,
        subtitle: `${sub.units?.length || 0} Units • ${sub.examDate ? 'Exam scheduled' : 'No date set'}`,
        examId: exam.id,
        examName: exam.name,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectAccent: sub.accentColor,
        breadcrumb: `${exam.name} > ${sub.name}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: sub
      });

      // 2. UNITS
      if (Array.isArray(sub.units)) {
        for (const unit of sub.units) {
          const unitDisplayName = formatUnitDisplayName(unit);
          const rawTitle = unit.title || unit.name || '';
          const unitText = `${unitDisplayName} ${rawTitle} ${unit.unitLabel || ''}`;

          items.push({
            id: `unit-${exam.id}-${sub.id}-${unit.id || unit.unit}`,
            type: 'unit',
            group: 'Units',
            title: unitDisplayName,
            subtitle: `Unit inside ${sub.name}`,
            examId: exam.id,
            examName: exam.name,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectAccent: sub.accentColor,
            unitId: unit.id,
            unitName: unitDisplayName,
            breadcrumb: `${exam.name} > ${sub.name} > ${unitDisplayName}`,
            searchableText: unitText,
            normText: normalizeForSearch(unitText),
            rawItem: unit
          });
        }
      }
    }

    // 3. TOPICS
    for (const topic of topics) {
      const sub = subjectMap.get(topic.subjectId);
      const unit = sub?.units?.find(u => u.id === topic.unitId || u.unit === topic.unitNumber);
      const unitLabel = unit ? formatUnitDisplayName(unit) : (topic.unitLabel || `Unit ${topic.unitNumber || 1}`);

      const text = `${topic.title}`;
      items.push({
        id: `topic-${exam.id}-${topic.id}`,
        type: 'topic',
        group: 'Topics',
        title: topic.title,
        subtitle: `${topic.completed ? 'Completed' : 'Pending'} • Mastery: ${topic.mastery}`,
        examId: exam.id,
        examName: exam.name,
        subjectId: topic.subjectId,
        subjectName: sub?.name || 'Subject',
        subjectAccent: sub?.accentColor,
        unitId: topic.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'Subject'} > ${unitLabel}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: topic
      });
    }

    // 4. NOTES & FILES (PDFs & Subject Files)
    for (const pdf of pdfs) {
      const sub = subjectMap.get(pdf.subjectId);
      const unit = sub?.units?.find(u => u.id === pdf.unitId || u.unit === pdf.unit);
      const unitLabel = unit ? formatUnitDisplayName(unit) : (pdf.unit ? `Unit ${pdf.unit}` : undefined);
      const summaryPts = Array.isArray(pdf.summaryPoints) ? pdf.summaryPoints.join(' ') : '';
      const text = `${pdf.fileName} ${pdf.summary || ''} ${summaryPts} ${pdf.extractedText || ''}`;

      items.push({
        id: `pdf-${exam.id}-${pdf.id}`,
        type: 'file',
        group: 'Notes & Files',
        title: pdf.fileName,
        subtitle: pdf.summary ? `${pdf.summary.slice(0, 120)}...` : `Note document • ${pdf.uploadDate || ''}`,
        examId: exam.id,
        examName: exam.name,
        subjectId: pdf.subjectId,
        subjectName: sub?.name || 'Subject',
        subjectAccent: sub?.accentColor,
        unitId: pdf.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'Subject'}${unitLabel ? ' > ' + unitLabel : ''}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: pdf
      });
    }

    // 5. VIDEOS
    for (const vid of videos) {
      const sub = subjectMap.get(vid.subjectId);
      const unit = sub?.units?.find(u => u.id === vid.unitId || u.unit === vid.unit);
      const unitLabel = unit ? formatUnitDisplayName(unit) : (vid.unit ? `Unit ${vid.unit}` : undefined);
      const text = `${vid.title} ${vid.youtubeUrl || ''} ${vid.notes || ''}`;

      items.push({
        id: `vid-${exam.id}-${vid.id}`,
        type: 'video',
        group: 'Videos',
        title: vid.title,
        subtitle: vid.youtubeUrl ? `${vid.youtubeUrl.slice(0, 60)} • Video lecture` : 'Video lecture',
        examId: exam.id,
        examName: exam.name,
        subjectId: vid.subjectId,
        subjectName: sub?.name || 'Subject',
        subjectAccent: sub?.accentColor,
        unitId: vid.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'Subject'}${unitLabel ? ' > ' + unitLabel : ''}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: vid
      });
    }

    // 6. PYQS / EXAM QUESTIONS
    for (const q of questions) {
      const qText = q.question || (q as any).text || '';
      const sub = subjectMap.get(q.subjectId);
      const unit = sub?.units?.find(u => u.id === q.unitId || u.unit === q.unit);
      const unitLabel = unit ? formatUnitDisplayName(unit) : (q.unitTitle || `Unit ${q.unit}`);
      const text = `${qText} ${q.expectedKeywords?.join(' ') || ''}`;

      items.push({
        id: `pyq-${exam.id}-${q.id}`,
        type: 'pyq',
        group: 'PYQs',
        title: qText,
        subtitle: `${q.marks} Marks • Repeated ${q.repeatCount || 1}x`,
        examId: exam.id,
        examName: exam.name,
        subjectId: q.subjectId,
        subjectName: sub?.name || q.subjectName || 'Subject',
        subjectAccent: sub?.accentColor,
        unitId: q.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'Subject'} > ${unitLabel}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: q
      });
    }

    // 7. FLASHCARDS
    for (const fc of flashcards) {
      const sub = subjectMap.get(fc.subjectId);
      const unit = sub?.units?.find(u => u.id === fc.unitId);
      const unitLabel = unit ? formatUnitDisplayName(unit) : undefined;
      const text = `${fc.front} ${fc.back}`;

      items.push({
        id: `fc-${exam.id}-${fc.id}`,
        type: 'flashcard',
        group: 'Flashcards',
        title: fc.front,
        subtitle: fc.back,
        examId: exam.id,
        examName: exam.name,
        subjectId: fc.subjectId,
        subjectName: sub?.name || 'Subject',
        subjectAccent: sub?.accentColor,
        unitId: fc.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'Subject'}${unitLabel ? ' > ' + unitLabel : ''}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: fc
      });
    }

    // 8. TASKS
    for (const task of tasks) {
      const sub = task.subjectId ? subjectMap.get(task.subjectId) : undefined;
      const unit = sub?.units?.find(u => u.id === task.unitId || u.unit === task.unit);
      const unitLabel = unit ? formatUnitDisplayName(unit) : undefined;
      const text = `${task.text || ''}`;

      items.push({
        id: `task-${exam.id}-${task.id}`,
        type: 'task',
        group: 'Tasks',
        title: task.text,
        subtitle: task.completed ? 'Completed' : 'Pending',
        examId: exam.id,
        examName: exam.name,
        subjectId: task.subjectId || '',
        subjectName: sub?.name || 'General Task',
        subjectAccent: sub?.accentColor,
        unitId: task.unitId || unit?.id,
        unitName: unitLabel,
        breadcrumb: `${exam.name} > ${sub?.name || 'General'}${unitLabel ? ' > ' + unitLabel : ''}`,
        searchableText: text,
        normText: normalizeForSearch(text),
        rawItem: task
      });
    }
  }

  // Also include IndexedDB files if available in currentExamData
  if (currentExamData.files && currentExamData.files.length > 0) {
    for (const f of currentExamData.files) {
      // Check if already indexed via pdfs
      const alreadyIndexed = items.some(i => i.title.toLowerCase() === f.name.toLowerCase());
      if (alreadyIndexed) continue;

      const subName = f.subjectId;
      items.push({
        id: `idb-file-${f.id}`,
        type: 'file',
        group: 'Notes & Files',
        title: f.name,
        subtitle: `${(f.size / 1024).toFixed(0)} KB • ${f.fileType.toUpperCase()}`,
        examId: f.examId || activeExamId,
        examName: 'Notes File',
        subjectId: f.subjectId,
        subjectName: subName,
        unitId: f.unitId,
        breadcrumb: `${subName} > ${f.name}`,
        searchableText: f.name,
        normText: normalizeForSearch(f.name),
        rawItem: f
      });
    }
  }

  return items;
}

/**
 * Executes search with multi-word exact matching and light typo tolerance fallback
 */
export function executeSearch(
  index: SearchIndexItem[],
  query: string
): SearchExecutionResult {
  const normQuery = normalizeForSearch(query);
  if (!normQuery) {
    return {
      groups: [],
      totalResults: 0,
      isTypoMatch: false,
      queryWords: []
    };
  }

  const queryWords = normQuery.split(' ').filter(Boolean);
  if (queryWords.length === 0) {
    return {
      groups: [],
      totalResults: 0,
      isTypoMatch: false,
      queryWords: []
    };
  }

  // STEP 1: Multi-word substring matching anywhere in the text
  // Every word typed must appear somewhere in item.normText in any order
  const getItemNormText = (item: SearchIndexItem): string => {
    return item.normText || normalizeForSearch(`${item.title} ${item.subtitle || ''} ${item.subjectName || ''}`);
  };

  const exactMatches = index.filter(item => {
    const text = getItemNormText(item);
    return queryWords.every(word => text.includes(word));
  });

  let matchedItems = exactMatches;
  let isTypoMatch = false;

  // STEP 2: Light typo tolerance as a last step ONLY when there are no exact matches
  if (matchedItems.length === 0) {
    const typoCandidates = index.filter(item => {
      const text = getItemNormText(item);
      const itemWords = text.split(' ').filter(Boolean);

      return queryWords.every(qWord => {
        // If word is exact substring, pass
        if (text.includes(qWord)) return true;

        // If word has >= 5 characters, allow 1 typo
        if (qWord.length >= 5) {
          return wordMatchesFuzzy(qWord, itemWords);
        }

        // Shorter words require exact match
        return false;
      });
    });

    if (typoCandidates.length > 0) {
      matchedItems = typoCandidates;
      isTypoMatch = true;
    }
  }

  // GROUP RESULTS by: Subjects, Units, Topics, Notes & Files, Videos, PYQs, Flashcards, Tasks
  const GROUP_ORDER: SearchItemGroup[] = [
    'Subjects',
    'Units',
    'Topics',
    'Notes & Files',
    'Videos',
    'PYQs',
    'Flashcards',
    'Tasks'
  ];

  const groupMap = new Map<SearchItemGroup, SearchIndexItem[]>();
  for (const g of GROUP_ORDER) {
    groupMap.set(g, []);
  }

  for (const item of matchedItems) {
    const list = groupMap.get(item.group);
    if (list) {
      list.push(item);
    }
  }

  const groups: SearchResultGroup[] = [];
  for (const g of GROUP_ORDER) {
    const list = groupMap.get(g) || [];
    if (list.length > 0) {
      groups.push({
        group: g,
        items: list,
        totalCount: list.length
      });
    }
  }

  return {
    groups,
    totalResults: matchedItems.length,
    isTypoMatch,
    queryWords
  };
}
