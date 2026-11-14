import { 
  SubjectMeta, 
  SubjectUnit, 
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  ExamUrgency, 
  CountdownTime,
  SyllabusTopic,
  TopicMastery,
  PomodoroSession,
  Flashcard,
  DayStudyPlan,
  PlannerDayTopic,
  FullBackupData,
  ExamSession,
  MasterAppState
} from '../types';
import { INITIAL_QUESTIONS } from '../data/pyqData';

// 10 Balanced Card Accent Theme Colors (Muted, Non-Neon)
export const ACCENT_PALETTE = [
  { name: 'Muted Slate Blue', hex: '#3B6A94' },
  { name: 'Forest Sage', hex: '#3F7D5F' },
  { name: 'Deep Teal', hex: '#2A7B88' },
  { name: 'Warm Ochre', hex: '#B8892F' },
  { name: 'Terracotta', hex: '#B25A4E' },
  { name: 'Steel Blue', hex: '#4B7CB0' },
  { name: 'Muted Pine', hex: '#4F8F6A' },
  { name: 'Burnt Amber', hex: '#A66A2C' },
  { name: 'Soft Charcoal', hex: '#5B6573' },
  { name: 'Muted Bronze', hex: '#8C6D3B' },
];

// Helper to format ISO date string for datetime-local: YYYY-MM-DDTHH:mm
export function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

// Generate realistic default exam dates based on current time
const now = Date.now();
const DEFAULT_OS_EXAM = toDatetimeLocalString(new Date(now + (3 * 24 + 8) * 3600 * 1000));   // ~3.3 days
const DEFAULT_DBMS_EXAM = toDatetimeLocalString(new Date(now + (7 * 24 + 6) * 3600 * 1000)); // ~7.2 days
const DEFAULT_CN_EXAM = toDatetimeLocalString(new Date(now + (11 * 24 + 9) * 3600 * 1000));  // ~11.4 days
const DEFAULT_DSA_EXAM = toDatetimeLocalString(new Date(now + (18 * 24 + 11) * 3600 * 1000)); // ~18.5 days

export const DEFAULT_SUBJECTS: SubjectMeta[] = [
  {
    id: 'os',
    name: 'Operating Systems',
    accentColor: '#3B82F6', // Royal Sapphire
    examDate: DEFAULT_OS_EXAM,
    iconName: 'Cpu',
    units: [
      { id: 'u1', unit: 1, title: 'Process Scheduling & CPU Algorithms', name: 'Process Scheduling & CPU Algorithms' },
      { id: 'u2', unit: 2, title: 'Process Synchronization & Deadlocks', name: 'Process Synchronization & Deadlocks' },
      { id: 'u3', unit: 3, title: 'Memory Management & Paging / TLB', name: 'Memory Management & Paging / TLB' },
      { id: 'u4', unit: 4, title: 'Storage & Disk Scheduling', name: 'Storage & Disk Scheduling' },
      { id: 'u5', unit: 5, title: 'Virtualization & System Security', name: 'Virtualization & System Security' },
    ]
  },
  {
    id: 'dbms',
    name: 'Database Systems',
    accentColor: '#F97316', // Sunset Orange
    examDate: DEFAULT_DBMS_EXAM,
    iconName: 'Database',
    units: [
      { id: 'u1', unit: 1, title: 'Relational Model & ER Architecture', name: 'Relational Model & ER Architecture' },
      { id: 'u2', unit: 2, title: 'SQL & Normalization (1NF to BCNF)', name: 'SQL & Normalization (1NF to BCNF)' },
      { id: 'u3', unit: 3, title: 'Transactions, ACID & Concurrency', name: 'Transactions, ACID & Concurrency' },
      { id: 'u4', unit: 4, title: 'Indexing, B+ Trees & Query Plans', name: 'Indexing, B+ Trees & Query Plans' },
      { id: 'u5', unit: 5, title: 'Distributed DBs & WAL Recovery', name: 'Distributed DBs & WAL Recovery' },
    ]
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    accentColor: '#10B981', // Emerald Mint
    examDate: DEFAULT_CN_EXAM,
    iconName: 'Network',
    units: [
      { id: 'u1', unit: 1, title: 'OSI 7-Layer vs TCP/IP Models', name: 'OSI 7-Layer vs TCP/IP Models' },
      { id: 'u2', unit: 2, title: 'Data Link Layer & Flow Control', name: 'Data Link Layer & Flow Control' },
      { id: 'u3', unit: 3, title: 'Network Layer & Routing Protocols', name: 'Network Layer & Routing Protocols' },
      { id: 'u4', unit: 4, title: 'Transport Layer & TCP Congestion', name: 'Transport Layer & TCP Congestion' },
      { id: 'u5', unit: 5, title: 'Application Layer & DNS Resolution', name: 'Application Layer & DNS Resolution' },
    ]
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    accentColor: '#06B6D4', // Ocean Cyan
    examDate: DEFAULT_DSA_EXAM,
    iconName: 'Code',
    units: [
      { id: 'u1', unit: 1, title: 'Asymptotic Analysis & Master Theorem', name: 'Asymptotic Analysis & Master Theorem' },
      { id: 'u2', unit: 2, title: 'Balanced Search Trees & AVL Rotations', name: 'Balanced Search Trees & AVL Rotations' },
      { id: 'u3', unit: 3, title: 'Priority Queues, Heaps & Hashing', name: 'Priority Queues, Heaps & Hashing' },
      { id: 'u4', unit: 4, title: 'Graph Algorithms & Shortest Paths', name: 'Graph Algorithms & Shortest Paths' },
      { id: 'u5', unit: 5, title: 'Dynamic Programming & 0/1 Knapsack', name: 'Dynamic Programming & 0/1 Knapsack' },
    ]
  }
];

export const DEFAULT_TASKS: StudyTask[] = [
  { id: 't-os-1', subjectId: 'os', unitId: 'u2', unit: 2, text: 'Solve Banker\'s Algorithm 10-Mark safe sequence problem', completed: false, isMission: true, createdAt: Date.now() },
  { id: 't-os-2', subjectId: 'os', unitId: 'u3', unit: 3, text: 'Derive Effective Memory Access Time (EMAT) formula with TLB hit ratio', completed: false, isMission: true, createdAt: Date.now() },
  { id: 't-os-3', subjectId: 'os', unitId: 'u1', unit: 1, text: 'Watch 15-min crash revision video on CPU Scheduling Gantt Charts', completed: true, isMission: false, createdAt: Date.now() },
  
  { id: 't-dbms-1', subjectId: 'dbms', unitId: 'u2', unit: 2, text: 'Practice 1NF -> 2NF -> 3NF -> BCNF decomposition table', completed: false, isMission: true, createdAt: Date.now() },
  { id: 't-dbms-2', subjectId: 'dbms', unitId: 'u3', unit: 3, text: 'Precedence Graph conflict serializability cycle detection test', completed: false, isMission: true, createdAt: Date.now() },

  { id: 't-cn-1', subjectId: 'cn', unitId: 'u4', unit: 4, text: 'Draw TCP Congestion Control cwnd graph (Slow start, AIMD, 3 dup ACKs)', completed: false, isMission: true, createdAt: Date.now() },
  { id: 't-cn-2', subjectId: 'cn', unitId: 'u4', unit: 4, text: 'Memorize TCP 3-Way Handshake vs 4-Way Termination packet ladder', completed: false, isMission: true, createdAt: Date.now() },

  { id: 't-dsa-1', subjectId: 'dsa', unitId: 'u2', unit: 2, text: 'Practice all 4 AVL Tree rotations (LL, RR, LR, RL) on sample key set', completed: false, isMission: true, createdAt: Date.now() },
  { id: 't-dsa-2', subjectId: 'dsa', unitId: 'u5', unit: 5, text: 'Trace 0/1 Knapsack dynamic programming table recurrence relation', completed: false, isMission: true, createdAt: Date.now() },
];

export const DEFAULT_VIDEOS: VideoResource[] = [
  {
    id: 'v-os-1',
    subjectId: 'os',
    unitId: 'u2',
    unit: 2,
    title: "Banker's Algorithm with Safe Sequence Example — Gate Smashers",
    youtubeUrl: 'https://www.youtube.com/watch?v=7gmLZ2vgw5Y',
    videoId: '7gmLZ2vgw5Y',
    notes: 'Key formula: Need = Max - Allocation. If Need <= Work, process finishes and releases Allocated resources back to Work vector.',
    isWatched: false,
    addedAt: Date.now() - 3600000 * 24
  },
  {
    id: 'v-os-2',
    subjectId: 'os',
    unitId: 'u1',
    unit: 1,
    title: 'Preemptive vs Non-Preemptive CPU Scheduling Algorithms — Neso Academy',
    youtubeUrl: 'https://www.youtube.com/watch?v=EWkQD_WWmS4',
    videoId: 'EWkQD_WWmS4',
    notes: 'TAT = Completion Time - Arrival Time. Waiting Time = TAT - Burst Time. Always draw a neat Gantt chart in the first 2 minutes of the exam.',
    isWatched: true,
    addedAt: Date.now() - 3600000 * 48
  },
  {
    id: 'v-dbms-1',
    subjectId: 'dbms',
    unitId: 'u2',
    unit: 2,
    title: 'Normalization (1NF, 2NF, 3NF, BCNF) Made Easy — Gate Smashers',
    youtubeUrl: 'https://www.youtube.com/watch?v=5fs1hdkhms8',
    videoId: '5fs1hdkhms8',
    notes: 'BCNF condition: For every non-trivial FD X -> Y, X MUST be a Superkey. If not, decompose table into (X, Y) and (X, Rest).',
    isWatched: false,
    addedAt: Date.now() - 3600000 * 12
  },
  {
    id: 'v-cn-1',
    subjectId: 'cn',
    unitId: 'u4',
    unit: 4,
    title: 'TCP Congestion Control (Slow Start & AIMD) — Gate Smashers',
    youtubeUrl: 'https://www.youtube.com/watch?v=8y_jC_XvXn4',
    videoId: '8y_jC_XvXn4',
    notes: 'On 3 Duplicate ACKs: Fast Retransmit triggers immediately, ssthresh set to cwnd/2, Fast Recovery skips slow start back to 1 MSS.',
    isWatched: false,
    addedAt: Date.now() - 3600000 * 30
  },
  {
    id: 'v-dsa-1',
    subjectId: 'dsa',
    unitId: 'u2',
    unit: 2,
    title: 'AVL Tree Insertion & 4 Rotations (LL, RR, LR, RL) — Abdul Bari',
    youtubeUrl: 'https://www.youtube.com/watch?v=jDM6_TnYIqE',
    videoId: 'jDM6_TnYIqE',
    notes: 'Balance Factor = Height(L) - Height(R). Must be strictly in {-1, 0, +1}. Single rotation for LL/RR, Double rotation for LR/RL.',
    isWatched: false,
    addedAt: Date.now() - 3600000 * 50
  }
];

export const DEFAULT_PDFS: PdfResource[] = [
  {
    id: 'pdf-os-1',
    subjectId: 'os',
    unitId: 'u2',
    unit: 2,
    fileName: 'OS_Deadlocks_Synchronization_Summary.pdf',
    uploadDate: new Date(Date.now() - 86400000).toLocaleDateString(),
    fileSize: '1.4 MB',
    extractedText: 'Banker algorithm for deadlock avoidance. Safety state algorithm. Semaphores Wait() and Signal() operations. Peterson algorithm for mutual exclusion.',
    summary: 'Comprehensive revision guide covering Coffman 4 conditions, Banker algorithm data structures (Available, Max, Allocation, Need), and Semaphore synchronization primitives.',
    extractedQuestions: [
      "Explain Banker's Algorithm for Deadlock Avoidance with a numerical example.",
      'State the 4 Coffman conditions required for Deadlock to occur.',
      'Differentiate between Counting and Binary Semaphores with code.'
    ]
  },
  {
    id: 'pdf-dbms-1',
    subjectId: 'dbms',
    unitId: 'u2',
    unit: 2,
    fileName: 'DBMS_Normalization_CheatSheet.pdf',
    uploadDate: new Date(Date.now() - 172800000).toLocaleDateString(),
    fileSize: '2.1 MB',
    extractedText: 'Functional dependencies, 1NF atomic attributes, 2NF partial dependencies, 3NF transitive dependencies, BCNF superkey condition. ACID transactions, conflict serializability, 2PL lock point.',
    summary: 'High-yield exam review sheet detailing normalization closure calculations, candidate key identification, and 2-Phase Locking growing vs shrinking phase.',
    extractedQuestions: [
      'Decompose relation R into BCNF and verify if dependency is preserved.',
      'Explain Conflict Serializability with a Precedence Graph.'
    ]
  }
];

export const DEFAULT_TOPICS: SyllabusTopic[] = [
  // OS Topics
  { id: 'top-os-1', subjectId: 'os', unitId: 'u1', unitNumber: 1, title: 'Process Scheduling (FCFS, SJF, Round Robin)', completed: false, mastery: 'strong', pyqCount: 4 },
  { id: 'top-os-2', subjectId: 'os', unitId: 'u1', unitNumber: 1, title: 'Multilevel Queue & Feedback Queue Scheduling', completed: false, mastery: 'okay', pyqCount: 2 },
  { id: 'top-os-3', subjectId: 'os', unitId: 'u1', unitNumber: 1, title: 'Convoy Effect & Context Switching Overhead', completed: false, mastery: 'weak', pyqCount: 3 },
  { id: 'top-os-4', subjectId: 'os', unitId: 'u2', unitNumber: 2, title: "Banker's Algorithm & Deadlock Safe Sequences", completed: false, mastery: 'weak', pyqCount: 5 },
  { id: 'top-os-5', subjectId: 'os', unitId: 'u2', unitNumber: 2, title: 'Semaphores (Wait/Signal) & Race Conditions', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-os-6', subjectId: 'os', unitId: 'u2', unitNumber: 2, title: "Peterson's Algorithm for Mutual Exclusion", completed: false, mastery: 'okay', pyqCount: 2 },
  { id: 'top-os-7', subjectId: 'os', unitId: 'u3', unitNumber: 3, title: 'Paging, Inverted Page Tables & TLB Hit Ratio', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-os-8', subjectId: 'os', unitId: 'u3', unitNumber: 3, title: 'Page Replacement Algorithms (FIFO, LRU, Optimal)', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-os-9', subjectId: 'os', unitId: 'u4', unitNumber: 4, title: 'Disk Scheduling (SSTF, SCAN, C-SCAN)', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-os-10', subjectId: 'os', unitId: 'u5', unitNumber: 5, title: 'Virtualization Hypervisors & Security Rings', completed: false, mastery: 'okay', pyqCount: 1 },

  // DBMS Topics
  { id: 'top-db-1', subjectId: 'dbms', unitId: 'u1', unitNumber: 1, title: 'Relational Model & ER Architecture Mapping', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-db-2', subjectId: 'dbms', unitId: 'u2', unitNumber: 2, title: '1NF, 2NF, 3NF & BCNF Normalization', completed: false, mastery: 'weak', pyqCount: 5 },
  { id: 'top-db-3', subjectId: 'dbms', unitId: 'u2', unitNumber: 2, title: 'Lossless Join & Functional Dependency Closure', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-db-4', subjectId: 'dbms', unitId: 'u3', unitNumber: 3, title: 'ACID Properties & Transaction States', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-db-5', subjectId: 'dbms', unitId: 'u3', unitNumber: 3, title: 'Conflict Serializability & Precedence Graphs', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-db-6', subjectId: 'dbms', unitId: 'u3', unitNumber: 3, title: 'Two-Phase Locking Protocol (Strict vs Rigorous 2PL)', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-db-7', subjectId: 'dbms', unitId: 'u4', unitNumber: 4, title: 'B+ Tree Index Insertion & Deletion Mechanics', completed: false, mastery: 'okay', pyqCount: 3 },
  { id: 'top-db-8', subjectId: 'dbms', unitId: 'u5', unitNumber: 5, title: 'Write-Ahead Logging (WAL) & ARIES Recovery', completed: false, mastery: 'weak', pyqCount: 2 },

  // CN Topics
  { id: 'top-cn-1', subjectId: 'cn', unitId: 'u1', unitNumber: 1, title: 'OSI 7-Layer vs TCP/IP Architecture', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-cn-2', subjectId: 'cn', unitId: 'u2', unitNumber: 2, title: 'Sliding Window (Go-Back-N vs Selective Repeat)', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-cn-3', subjectId: 'cn', unitId: 'u2', unitNumber: 2, title: 'CRC Checksum & Hamming Error Detection Code', completed: false, mastery: 'okay', pyqCount: 3 },
  { id: 'top-cn-4', subjectId: 'cn', unitId: 'u3', unitNumber: 3, title: 'IPv4 Subnetting, VLSM & CIDR Calculations', completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-cn-5', subjectId: 'cn', unitId: 'u3', unitNumber: 3, title: "Dijkstra's Link-State vs Distance Vector Routing", completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-cn-6', subjectId: 'cn', unitId: 'u4', unitNumber: 4, title: 'TCP 3-Way Handshake & Connection Termination', completed: false, mastery: 'strong', pyqCount: 4 },
  { id: 'top-cn-7', subjectId: 'cn', unitId: 'u4', unitNumber: 4, title: 'TCP Congestion Control (Slow Start, AIMD, Fast Recovery)', completed: false, mastery: 'weak', pyqCount: 5 },
  { id: 'top-cn-8', subjectId: 'cn', unitId: 'u5', unitNumber: 5, title: 'DNS Resolution (Iterative vs Recursive) & HTTP/2', completed: false, mastery: 'okay', pyqCount: 2 },

  // DSA Topics
  { id: 'top-dsa-1', subjectId: 'dsa', unitId: 'u1', unitNumber: 1, title: 'Asymptotic Complexities & Master Theorem', completed: false, mastery: 'strong', pyqCount: 3 },
  { id: 'top-dsa-2', subjectId: 'dsa', unitId: 'u2', unitNumber: 2, title: 'AVL Tree 4 Rotations (LL, RR, LR, RL)', completed: false, mastery: 'weak', pyqCount: 5 },
  { id: 'top-dsa-3', subjectId: 'dsa', unitId: 'u3', unitNumber: 3, title: 'Binary Heaps, Priority Queues & HeapSort', completed: false, mastery: 'okay', pyqCount: 3 },
  { id: 'top-dsa-4', subjectId: 'dsa', unitId: 'u4', unitNumber: 4, title: "Dijkstra's Shortest Path & Prim's MST Algorithm", completed: false, mastery: 'weak', pyqCount: 4 },
  { id: 'top-dsa-5', subjectId: 'dsa', unitId: 'u5', unitNumber: 5, title: '0/1 Knapsack & Longest Common Subsequence (DP)', completed: false, mastery: 'weak', pyqCount: 4 }
];

export const DEFAULT_FLASHCARDS: Flashcard[] = [];

// Helper: Extract YouTube ID from various URL formats
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

export function formatUnitDisplayName(unit?: any): string {
  if (!unit) return 'Unit';
  if (typeof unit === 'string') {
    const trimmed = unit.trim();
    const match = trimmed.match(/^(?:((?:unit|module|chapter|part|section)\s*[\d\w]+)[:\s\-\–]+|([a-z0-9\s]{2,15})[:\-\–]+)(.*)$/i);
    if (match) {
      const lbl = (match[1] || match[2]).trim();
      const ttl = (match[3] || '').trim();
      return `${lbl}: ${ttl}`;
    }
    return trimmed || 'Unit';
  }

  // 1. Determine saved unit label
  let label = (unit.unitLabel || '').trim();
  if (!label && unit.unitNumber !== undefined && unit.unitNumber !== null) {
    const rawNum = String(unit.unitNumber).trim();
    if (rawNum.toLowerCase().startsWith('unit') || rawNum.toLowerCase().startsWith('module') || rawNum.toLowerCase().startsWith('chapter') || rawNum.toLowerCase().startsWith('section')) {
      label = rawNum;
    } else if (/^\d+$/.test(rawNum)) {
      label = `Unit ${rawNum}`;
    } else if (rawNum.length > 0 && rawNum.length <= 15) {
      label = rawNum;
    }
  }

  // 2. Determine title
  let title = (unit.unitTitle || unit.title || unit.name || '').trim();

  // If label is still empty, check if title starts with "Unit X:" or similar
  if (!label && title) {
    const match = title.match(/^(?:((?:unit|module|chapter|part|section)\s*[\d\w]+)[:\s\-\–]+|([a-z0-9\s]{2,15})[:\-\–]+)(.*)$/i);
    if (match) {
      label = (match[1] || match[2]).trim();
      title = (match[3] || '').trim();
    }
  }

  // If label is STILL not found, check unit.unit (saved unit number, NOT position)
  if (!label && unit.unit !== undefined && unit.unit !== null && unit.unit !== '') {
    const uNum = String(unit.unit).trim();
    if (uNum.toLowerCase().startsWith('unit')) {
      label = uNum;
    } else {
      label = `Unit ${uNum}`;
    }
  }

  // Clean title: strip duplicate label or "Unit \d+:" from start of title
  if (label && title) {
    const escapedLabel = label.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const prefixRegex = new RegExp('^(' + escapedLabel + '|unit\\s*\\d+)[:\\s\\-\\–]*', 'i');
    title = title.replace(prefixRegex, '').trim();
  }

  // Return "<saved unit label>: <saved unit title>"
  if (label && title) {
    return `${label}: ${title}`;
  }
  if (label) {
    return label;
  }
  if (title) {
    return title;
  }
  return 'Unit';
}

/**
 * Returns the exact saved unit label (e.g. "Unit 3", "Unit 4", "Module 1", "Chapter 2")
 * NEVER auto-renumbers units based on array index!
 */
export function getUnitDisplayLabel(unit?: any): string {
  if (!unit) return 'Unit';
  if (typeof unit === 'string') {
    const trimmed = unit.trim();
    const match = trimmed.match(/^(?:((?:unit|module|chapter|part|section)\s*[\d\w]+)|([uU]\d+))/i);
    if (match) return match[1] || match[2];
    return trimmed;
  }
  if (unit.unitLabel && String(unit.unitLabel).trim()) {
    return String(unit.unitLabel).trim();
  }
  if (unit.unitNumber !== undefined && unit.unitNumber !== null && String(unit.unitNumber).trim()) {
    const raw = String(unit.unitNumber).trim();
    if (/^(unit|module|chapter|section|part|ch|u)\b/i.test(raw)) return raw;
    if (/^\d+$/.test(raw)) return `Unit ${raw}`;
    return raw;
  }
  if (unit.unit !== undefined && unit.unit !== null && String(unit.unit).trim()) {
    const raw = String(unit.unit).trim();
    if (/^(unit|module|chapter|section|part|ch|u)\b/i.test(raw)) return raw;
    if (/^\d+$/.test(raw)) return `Unit ${raw}`;
    return raw;
  }
  const title = (unit.unitTitle || unit.title || unit.name || '').trim();
  const match = title.match(/^(?:((?:unit|module|chapter|part|section)\s*[\d\w]+)|([uU]\d+))/i);
  if (match) {
    return match[1] || match[2];
  }
  return title || 'Unit';
}

/**
 * Returns a compact badge label for tabs and tight UI (e.g. "Ch 1", "Ch 2", "Ch 3")
 * Parses explicit unit number or label.
 */
export function getUnitShortBadge(unit?: any): string {
  const num = parseUnitNumber(unit);
  if (num !== Infinity) {
    return `Ch ${num}`;
  }
  const fullLabel = getUnitDisplayLabel(unit);
  const numMatch = fullLabel.match(/\d+/);
  if (numMatch) {
    return `Ch ${numMatch[0]}`;
  }
  return fullLabel.slice(0, 5);
}

/**
 * Safely parses the numerical value of a unit from its unit, unitNumber, unitLabel, or title.
 * e.g., "Unit 3" -> 3, "Ch 2" -> 2, "3" -> 3, "Chapter 4: Design" -> 4.
 */
export function parseUnitNumber(unit: any): number {
  if (unit === null || unit === undefined) return Infinity;
  if (typeof unit === 'number' && !isNaN(unit)) return unit;

  if (typeof unit === 'object') {
    if (typeof unit.unit === 'number' && !isNaN(unit.unit)) return unit.unit;
    if (typeof unit.unitNumber === 'number' && !isNaN(unit.unitNumber)) return unit.unitNumber;

    const candidates = [
      unit.unitLabel,
      unit.unitNumber,
      unit.title,
      unit.name,
      unit.unitTitle
    ];

    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) {
        const match = c.match(/(?:unit|ch|chapter|module|section|part)?\s*(\d+)/i);
        if (match && match[1]) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
    return Infinity;
  }

  if (typeof unit === 'string') {
    const match = unit.match(/(?:unit|ch|chapter|module|section|part)?\s*(\d+)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) return parsed;
    }
  }

  return Infinity;
}

/**
 * Always sorts units in strict ascending numerical order (Unit 1 -> Unit 2 -> Unit 3 -> Unit 4).
 * Unnumbered units fall back to title comparison.
 */
export function sortUnitsByNumber<T extends SubjectUnit | any>(units: T[]): T[] {
  if (!units || !Array.isArray(units)) return [];
  return [...units].sort((a, b) => {
    const numA = parseUnitNumber(a);
    const numB = parseUnitNumber(b);
    if (numA !== numB) {
      return numA - numB;
    }
    const titleA = String((a as any)?.title || (a as any)?.name || '');
    const titleB = String((b as any)?.title || (b as any)?.name || '');
    return titleA.localeCompare(titleB);
  });
}

/**
 * Returns the lowest missing positive integer (1, 2, 3, 4...) from the given units.
 * For example:
 * - If units are [3, 4], returns 1 (or 2 if 1 is present).
 * - If units are [1, 3, 4], returns 2.
 * - If units are [1, 2, 3, 4], returns 5.
 */
export function getNextMissingUnitNumber(units: SubjectUnit[]): number {
  if (!units || !Array.isArray(units) || units.length === 0) return 1;
  const existing = new Set<number>();
  for (const u of units) {
    const num = parseUnitNumber(u);
    if (num > 0 && num < 10000 && Number.isInteger(num)) {
      existing.add(num);
    }
  }
  let candidate = 1;
  while (existing.has(candidate)) {
    candidate++;
  }
  return candidate;
}

/**
 * Robust Unit Normalizer:
 * Safely recovers units whether saved as an array of objects, array of strings,
 * comma-separated string, or newline-separated text.
 */
export function normalizeSubjectUnits(subject: any): SubjectUnit[] {
  if (!subject) return [];

  const raw = subject.units ?? subject.syllabus ?? subject.topics;

  if (Array.isArray(raw) && raw.length > 0) {
    const mapped = raw.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        const title = item.trim();
        const match = title.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
        const label = match ? match[1].trim() : undefined;
        const cleanT = match ? match[2].trim() : title;
        const numMatch = label?.match(/\d+/);
        const num = numMatch ? Number(numMatch[0]) : (idx + 1);
        return {
          id: `unit-${idx + 1}-${title.replace(/\s+/g, '-').slice(0, 10)}`,
          unitLabel: label,
          unit: num,
          unitNumber: label || cleanT,
          title: cleanT,
          name: cleanT
        };
      }
      if (typeof item === 'object' && item !== null) {
        let label = (item.unitLabel || '').trim();
        let title = (item.title || item.name || '').trim();

        if (!label) {
          const match = title.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
          if (match) {
            label = match[1].trim();
            title = match[2].trim();
          } else if (item.unitNumber && String(item.unitNumber).toLowerCase().startsWith('unit')) {
            label = String(item.unitNumber).trim();
          } else if (item.unit !== undefined && item.unit !== null) {
            label = `Unit ${item.unit}`;
          }
        } else {
          const prefixRegex = new RegExp('^(' + label.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '|unit\\s*\\d+)[:\\s\\-\\–]*', 'i');
          title = title.replace(prefixRegex, '').trim();
        }

        const numMatch = label.match(/\d+/);
        const derivedNum = item.unit !== undefined ? Number(item.unit) : (numMatch ? Number(numMatch[0]) : (idx + 1));

        return {
          id: String(item.id || `unit-${idx + 1}-${Date.now()}`),
          unitLabel: label || undefined,
          unit: derivedNum,
          unitNumber: label || item.unitNumber || title,
          title: title || label || 'Unit',
          name: title || label || 'Unit'
        };
      }
      return {
        id: `u-${idx + 1}`,
        unitLabel: undefined,
        unit: idx + 1,
        unitNumber: 'Unit',
        title: 'Unit',
        name: 'Unit'
      };
    });
    return sortUnitsByNumber(mapped);
  }

  if (typeof raw === 'string' && raw.trim().length > 0) {
    const lines = raw.split(/\r?\n|,/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const mapped = lines.map((line, idx) => {
        const match = line.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
        const label = match ? match[1].trim() : undefined;
        const cleanTitle = match ? match[2].trim() : line.replace(/^Unit\s*\d+[:\-.]\s*/i, '').trim() || line.trim();
        const numMatch = label?.match(/\d+/);
        const num = numMatch ? Number(numMatch[0]) : (idx + 1);
        return {
          id: `u${idx + 1}`,
          unitLabel: label,
          unit: num,
          unitNumber: label || cleanTitle,
          title: cleanTitle || 'Unit',
          name: cleanTitle || 'Unit'
        };
      });
      return sortUnitsByNumber(mapped);
    }
  }

  // Fallback if no units were entered: provide a default Unit 1
  return [
    {
      id: 'u1',
      unit: 1,
      title: 'Core Concepts & Fundamentals',
      name: 'Core Concepts & Fundamentals'
    }
  ];
}

/**
 * Requirement 2 & 3: Auto-Sort Subjects by Exam Time Remaining (Closest Exam First)
 * Priority order only compares subjects that have a date.
 * Subjects without a date are placed after subjects with dates.
 */
export function sortSubjectsByExamUrgency(subjects: SubjectMeta[]): SubjectMeta[] {
  const now = Date.now();
  return [...subjects].sort((a, b) => {
    const hasA = !!(a.examDate && a.examDate.trim() && !isNaN(new Date(a.examDate).getTime()));
    const hasB = !!(b.examDate && b.examDate.trim() && !isNaN(new Date(b.examDate).getTime()));

    // Both have dates: compare upcoming dates first, then past
    if (hasA && hasB) {
      const targetA = new Date(a.examDate!).getTime();
      const targetB = new Date(b.examDate!).getTime();
      const diffA = targetA - now;
      const diffB = targetB - now;

      // Both in future: closest first
      if (diffA > 0 && diffB > 0) {
        return diffA - diffB;
      }
      // A in future, B in past: A comes first
      if (diffA > 0 && diffB <= 0) {
        return -1;
      }
      // B in future, A in past: B comes first
      if (diffA <= 0 && diffB > 0) {
        return 1;
      }
      // Both in past: most recently passed first
      return targetB - targetA;
    }

    // A has date, B does not: A comes first
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;

    // Neither has date: keep original order
    return 0;
  });
}

/**
 * Exam Urgency Calculation with Continuous HSL Color Shift
 * If no date is set, returns hasDate: false and formattedCountdown: 'Set exam date'
 */
export function getExamUrgencyColor(examDateString?: string | null): ExamUrgency {
  if (!examDateString || !examDateString.trim()) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      fractionalDays: Infinity,
      hasDate: false,
      hue: 200,
      hslColor: '#5B6573', // secondary text neutral
      isUrgent: false,
      statusLabel: 'Set exam date',
      formattedCountdown: 'Set exam date',
      formattedExamDate: 'No Exam Date Set'
    };
  }

  const target = new Date(examDateString).getTime();
  if (isNaN(target)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      fractionalDays: Infinity,
      hasDate: false,
      hue: 200,
      hslColor: '#5B6573',
      isUrgent: false,
      statusLabel: 'Set exam date',
      formattedCountdown: 'Set exam date',
      formattedExamDate: 'No Exam Date Set'
    };
  }

  const diffMs = target - Date.now();
  const targetObj = new Date(target);
  const formattedExamDate = targetObj.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) + ' • ' + targetObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      fractionalDays: 0,
      hasDate: true,
      hue: 0,
      hslColor: '#B25A4E', // Muted Terracotta (Weak/Urgent)
      isUrgent: true,
      statusLabel: 'Exam passed',
      formattedCountdown: '0d : 0h : 0m : 0s',
      formattedExamDate
    };
  }

  const fractionalDays = diffMs / (1000 * 60 * 60 * 24);
  const days = Math.floor(fractionalDays);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  let hue = 145;
  let statusLabel = 'On Track';
  let isUrgent = false;

  if (fractionalDays >= 15) {
    hue = 145;
    statusLabel = 'On Track';
  } else if (fractionalDays > 5) {
    const t = (fractionalDays - 5) / (15 - 5);
    hue = Math.round(20 + t * (145 - 20));
    statusLabel = fractionalDays > 9 ? 'Active Prep' : 'Approaching';
  } else {
    const t = Math.max(0, fractionalDays) / 5;
    hue = Math.round(t * 20);
    statusLabel = 'Urgent (< 5d)';
    isUrgent = true;
  }

  const hslColor = fractionalDays >= 15 ? '#4F8F6A' : fractionalDays > 5 ? '#B8892F' : '#B25A4E';
  const formattedCountdown = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    fractionalDays,
    hasDate: true,
    hue,
    hslColor,
    isUrgent,
    statusLabel,
    formattedCountdown,
    formattedExamDate
  };
}

export function calculateCountdown(examDateString: string): CountdownTime {
  const urgency = getExamUrgencyColor(examDateString);
  let urgencyLevel: 'critical' | 'high' | 'normal' = 'normal';
  if (urgency.fractionalDays <= 3) urgencyLevel = 'critical';
  else if (urgency.fractionalDays <= 7) urgencyLevel = 'high';
  return {
    days: urgency.days,
    hours: urgency.hours,
    minutes: urgency.minutes,
    seconds: urgency.seconds,
    totalSeconds: Number.isFinite(urgency.fractionalDays) ? Math.floor(urgency.fractionalDays * 86400) : 0,
    label: urgency.formattedCountdown,
    urgency: urgencyLevel
  };
}

/**
 * Calculates a live readiness percentage (0-100%) for a unit based on
 * completed tasks, watched videos, mastered PYQs, and completed syllabus topics.
 */
export function calculateUnitReadiness(
  unit: SubjectUnit,
  tasks: StudyTask[] = [],
  videos: VideoResource[] = [],
  questions: PYQQuestion[] = [],
  topics: SyllabusTopic[] = []
): {
  percentage: number;
  totalItems: number;
  completedItems: number;
  tasksCount: number;
  tasksCompleted: number;
  videosCount: number;
  videosWatched: number;
  questionsCount: number;
  questionsMastered: number;
  topicsCount: number;
  topicsCompleted: number;
} {
  const uTasks = tasks.filter(t => t.unitId === unit.id || (unit.unit !== undefined && t.unit === unit.unit));
  const uVideos = videos.filter(v => v.unitId === unit.id || (unit.unit !== undefined && v.unit === unit.unit));
  const uQuestions = questions.filter(q => q.unitId === unit.id || (unit.unit !== undefined && q.unit === unit.unit));
  const uTopics = topics.filter(tp => tp.unitId === unit.id);

  const tasksCount = uTasks.length;
  const tasksCompleted = uTasks.filter(t => t.completed).length;

  const videosCount = uVideos.length;
  const videosWatched = uVideos.filter(v => v.isWatched).length;

  const questionsCount = uQuestions.length;
  const questionsMastered = uQuestions.filter(q => q.userStatus === 'mastered').length;

  const topicsCount = uTopics.length;
  const topicsCompleted = uTopics.filter(tp => tp.completed).length;

  const totalItems = tasksCount + videosCount + questionsCount + topicsCount;
  const completedItems = tasksCompleted + videosWatched + questionsMastered + topicsCompleted;

  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    percentage,
    totalItems,
    completedItems,
    tasksCount,
    tasksCompleted,
    videosCount,
    videosWatched,
    questionsCount,
    questionsMastered,
    topicsCount,
    topicsCompleted
  };
}

/**
 * Returns total studied minutes for a subject across all recorded Pomodoro sessions.
 */
export function getSubjectTotalStudiedMinutes(subjectId: string, pomodoroLogs: PomodoroSession[] = []): number {
  return pomodoroLogs
    .filter(log => log.subjectId === subjectId)
    .reduce((sum, log) => sum + (Number(log.minutes) || 0), 0);
}

/**
 * Formats minutes into human-readable e.g. "45m", "1h 30m"
 */
export function formatStudiedTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}


// EXACT STORAGE KEYS (PRESERVED FOR ZERO DATA LOSS)
const STORAGE_KEYS = {
  EXAM_SESSIONS: 'exam_hub_v3_exam_sessions',
  ACTIVE_EXAM: 'exam_hub_v3_active_exam',
  SUBJECTS: 'exam_hub_v3_subjects',
  QUESTIONS: 'exam_hub_v3_questions',
  TASKS: 'exam_hub_v3_tasks',
  VIDEOS: 'exam_hub_v3_videos',
  PDFS: 'exam_hub_v3_pdfs',
  TOPICS: 'exam_hub_v3_topics',
  POMODORO_LOGS: 'exam_hub_v3_pomodoro_logs',
  FLASHCARDS: 'exam_hub_v3_flashcards',
  ACTIVE_SUBJECT: 'exam_hub_v3_active_subject',
  THEME: 'exam_hub_v3_theme',
  VIDEO_PLAYBACK_POSITIONS: 'pyq_video_playback_positions',
  VAULT_ACTIVE_VIDEO: 'pyq_vault_active_video_id',
};

export const DEFAULT_EXAM_SESSIONS: ExamSession[] = [
  { id: 'mid-sem', name: 'Mid Sem', isDefault: true, createdAt: 1 },
  { id: 'end-sem', name: 'End Sem', isDefault: false, createdAt: 2 },
  { id: 'internals', name: 'Internals', isDefault: false, createdAt: 3 },
  { id: 'other-exam', name: 'Other Exam', isDefault: false, createdAt: 4 }
];

function getExamStorageKey(baseKey: string, examId?: string): string {
  const active = examId || storageService.getActiveExam();
  if (active === 'mid-sem') {
    return baseKey; // 100% Zero-data-loss guarantee for existing data!
  }
  return `${baseKey}_${active}`;
}

// FALLBACK KEYS FROM PREVIOUS VERSIONS (ONLY CHECKED IF CURRENT KEY IS COMPLETELY EMPTY)
const FALLBACK_KEYS = {
  SUBJECTS: ['pyq_hud_subjects_v2', 'pyq_subjects', 'exam_hub_subjects'],
  QUESTIONS: ['pyq_hud_questions_v2', 'pyq_questions'],
  TASKS: ['pyq_hud_tasks_v2', 'pyq_tasks'],
  VIDEOS: ['pyq_hud_videos_v2'],
  PDFS: ['pyq_hud_pdfs_v2'],
  FLASHCARDS: ['pyq_flashcards', 'exam_hub_flashcards', 'studyos_flashcards'],
  POMODORO_LOGS: ['pyq_pomodoro_logs', 'exam_hub_pomodoro_logs']
};

/**
 * Storage Service with Non-Destructive Schema Upgrading
 * Guarantees zero data loss for existing user-entered subjects and resources.
 */
export const storageService = {
  // EXAM SESSIONS
  getExamSessions(): ExamSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(DEFAULT_EXAM_SESSIONS));
    return DEFAULT_EXAM_SESSIONS;
  },

  saveExamSessions(sessions: ExamSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
    } catch (e) {}
  },

  getActiveExam(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM) || 'mid-sem';
  },

  setActiveExam(examId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM, examId);
  },

  addExamSession(name: string): ExamSession {
    const sessions = this.getExamSessions();
    const id = `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const newSession: ExamSession = {
      id,
      name: name.trim(),
      isDefault: false,
      createdAt: Date.now()
    };
    const updated = [...sessions, newSession];
    this.saveExamSessions(updated);
    this.setActiveExam(id);
    return newSession;
  },

  renameExamSession(id: string, newName: string): ExamSession[] {
    const sessions = this.getExamSessions();
    const updated = sessions.map(s => s.id === id ? { ...s, name: newName.trim() } : s);
    this.saveExamSessions(updated);
    return updated;
  },

  updateExamSession(id: string, updates: Partial<ExamSession>): ExamSession[] {
    const sessions = this.getExamSessions();
    const updated = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveExamSessions(updated);
    return updated;
  },

  deleteExamSession(id: string): ExamSession[] {
    const sessions = this.getExamSessions();
    if (sessions.length <= 1) return sessions;
    const updated = sessions.filter(s => s.id !== id);
    this.saveExamSessions(updated);
    if (this.getActiveExam() === id) {
      this.setActiveExam(updated[0].id);
    }
    return updated;
  },

  getSubjectSortMode(): 'date' | 'custom' {
    try {
      return (localStorage.getItem('pyq_subject_sort_mode') as 'date' | 'custom') || 'date';
    } catch {
      return 'date';
    }
  },

  setSubjectSortMode(mode: 'date' | 'custom'): void {
    try {
      localStorage.setItem('pyq_subject_sort_mode', mode);
    } catch (e) {
      console.error('Error saving subject sort mode:', e);
    }
  },

  // SUBJECTS
  getSubjects(examId?: string): SubjectMeta[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.SUBJECTS, activeExam);
    try {
      // 1. First check the primary storage key for this exam
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const upgraded = parsed.map((s: any) => ({
            ...s,
            accentColor: s.accentColor || ACCENT_PALETTE[0].hex,
            units: normalizeSubjectUnits(s)
          }));
          return upgraded;
        }
      }

      // 2. If mid-sem and empty, inspect fallback keys to rescue previously entered data
      if (activeExam === 'mid-sem') {
        for (const fallbackKey of FALLBACK_KEYS.SUBJECTS) {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const upgraded = parsed.map((s: any) => ({
                ...s,
                accentColor: s.accentColor || ACCENT_PALETTE[0].hex,
                units: normalizeSubjectUnits(s)
              }));
              this.saveSubjects(upgraded, 'mid-sem');
              return upgraded;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading subjects:', e);
    }

    return [];
  },

  saveSubjects(subjects: SubjectMeta[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.SUBJECTS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(subjects));
      this.broadcastToExtension();
    } catch (e) {
      console.error('Error saving subjects:', e);
    }
  },

  reorderSubjects(subjects: SubjectMeta[], examId?: string): SubjectMeta[] {
    this.saveSubjects(subjects, examId);
    return subjects;
  },

  addSubject(subject: SubjectMeta, examId?: string): SubjectMeta[] {
    const list = this.getSubjects(examId);
    const normalized: SubjectMeta = {
      ...subject,
      units: normalizeSubjectUnits(subject)
    };
    const updated = [...list, normalized];
    this.saveSubjects(updated, examId);
    return updated;
  },

  updateSubject(subject: SubjectMeta, examId?: string): SubjectMeta[] {
    const list = this.getSubjects(examId);
    const normalized: SubjectMeta = {
      ...subject,
      units: normalizeSubjectUnits(subject)
    };
    const updated = list.map(s => s.id === subject.id ? normalized : s);
    this.saveSubjects(updated, examId);
    return updated;
  },

  // UNITS: ADD, RENAME, DELETE, REORDER WITH AUTOMATIC NUMERICAL SEQUENCE SORTING (1, 2, 3, 4)
  addUnit(subjectId: string, unitLabelOrNumber: string | number, unitTitle?: string, examId?: string): SubjectMeta[] {
    const subjects = this.getSubjects(examId);
    const target = subjects.find(s => s.id === subjectId);
    if (!target) return subjects;

    let rawLabel = (unitTitle !== undefined ? String(unitLabelOrNumber) : '').trim();
    let title = (unitTitle !== undefined ? unitTitle : String(unitLabelOrNumber)).trim();

    if (!rawLabel) {
      const match = title.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
      if (match) {
        rawLabel = match[1].trim();
        title = match[2].trim();
      }
    }

    // Determine numerical sequence
    const parsedNum = parseUnitNumber(rawLabel || title);
    const finalNum = parsedNum !== Infinity ? parsedNum : getNextMissingUnitNumber(target.units || []);
    const finalLabel = rawLabel ? (/^(unit|chapter|ch|module)\b/i.test(rawLabel) ? rawLabel : `Unit ${rawLabel}`) : `Unit ${finalNum}`;

    const newUnit: SubjectUnit = {
      id: `unit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      unitLabel: finalLabel,
      unit: finalNum,
      unitNumber: finalNum,
      title: title || `Chapter ${finalNum}`,
      name: title || `Chapter ${finalNum}`
    };

    target.units = sortUnitsByNumber([...(target.units || []), newUnit]);
    this.saveSubjects(subjects, examId);
    return subjects;
  },

  renameUnit(subjectId: string, unitId: string, newLabelOrNumber: string | number, newTitle?: string, examId?: string): SubjectMeta[] {
    const subjects = this.getSubjects(examId);
    const target = subjects.find(s => s.id === subjectId);
    if (!target || !target.units) return subjects;

    let rawLabel = (newTitle !== undefined ? String(newLabelOrNumber) : '').trim();
    let title = (newTitle !== undefined ? newTitle : String(newLabelOrNumber)).trim();

    if (!rawLabel) {
      const match = title.match(/^(unit\s*[\d\w]+)[:\s\-\–]+(.*)$/i);
      if (match) {
        rawLabel = match[1].trim();
        title = match[2].trim();
      }
    }

    target.units = sortUnitsByNumber(target.units.map(u => {
      if (u.id === unitId) {
        const parsedNum = parseUnitNumber(rawLabel || title);
        const finalNum = parsedNum !== Infinity ? parsedNum : (u.unit ?? 1);
        const finalLabel = rawLabel ? (/^(unit|chapter|ch|module)\b/i.test(rawLabel) ? rawLabel : `Unit ${rawLabel}`) : (u.unitLabel || `Unit ${finalNum}`);
        return {
          ...u,
          unitLabel: finalLabel,
          unit: finalNum,
          unitNumber: finalNum,
          title: title || u.title,
          name: title || u.name
        };
      }
      return u;
    }));

    this.saveSubjects(subjects, examId);
    return subjects;
  },

  deleteUnit(subjectId: string, unitId: string, examId?: string): SubjectMeta[] {
    const subjects = this.getSubjects(examId);
    const target = subjects.find(s => s.id === subjectId);
    if (!target || !target.units) return subjects;
    target.units = target.units.filter(u => u.id !== unitId);
    this.saveSubjects(subjects, examId);
    // Also remove topics belonging to this unit
    const topics = this.getTopics(examId).filter(t => t.unitId !== unitId);
    this.saveTopics(topics, examId);
    return subjects;
  },

  reorderUnit(subjectId: string, unitId: string, direction: 'up' | 'down', examId?: string): SubjectMeta[] {
    const subjects = this.getSubjects(examId);
    const target = subjects.find(s => s.id === subjectId);
    if (!target || !target.units) return subjects;
    const index = target.units.findIndex(u => u.id === unitId);
    if (index === -1) return subjects;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= target.units.length) return subjects;
    const reordered = [...target.units];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    target.units = reordered;
    this.saveSubjects(subjects, examId);
    return subjects;
  },

  updateSubjectUnits(subjectId: string, units: SubjectUnit[], examId?: string): SubjectMeta[] {
    const list = this.getSubjects(examId);
    const updated = list.map(s => {
      if (s.id === subjectId) {
        return { ...s, units };
      }
      return s;
    });
    this.saveSubjects(updated, examId);
    return updated;
  },

  deleteSubject(subjectId: string): SubjectMeta[] {
    const list = this.getSubjects();
    const updated = list.filter(s => s.id !== subjectId);
    this.saveSubjects(updated);

    // Cascade cleanup
    this.saveQuestions(this.getQuestions().filter(q => q.subjectId !== subjectId));
    this.saveTasks(this.getTasks().filter(t => t.subjectId !== subjectId));
    this.saveVideos(this.getVideos().filter(v => v.subjectId !== subjectId));
    this.savePdfs(this.getPdfs().filter(p => p.subjectId !== subjectId));
    this.saveTopics(this.getTopics().filter(t => t.subjectId !== subjectId));
    this.saveFlashcards(this.getFlashcards().filter(f => f.subjectId !== subjectId));
    
    return updated;
  },

  // QUESTIONS
  getQuestions(examId?: string): PYQQuestion[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.QUESTIONS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((q: any) => ({
            ...q,
            unitId: q.unitId || (q.unit ? `u${q.unit}` : undefined)
          }));
        }
      }

      if (activeExam === 'mid-sem') {
        for (const fallbackKey of FALLBACK_KEYS.QUESTIONS) {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.saveQuestions(parsed, 'mid-sem');
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading questions:', e);
    }
    return [];
  },

  saveQuestions(questions: PYQQuestion[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.QUESTIONS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(questions));
      this.broadcastToExtension();
    } catch (e) {
      console.error('Error saving questions:', e);
    }
  },

  addQuestion(question: PYQQuestion, examId?: string): PYQQuestion[] {
    const list = this.getQuestions(examId);
    const updated = [question, ...list];
    this.saveQuestions(updated, examId);
    return updated;
  },

  toggleQuestionMastered(questionId: string): PYQQuestion[] {
    const list = this.getQuestions();
    const updated = list.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          userStatus: (q.userStatus === 'mastered' ? 'not-started' : 'mastered') as 'not-started' | 'mastered'
        };
      }
      return q;
    });
    this.saveQuestions(updated);
    return updated;
  },

  deleteQuestion(questionId: string, examId?: string): PYQQuestion[] {
    const list = this.getQuestions(examId);
    const updated = list.filter(q => q.id !== questionId);
    this.saveQuestions(updated, examId);
    return updated;
  },

  // TASKS
  getTasks(examId?: string): StudyTask[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.TASKS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({
            ...t,
            unitId: t.unitId || (t.unit ? `u${t.unit}` : undefined)
          }));
        }
      }

      if (activeExam === 'mid-sem') {
        for (const fallbackKey of FALLBACK_KEYS.TASKS) {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.saveTasks(parsed, 'mid-sem');
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading tasks:', e);
    }
    return [];
  },

  saveTasks(tasks: StudyTask[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.TASKS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  },

  addTask(task: StudyTask, examId?: string): StudyTask[] {
    const list = this.getTasks(examId);
    const updated = [task, ...list];
    this.saveTasks(updated, examId);
    return updated;
  },

  toggleTask(taskId: string, examId?: string): StudyTask[] {
    const list = this.getTasks(examId);
    const updated = list.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    this.saveTasks(updated, examId);
    return updated;
  },

  deleteTask(taskId: string, examId?: string): StudyTask[] {
    const list = this.getTasks(examId);
    const updated = list.filter(t => t.id !== taskId);
    this.saveTasks(updated, examId);
    return updated;
  },

  // VIDEOS
  getVideos(examId?: string): VideoResource[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.VIDEOS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((v: any) => ({
            ...v,
            unitId: v.unitId || (v.unit ? `u${v.unit}` : undefined)
          }));
        }
      }

      if (activeExam === 'mid-sem') {
        for (const fallbackKey of FALLBACK_KEYS.VIDEOS) {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.saveVideos(parsed, 'mid-sem');
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading videos:', e);
    }
    return [];
  },

  saveVideos(videos: VideoResource[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.VIDEOS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(videos));
    } catch (e) {
      console.error('Error saving videos:', e);
    }
  },

  addVideo(video: VideoResource, examId?: string): VideoResource[] {
    const list = this.getVideos(examId);
    const updated = [video, ...list];
    this.saveVideos(updated, examId);
    return updated;
  },

  updateVideoNotes(videoId: string, notes: string, examId?: string): VideoResource[] {
    const list = this.getVideos(examId);
    const updated = list.map(v => v.id === videoId ? { ...v, notes } : v);
    this.saveVideos(updated, examId);
    return updated;
  },

  toggleVideoWatched(videoId: string, examId?: string): VideoResource[] {
    const list = this.getVideos(examId);
    const updated = list.map(v => v.id === videoId ? { ...v, isWatched: !v.isWatched } : v);
    this.saveVideos(updated, examId);
    return updated;
  },

  deleteVideo(videoId: string, examId?: string): VideoResource[] {
    const list = this.getVideos(examId);
    const updated = list.filter(v => v.id !== videoId);
    this.saveVideos(updated, examId);
    return updated;
  },

  // ==========================================
  // VIDEO PLAYBACK POSITIONS & VAULT ACTIVE STATE
  // ==========================================
  getVideoPlaybackPositions(): Record<string, number> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VIDEO_PLAYBACK_POSITIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading video playback positions:', e);
    }
    return {};
  },

  saveVideoPlaybackPosition(videoId: string, seconds: number): void {
    try {
      if (!videoId) return;
      const current = this.getVideoPlaybackPositions();
      current[videoId] = Math.max(0, Math.floor(seconds));
      localStorage.setItem(STORAGE_KEYS.VIDEO_PLAYBACK_POSITIONS, JSON.stringify(current));
    } catch (e) {
      console.error('Error saving video playback position:', e);
    }
  },

  getVideoPlaybackPosition(videoId: string): number {
    if (!videoId) return 0;
    const current = this.getVideoPlaybackPositions();
    return current[videoId] || 0;
  },

  clearVideoPlaybackPosition(videoId: string): void {
    try {
      if (!videoId) return;
      const current = this.getVideoPlaybackPositions();
      delete current[videoId];
      localStorage.setItem(STORAGE_KEYS.VIDEO_PLAYBACK_POSITIONS, JSON.stringify(current));
    } catch (e) {
      console.error('Error clearing video playback position:', e);
    }
  },

  saveVideoPlaybackPositions(positions: Record<string, number>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEO_PLAYBACK_POSITIONS, JSON.stringify(positions || {}));
    } catch (e) {
      console.error('Error saving all video playback positions:', e);
    }
  },

  getVaultActiveVideoId(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.VAULT_ACTIVE_VIDEO) || '';
    } catch {
      return '';
    }
  },

  setVaultActiveVideoId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT_ACTIVE_VIDEO, id || '');
    } catch (e) {
      console.error('Error saving vault active video ID:', e);
    }
  },

  // PDFS
  getPdfs(examId?: string): PdfResource[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.PDFS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((p: any) => ({
            ...p,
            unitId: p.unitId || (p.unit ? `u${p.unit}` : undefined)
          }));
        }
      }

      if (activeExam === 'mid-sem') {
        for (const fallbackKey of FALLBACK_KEYS.PDFS) {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.savePdfs(parsed, 'mid-sem');
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading pdfs:', e);
    }
    return [];
  },

  savePdfs(pdfs: PdfResource[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.PDFS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(pdfs));
    } catch (e) {
      console.error('Error saving pdfs:', e);
    }
  },

  addPdf(pdf: PdfResource, examId?: string): PdfResource[] {
    const list = this.getPdfs(examId);
    const updated = [pdf, ...list];
    this.savePdfs(updated, examId);
    return updated;
  },

  deletePdf(pdfId: string, examId?: string): PdfResource[] {
    const list = this.getPdfs(examId);
    const updated = list.filter(p => p.id !== pdfId);
    this.savePdfs(updated, examId);
    return updated;
  },

  // MOVE ITEMS BETWEEN UNITS (1-Click Move to Unit)
  moveItemToUnit(
    itemType: 'task' | 'video' | 'pdf' | 'question', 
    itemId: string, 
    targetUnitId: string,
    targetUnitNumber?: number
  ): void {
    if (itemType === 'task') {
      const tasks = this.getTasks().map(t => {
        if (t.id === itemId) {
          return { ...t, unitId: targetUnitId, unit: targetUnitNumber ?? t.unit };
        }
        return t;
      });
      this.saveTasks(tasks);
    } else if (itemType === 'video') {
      const videos = this.getVideos().map(v => {
        if (v.id === itemId) {
          return { ...v, unitId: targetUnitId, unit: targetUnitNumber ?? v.unit };
        }
        return v;
      });
      this.saveVideos(videos);
    } else if (itemType === 'pdf') {
      const pdfs = this.getPdfs().map(p => {
        if (p.id === itemId) {
          return { ...p, unitId: targetUnitId, unit: targetUnitNumber ?? p.unit };
        }
        return p;
      });
      this.savePdfs(pdfs);
    } else if (itemType === 'question') {
      const questions = this.getQuestions().map(q => {
        if (q.id === itemId) {
          return { ...q, unitId: targetUnitId, unit: targetUnitNumber ?? q.unit };
        }
        return q;
      });
      this.saveQuestions(questions);
    }
  },

  // ==========================================
  // SYLLABUS TOPICS TRACKER
  // ==========================================
  getTopics(subjectId?: string, examId?: string): SyllabusTopic[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.TOPICS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return subjectId ? parsed.filter(t => t.subjectId === subjectId) : parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading topics:', e);
    }

    return [];
  },

  saveTopics(topics: SyllabusTopic[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.TOPICS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(topics));
    } catch (e) {
      console.error('Error saving topics:', e);
    }
  },

  addTopic(topic: SyllabusTopic, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = [...list, topic];
    this.saveTopics(updated, examId);
    return updated;
  },

  updateTopic(topic: SyllabusTopic, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => t.id === topic.id ? topic : t);
    this.saveTopics(updated, examId);
    return updated;
  },

  reorderTopics(topics: SyllabusTopic[], examId?: string): SyllabusTopic[] {
    this.saveTopics(topics, examId);
    return topics;
  },

  updateTopicTitle(topicId: string, newTitle: string, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => t.id === topicId ? { ...t, title: newTitle.trim() } : t);
    this.saveTopics(updated, examId);
    return updated;
  },

  deleteTopic(topicId: string, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.filter(t => t.id !== topicId);
    this.saveTopics(updated, examId);
    return updated;
  },

  toggleTopicCompleted(topicId: string, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t);
    this.saveTopics(updated, examId);
    return updated;
  },

  setTopicMastery(topicId: string, mastery: TopicMastery, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => t.id === topicId ? { ...t, mastery } : t);
    this.saveTopics(updated, examId);
    return updated;
  },

  addTopicVideo(topicId: string, videoUrl: string, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => {
      if (t.id === topicId) {
        const vUrls = t.videoUrls || [];
        if (!vUrls.includes(videoUrl.trim())) {
          return { ...t, videoUrls: [...vUrls, videoUrl.trim()] };
        }
      }
      return t;
    });
    this.saveTopics(updated, examId);
    return updated;
  },

  removeTopicVideo(topicId: string, videoUrl: string, examId?: string): SyllabusTopic[] {
    const list = this.getTopics(undefined, examId);
    const updated = list.map(t => {
      if (t.id === topicId && t.videoUrls) {
        return { ...t, videoUrls: t.videoUrls.filter(u => u !== videoUrl) };
      }
      return t;
    });
    this.saveTopics(updated, examId);
    return updated;
  },

  getSubjectProgress(subjectId: string, customTopics?: SyllabusTopic[], examId?: string) {
    const allTopics = customTopics || this.getTopics(undefined, examId);
    const subTopics = allTopics.filter(t => t.subjectId === subjectId);
    const total = subTopics.length;
    const completed = subTopics.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const weakCount = subTopics.filter(t => t.mastery === 'weak').length;
    const okayCount = subTopics.filter(t => t.mastery === 'okay').length;
    const strongCount = subTopics.filter(t => t.mastery === 'strong').length;

    return { total, completed, percentage, weakCount, okayCount, strongCount };
  },

  // ==========================================
  // POMODORO FOCUS LOGS
  // ==========================================
  getPomodoroLogs(examId?: string): PomodoroSession[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.POMODORO_LOGS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading pomodoro logs:', e);
    }
    return [];
  },

  resetPomodoroLogs(examId?: string): PomodoroSession[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.POMODORO_LOGS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify([]));
    } catch (e) {
      console.error('Error resetting pomodoro logs:', e);
    }
    return [];
  },

  savePomodoroLogs(logs: PomodoroSession[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.POMODORO_LOGS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving pomodoro logs:', e);
    }
  },

  logPomodoroSession(subjectId: string, minutes: number, examId?: string): PomodoroSession[] {
    const list = this.getPomodoroLogs(examId);
    const subjects = this.getSubjects(examId);
    const sub = subjects.find(s => s.id === subjectId);
    const todayStr = new Date().toISOString().split('T')[0];

    const newLog: PomodoroSession = {
      id: `pomo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      subjectId,
      subjectName: sub?.name || subjectId,
      accentColor: sub?.accentColor || '#10B981',
      minutes,
      date: todayStr,
      timestamp: Date.now()
    };

    const updated = [newLog, ...list];
    this.savePomodoroLogs(updated, examId);
    return updated;
  },

  getWeeklyPomodoroStats(examId?: string): { day: string; date: string; minutes: number }[] {
    const logs = this.getPomodoroLogs(examId);
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; date: string; minutes: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysArr[d.getDay()];

      const dayMinutes = logs
        .filter(l => l.date === dateStr)
        .reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);

      result.push({
        day: dayName,
        date: dateStr,
        minutes: dayMinutes
      });
    }

    return result;
  },

  // ==========================================
  // FLASHCARDS WITH SPACED REPETITION
  // ==========================================
  getFlashcards(subjectId?: string, examId?: string): Flashcard[] {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.FLASHCARDS, activeExam);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return subjectId ? parsed.filter(c => c.subjectId === subjectId) : parsed;
        }
      }

      // Check legacy fallback keys if primary key is empty
      const fallbacks = FALLBACK_KEYS.FLASHCARDS || [];
      for (const fbKey of fallbacks) {
        try {
          const fbData = localStorage.getItem(fbKey);
          if (fbData) {
            const parsed = JSON.parse(fbData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.saveFlashcards(parsed, activeExam);
              return subjectId ? parsed.filter(c => c.subjectId === subjectId) : parsed;
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Error reading flashcards:', e);
    }
    return [];
  },

  saveFlashcards(cards: Flashcard[], examId?: string): void {
    const activeExam = examId || this.getActiveExam();
    const key = getExamStorageKey(STORAGE_KEYS.FLASHCARDS, activeExam);
    try {
      localStorage.setItem(key, JSON.stringify(cards));
    } catch (e) {
      console.error('Error saving flashcards:', e);
    }
  },

  addFlashcard(card: Flashcard, examId?: string): Flashcard[] {
    const list = this.getFlashcards(undefined, examId);
    const updated = [card, ...list];
    this.saveFlashcards(updated, examId);
    return updated;
  },

  updateFlashcard(card: Flashcard, examId?: string): Flashcard[] {
    const list = this.getFlashcards(undefined, examId);
    const updated = list.map(c => c.id === card.id ? card : c);
    this.saveFlashcards(updated, examId);
    return updated;
  },

  reviewFlashcard(cardId: string, rating: 'hard' | 'good' | 'easy', examId?: string): Flashcard[] {
    const list = this.getFlashcards(undefined, examId);
    const now = new Date();

    const updated = list.map(c => {
      if (c.id === cardId) {
        let nextDays = 1;
        let newStep: 0 | 1 | 2 | 3 = 1;

        if (rating === 'hard') {
          nextDays = 1;
          newStep = 1;
        } else if (rating === 'good') {
          nextDays = 3;
          newStep = 2;
        } else if (rating === 'easy') {
          nextDays = 7;
          newStep = 3;
        }

        const nextDate = new Date(now.getTime() + nextDays * 86400000);
        const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

        return {
          ...c,
          intervalStep: newStep,
          nextReviewDate: nextDateStr,
          lastReviewedAt: Date.now()
        };
      }
      return c;
    });

    this.saveFlashcards(updated, examId);
    return updated;
  },

  deleteFlashcard(cardId: string, examId?: string): Flashcard[] {
    const list = this.getFlashcards(undefined, examId);
    const updated = list.filter(c => c.id !== cardId);
    this.saveFlashcards(updated, examId);
    return updated;
  },

  getDueFlashcards(subjectId?: string, examId?: string): Flashcard[] {
    const cards = this.getFlashcards(subjectId, examId);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return cards.filter(c => !c.nextReviewDate || String(c.nextReviewDate).split('T')[0] <= todayStr);
  },

  // ==========================================
  // PYQ FREQUENCY RANKER & HIGH-PRIORITY TOPICS
  // ==========================================
  getHighPriorityTopics(subjectId: string, topicsList?: SyllabusTopic[], questionsList?: PYQQuestion[]) {
    const topics = topicsList || this.getTopics(subjectId);
    const questions = questionsList || this.getQuestions().filter(q => q.subjectId === subjectId);

    return topics.map(topic => {
      const matchedQuestions = questions.filter(q => {
        if (q.topicId && q.topicId === topic.id) return true;
        if (q.topicTitle && q.topicTitle.toLowerCase() === topic.title.toLowerCase()) return true;
        const topicWords = topic.title.toLowerCase().split(/[\s,()&]+/).filter(w => w.length > 3);
        const qText = (q.question + ' ' + (q.unitTitle || '')).toLowerCase();
        return topicWords.some(w => qText.includes(w));
      });

      const totalRepeatCount = matchedQuestions.reduce((sum, q) => sum + (q.repeatCount || 1), 0);
      const allYears = Array.from(new Set(matchedQuestions.flatMap(q => q.yearsAsked || []))).sort((a, b) => b - a);
      const isHighPriority = totalRepeatCount >= 3 || matchedQuestions.some(q => q.isHighProbability) || topic.mastery === 'weak';

      return {
        topicId: topic.id,
        topicTitle: topic.title,
        unitNumber: topic.unitNumber,
        unitId: topic.unitId,
        unitLabel: (topic as any).unitLabel,
        mastery: topic.mastery,
        completed: topic.completed,
        pyqCount: matchedQuestions.length,
        totalRepeatCount: Math.max(totalRepeatCount, matchedQuestions.length),
        yearsAsked: allYears,
        isHighPriority,
        questions: matchedQuestions
      };
    }).sort((a, b) => {
      if (b.totalRepeatCount !== a.totalRepeatCount) {
        return b.totalRepeatCount - a.totalRepeatCount;
      }
      if (a.mastery === 'weak' && b.mastery !== 'weak') return -1;
      if (b.mastery === 'weak' && a.mastery !== 'weak') return 1;
      return (Number(a.unitNumber) || 0) - (Number(b.unitNumber) || 0);
    });
  },

  // ==========================================
  // SMART STUDY PLANNER (AUTO-REDISTRIBUTING)
  // ==========================================
  generateSmartStudyPlan(subjects: SubjectMeta[], allTopics: SyllabusTopic[], allQuestions: PYQQuestion[]): DayStudyPlan[] {
    const now = Date.now();
    const upcomingSubjects = subjects
      .filter(s => !!s.examDate && new Date(s.examDate).getTime() > now)
      .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime());

    const targetSubjects = upcomingSubjects.length > 0 ? upcomingSubjects : subjects;
    const nextExam = targetSubjects[0];
    if (!nextExam) return [];

    const examTime = nextExam.examDate ? new Date(nextExam.examDate).getTime() : now + 14 * 86400000;
    const daysUntilExam = Math.max(1, Math.min(30, Math.ceil((examTime - now) / 86400000)));
    const subjectRank = new Map(targetSubjects.map((s, idx) => [s.id, idx]));

    const scoredTopics: PlannerDayTopic[] = allTopics
      .filter(t => !t.completed)
      .map(topic => {
        const sub = subjects.find(s => s.id === topic.subjectId);
        const subRank = subjectRank.get(topic.subjectId) ?? 99;

        const pyqs = allQuestions.filter(q => 
          q.subjectId === topic.subjectId && 
          ((q.topicId && q.topicId === topic.id) || (q.topicTitle && q.topicTitle.toLowerCase() === topic.title.toLowerCase()))
        );
        const frequency = pyqs.length || topic.pyqCount || 0;

        let masteryWeight = 40;
        if (topic.mastery === 'weak') masteryWeight = 100;
        if (topic.mastery === 'strong') masteryWeight = 10;

        const priorityScore = masteryWeight + (frequency * 25) - (subRank * 60);

        return {
          topicId: topic.id,
          subjectId: topic.subjectId,
          subjectName: sub?.name || 'Subject',
          accentColor: sub?.accentColor || '#10B981',
          unitNumber: topic.unitNumber,
          title: topic.title,
          mastery: topic.mastery,
          frequency,
          completed: false,
          estimatedMinutes: topic.mastery === 'weak' ? 45 : 30,
          _score: priorityScore
        };
      })
      .sort((a, b) => (b as any)._score - (a as any)._score);

    const daysPlan: DayStudyPlan[] = [];
    const topicsPerDay = Math.max(1, Math.ceil(scoredTopics.length / daysUntilExam));

    for (let day = 0; day < daysUntilExam; day++) {
      const planDate = new Date(now + day * 86400000);
      const dateStr = planDate.toISOString().split('T')[0];
      const isToday = day === 0;

      let label = `Day ${day + 1}`;
      if (day === 0) label = 'Today (Day 1)';
      else if (day === 1) label = 'Tomorrow (Day 2)';
      else if (day === daysUntilExam - 1) label = `Exam Eve (Day ${day + 1})`;

      const startIdx = day * topicsPerDay;
      const dayTopics = scoredTopics.slice(startIdx, startIdx + topicsPerDay);

      daysPlan.push({
        date: dateStr,
        dayNumber: day + 1,
        label,
        isToday,
        isPast: false,
        topics: dayTopics
      });
    }

    return daysPlan;
  },

  // ==========================================
  // DATA SAVING: EXPORT & IMPORT BACKUP (JSON)
  // ==========================================
  getFullAppState(compact = false): MasterAppState {
    const examSessions = this.getExamSessions();
    const activeExamId = this.getActiveExam();
    const activeSubjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SUBJECT) || '';
    const themeMode = localStorage.getItem('pyq_visual_mode_v2') || 'liquid-dark';
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    const liquidMotionEnabled = localStorage.getItem('pyq_liquid_motion_v1') !== 'false';
    const subjectSortMode = this.getSubjectSortMode();

    let timerSettings: any = undefined;
    try {
      const rawTimer = localStorage.getItem('pyq_focus_timer_settings_v1');
      if (rawTimer) timerSettings = JSON.parse(rawTimer);
    } catch {}

    const videoPositions = this.getVideoPlaybackPositions();
    const vaultActiveVideoId = this.getVaultActiveVideoId();

    const exams: MasterAppState['exams'] = {};

    examSessions.forEach(session => {
      const eId = session.id;
      const subjects = this.getSubjects(eId);
      const allTopics = this.getTopics(undefined, eId);
      const questions = this.getQuestions(eId);
      const tasks = this.getTasks(eId);
      const videos = this.getVideos(eId);
      const pdfs = this.getPdfs(eId);
      const pomodoroLogs = this.getPomodoroLogs(eId);
      const flashcards = this.getFlashcards(undefined, eId);

      if (compact) {
        // Strip heavy textbook bullets from default questions to keep payload compact for QR encoding
        const compactQuestions = questions.map(q => ({
          id: q.id,
          subjectId: q.subjectId,
          subjectName: q.subjectName,
          unit: q.unit,
          unitTitle: q.unitTitle,
          unitLabel: q.unitLabel,
          unitId: q.unitId,
          topicId: q.topicId,
          topicTitle: q.topicTitle,
          question: q.question,
          marks: q.marks,
          yearsAsked: q.yearsAsked,
          repeatCount: q.repeatCount,
          isHighProbability: q.isHighProbability,
          expectedKeywords: q.expectedKeywords,
          bullets: q.bullets && q.bullets.length <= 2 ? q.bullets : [],
          diagramFormulaTip: q.diagramFormulaTip || '',
          userStatus: q.userStatus,
          userNotes: q.userNotes,
          bookmarked: q.bookmarked,
          isCustom: q.isCustom
        } as PYQQuestion));

        exams[eId] = {
          subjects,
          questions: compactQuestions,
          tasks,
          videos,
          pdfs,
          topics: allTopics,
          pomodoroLogs,
          flashcards
        };
      } else {
        exams[eId] = {
          subjects,
          questions,
          tasks,
          videos,
          pdfs,
          topics: allTopics,
          pomodoroLogs,
          flashcards
        };
      }
    });

    return {
      version: '4.0.0',
      timestamp: Date.now(),
      sourceDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web App',
      activeExamId,
      examSessions,
      activeSubjectId,
      themeMode,
      theme,
      liquidMotionEnabled,
      subjectSortMode,
      timerSettings,
      videoPositions,
      vaultActiveVideoId,
      exams
    };
  },

  importFullAppState(incomingInput: any): { success: boolean; message: string; count: number } {
    try {
      if (!incomingInput) {
        return { success: false, message: 'Empty sync payload received.', count: 0 };
      }

      let data: any = incomingInput;
      if (typeof incomingInput === 'string') {
        data = decodeStatePayload(incomingInput);
      }
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid sync payload structure.', count: 0 };
      }

      let count = 0;

      // 1. Merge Exam Sessions
      if (Array.isArray(data.examSessions) && data.examSessions.length > 0) {
        const localSessions = this.getExamSessions();
        const mergedSessionsMap = new Map<string, ExamSession>();
        localSessions.forEach(s => mergedSessionsMap.set(s.id, s));
        data.examSessions.forEach((s: ExamSession) => {
          if (s && s.id) {
            mergedSessionsMap.set(s.id, {
              ...mergedSessionsMap.get(s.id),
              ...s
            });
          }
        });
        const mergedList = Array.from(mergedSessionsMap.values());
        this.saveExamSessions(mergedList);
      }

      // 2. Active Exam
      if (data.activeExamId && typeof data.activeExamId === 'string') {
        this.setActiveExam(data.activeExamId);
      }

      // 3. Merge Per-Exam Data
      if (data.exams && typeof data.exams === 'object') {
        Object.keys(data.exams).forEach(examId => {
          const examBundle = data.exams[examId];
          if (!examBundle) return;

          // Merge Subjects
          if (Array.isArray(examBundle.subjects) && examBundle.subjects.length > 0) {
            const localSubjects = this.getSubjects(examId);
            const subMap = new Map<string, SubjectMeta>();
            localSubjects.forEach(s => subMap.set(s.id, s));

            examBundle.subjects.forEach((incomingSub: SubjectMeta) => {
              const existing = subMap.get(incomingSub.id);
              if (existing) {
                // Merge units by ID
                const unitMap = new Map<string, SubjectUnit>();
                (existing.units || []).forEach(u => unitMap.set(u.id, u));
                (incomingSub.units || []).forEach(u => unitMap.set(u.id, { ...unitMap.get(u.id), ...u }));

                subMap.set(incomingSub.id, {
                  ...existing,
                  ...incomingSub,
                  examDate: incomingSub.examDate || existing.examDate,
                  accentColor: incomingSub.accentColor || existing.accentColor,
                  units: Array.from(unitMap.values())
                });
              } else {
                subMap.set(incomingSub.id, incomingSub);
              }
            });
            this.saveSubjects(Array.from(subMap.values()), examId);
            count++;
          }

          // Merge Topics
          if (Array.isArray(examBundle.topics)) {
            const localTopics = this.getTopics(undefined, examId);
            const topicMap = new Map<string, SyllabusTopic>();
            localTopics.forEach(t => topicMap.set(t.id, t));

            examBundle.topics.forEach((incomingTopic: SyllabusTopic) => {
              const existing = topicMap.get(incomingTopic.id);
              if (existing) {
                topicMap.set(incomingTopic.id, {
                  ...existing,
                  ...incomingTopic,
                  completed: incomingTopic.completed !== undefined ? incomingTopic.completed : existing.completed,
                  mastery: incomingTopic.mastery || existing.mastery,
                  videoUrls: Array.from(new Set([...(existing.videoUrls || []), ...(incomingTopic.videoUrls || [])]))
                });
              } else {
                topicMap.set(incomingTopic.id, incomingTopic);
              }
            });
            this.saveTopics(Array.from(topicMap.values()), examId);
          }

          // Merge Questions
          if (Array.isArray(examBundle.questions)) {
            const localQuestions = this.getQuestions(examId);
            const qMap = new Map<string, PYQQuestion>();
            localQuestions.forEach(q => qMap.set(q.id, q));

            examBundle.questions.forEach((incomingQ: PYQQuestion) => {
              const existing = qMap.get(incomingQ.id);
              if (existing) {
                qMap.set(incomingQ.id, {
                  ...existing,
                  ...incomingQ,
                  userStatus: incomingQ.userStatus || existing.userStatus,
                  bookmarked: incomingQ.bookmarked !== undefined ? incomingQ.bookmarked : existing.bookmarked,
                  userNotes: incomingQ.userNotes || existing.userNotes
                });
              } else {
                qMap.set(incomingQ.id, incomingQ);
              }
            });
            this.saveQuestions(Array.from(qMap.values()), examId);
          }

          // Merge Tasks
          if (Array.isArray(examBundle.tasks)) {
            const localTasks = this.getTasks(examId);
            const taskMap = new Map<string, StudyTask>();
            localTasks.forEach(t => taskMap.set(t.id, t));
            examBundle.tasks.forEach((inTask: StudyTask) => {
              const existing = taskMap.get(inTask.id);
              if (existing) {
                taskMap.set(inTask.id, {
                  ...existing,
                  ...inTask,
                  completed: inTask.completed !== undefined ? inTask.completed : existing.completed
                });
              } else {
                taskMap.set(inTask.id, inTask);
              }
            });
            this.saveTasks(Array.from(taskMap.values()), examId);
          }

          // Merge Videos
          if (Array.isArray(examBundle.videos)) {
            const localVideos = this.getVideos(examId);
            const vidMap = new Map<string, VideoResource>();
            localVideos.forEach(v => vidMap.set(v.id, v));
            examBundle.videos.forEach((inVid: VideoResource) => {
              const existing = vidMap.get(inVid.id);
              if (existing) {
                vidMap.set(inVid.id, {
                  ...existing,
                  ...inVid,
                  isWatched: inVid.isWatched !== undefined ? inVid.isWatched : existing.isWatched,
                  notes: inVid.notes || existing.notes
                });
              } else {
                vidMap.set(inVid.id, inVid);
              }
            });
            this.saveVideos(Array.from(vidMap.values()), examId);
          }

          // Merge PDFs
          if (Array.isArray(examBundle.pdfs)) {
            const localPdfs = this.getPdfs(examId);
            const pdfMap = new Map<string, PdfResource>();
            localPdfs.forEach(p => pdfMap.set(p.id, p));
            examBundle.pdfs.forEach((inPdf: PdfResource) => {
              pdfMap.set(inPdf.id, { ...(pdfMap.get(inPdf.id) || inPdf), ...inPdf });
            });
            this.savePdfs(Array.from(pdfMap.values()), examId);
          }

          // Merge Pomodoro Logs (Union by id)
          if (Array.isArray(examBundle.pomodoroLogs)) {
            const localLogs = this.getPomodoroLogs(examId);
            const logMap = new Map<string, PomodoroSession>();
            localLogs.forEach(l => logMap.set(l.id, l));
            examBundle.pomodoroLogs.forEach((inLog: PomodoroSession) => {
              logMap.set(inLog.id, inLog);
            });
            const mergedLogs = Array.from(logMap.values()).sort((a, b) => b.timestamp - a.timestamp);
            this.savePomodoroLogs(mergedLogs, examId);
          }

          // Merge Flashcards
          if (Array.isArray(examBundle.flashcards)) {
            const localCards = this.getFlashcards(undefined, examId);
            const cardMap = new Map<string, Flashcard>();
            localCards.forEach(c => cardMap.set(c.id, c));
            examBundle.flashcards.forEach((inCard: Flashcard) => {
              const existing = cardMap.get(inCard.id);
              if (existing) {
                cardMap.set(inCard.id, {
                  ...existing,
                  ...inCard,
                  intervalStep: inCard.intervalStep !== undefined ? inCard.intervalStep : existing.intervalStep,
                  nextReviewDate: inCard.nextReviewDate || existing.nextReviewDate
                });
              } else {
                cardMap.set(inCard.id, inCard);
              }
            });
            this.saveFlashcards(Array.from(cardMap.values()), examId);
          }
        });
      }

      // 4. Also handle legacy root-level properties if present
      if (Array.isArray(data.subjects) && data.subjects.length > 0 && !data.exams) {
        this.saveSubjects(data.subjects);
      }
      if (Array.isArray(data.topics) && !data.exams) {
        this.saveTopics(data.topics);
      }
      if (Array.isArray(data.questions) && !data.exams) {
        this.saveQuestions(data.questions);
      }
      if (Array.isArray(data.tasks) && !data.exams) {
        this.saveTasks(data.tasks);
      }
      if (Array.isArray(data.videos) && !data.exams) {
        this.saveVideos(data.videos);
      }
      if (Array.isArray(data.pdfs) && !data.exams) {
        this.savePdfs(data.pdfs);
      }
      if (Array.isArray(data.pomodoroLogs) && !data.exams) {
        this.savePomodoroLogs(data.pomodoroLogs);
      }
      if (Array.isArray(data.flashcards) && !data.exams) {
        this.saveFlashcards(data.flashcards);
      }

      // 5. User Settings & Display Preferences
      if (data.activeSubjectId && typeof data.activeSubjectId === 'string') {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SUBJECT, data.activeSubjectId);
      }
      if (data.themeMode && typeof data.themeMode === 'string') {
        localStorage.setItem('pyq_visual_mode_v2', data.themeMode);
      }
      if (data.theme && typeof data.theme === 'string') {
        localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(data.theme);
        }
      }
      if (data.liquidMotionEnabled !== undefined) {
        localStorage.setItem('pyq_liquid_motion_v1', String(data.liquidMotionEnabled));
      }
      if (data.subjectSortMode) {
        this.setSubjectSortMode(data.subjectSortMode);
      }
      if (data.timerSettings) {
        try {
          localStorage.setItem('pyq_focus_timer_settings_v1', JSON.stringify(data.timerSettings));
        } catch {}
      }
      if (data.videoPositions) {
        this.saveVideoPlaybackPositions(data.videoPositions);
      }
      if (data.vaultActiveVideoId) {
        this.setVaultActiveVideoId(data.vaultActiveVideoId);
      }

      // 6. Notify active app components without reloading page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pyq-master-state-imported', { detail: data }));
      }

      return {
        success: true,
        message: 'Full state synchronized successfully with zero data loss!',
        count
      };
    } catch (err: any) {
      console.error('Failed to import full app state:', err);
      return {
        success: false,
        message: `Import failed: ${err.message || 'Unknown error'}`,
        count: 0
      };
    }
  },

  getBackupObject(): FullBackupData & { masterState?: MasterAppState } {
    const master = this.getFullAppState();
    return {
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      subjects: this.getSubjects(),
      topics: this.getTopics(),
      questions: this.getQuestions(),
      tasks: this.getTasks(),
      videos: this.getVideos(),
      pdfs: this.getPdfs(),
      pomodoroLogs: this.getPomodoroLogs(),
      flashcards: this.getFlashcards(),
      videoPositions: this.getVideoPlaybackPositions(),
      vaultActiveVideoId: this.getVaultActiveVideoId(),
      masterState: master
    };
  },

  exportBackup(): void {
    const backup = this.getBackupObject();

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restoreBackup(backupData: any): { success: boolean; message: string } {
    return this.importBackup(backupData);
  },

  importBackup(backupInput: any): { success: boolean; message: string } {
    try {
      const data = typeof backupInput === 'string' ? JSON.parse(backupInput) : backupInput;
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup JSON file structure.' };
      }

      if (data.masterState) {
        const res = this.importFullAppState(data.masterState);
        return { success: res.success, message: res.message };
      }

      if (data.exams || data.examSessions) {
        const res = this.importFullAppState(data);
        return { success: res.success, message: res.message };
      }

      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        this.saveSubjects(data.subjects);
      }
      if (Array.isArray(data.topics)) {
        this.saveTopics(data.topics);
      }
      if (Array.isArray(data.questions)) {
        this.saveQuestions(data.questions);
      }
      if (Array.isArray(data.tasks)) {
        this.saveTasks(data.tasks);
      }
      if (Array.isArray(data.videos)) {
        this.saveVideos(data.videos);
      }
      if (Array.isArray(data.pdfs)) {
        this.savePdfs(data.pdfs);
      }
      if (Array.isArray(data.pomodoroLogs)) {
        this.savePomodoroLogs(data.pomodoroLogs);
      }
      if (Array.isArray(data.flashcards)) {
        this.saveFlashcards(data.flashcards);
      }
      if (data.videoPositions && typeof data.videoPositions === 'object') {
        this.saveVideoPlaybackPositions(data.videoPositions);
      }
      if (data.vaultActiveVideoId && typeof data.vaultActiveVideoId === 'string') {
        this.setVaultActiveVideoId(data.vaultActiveVideoId);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pyq-master-state-imported', { detail: data }));
      }

      return { success: true, message: 'All study data, syllabus topics, and countdowns imported successfully!' };
    } catch (e: any) {
      return { success: false, message: `Import error: ${e.message || 'Corrupted JSON file'}` };
    }
  },

  // RESET TO DEFAULT DEMO DATA
  resetToDefaultData(): {
    subjects: SubjectMeta[];
    questions: PYQQuestion[];
    tasks: StudyTask[];
    videos: VideoResource[];
    pdfs: PdfResource[];
  } {
    this.saveSubjects(DEFAULT_SUBJECTS);
    this.saveQuestions(INITIAL_QUESTIONS);
    this.saveTasks(DEFAULT_TASKS);
    this.saveVideos(DEFAULT_VIDEOS);
    this.savePdfs(DEFAULT_PDFS);
    this.saveTopics(DEFAULT_TOPICS);
    this.saveFlashcards(DEFAULT_FLASHCARDS);

    return {
      subjects: DEFAULT_SUBJECTS,
      questions: INITIAL_QUESTIONS,
      tasks: DEFAULT_TASKS,
      videos: DEFAULT_VIDEOS,
      pdfs: DEFAULT_PDFS
    };
  },

  // BROADCAST TO BROWSER EXTENSION
  broadcastToExtension(): void {
    try {
      const subjects = this.getSubjects();
      const questions = this.getQuestions();
      const activeSubjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SUBJECT) || 'os';
      const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';

      if (typeof window !== 'undefined' && typeof window.postMessage === 'function') {
        window.postMessage({
          type: 'PYQ_SYNC_DATA',
          payload: {
            version: '3.0.0',
            timestamp: Date.now(),
            subjects,
            questions,
            activeSubjectId,
            theme
          }
        }, '*');
      }
    } catch (e) {
      // In non-browser or extension restricted environments
    }
  }
};

export function runOneTimeStorageCleanup(): void {
  const MIGRATION_KEY = 'pyq_v2_cleanup_done_1';
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (localStorage.getItem(MIGRATION_KEY)) {
      return;
    }

    const DEMO_POMO_IDS = new Set(['pomo-1', 'pomo-2', 'pomo-3', 'pomo-4']);
    const DEMO_FC_IDS = new Set(['fc-1', 'fc-2', 'fc-3', 'fc-4', 'fc-5', 'fc-6']);
    const DEMO_TOPIC_IDS = new Set([
      'top-os-1', 'top-os-6', 'top-os-8', 'top-os-9',
      'top-db-1', 'top-db-4',
      'top-cn-1', 'top-cn-3', 'top-cn-6',
      'top-dsa-1'
    ]);

    // Inspect all keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Clean demo timer logs
      if (key.includes('pomodoro_logs') || key.includes('pomodoro')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const logs = JSON.parse(raw);
            if (Array.isArray(logs)) {
              const cleaned = logs.filter((l: any) => !DEMO_POMO_IDS.has(l.id));
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          }
        } catch (e) {
          console.warn('Error cleaning demo pomo logs for key', key, e);
        }
      }

      // Clean demo flashcards
      if (key.includes('flashcards')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cards = JSON.parse(raw);
            if (Array.isArray(cards)) {
              const cleaned = cards.filter((c: any) => !DEMO_FC_IDS.has(c.id));
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          }
        } catch (e) {
          console.warn('Error cleaning demo flashcards for key', key, e);
        }
      }

      // Reset completed: false on demo topics that were initialized as completed
      if (key.includes('topics')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const topics = JSON.parse(raw);
            if (Array.isArray(topics)) {
              let changed = false;
              const updated = topics.map((t: any) => {
                if (DEMO_TOPIC_IDS.has(t.id) && t.completed) {
                  changed = true;
                  return { ...t, completed: false };
                }
                return t;
              });
              if (changed) {
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          }
        } catch (e) {
          console.warn('Error resetting demo topic completed status for key', key, e);
        }
      }
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('✅ PyqRanker one-time storage cleanup executed.');
  } catch (err) {
    console.warn('Failed to run one-time storage cleanup:', err);
  }
}

// Automatically execute once on script load
runOneTimeStorageCleanup();

/**
 * Bulletproof URI / Base64 Safe Encoding & Decoding for QR Codes & Magic Links
 */
export function encodeStatePayload(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    const utf8Str = encodeURIComponent(jsonStr);
    return btoa(utf8Str);
  } catch (e) {
    console.error('Failed to encode state payload', e);
    return encodeURIComponent(JSON.stringify(data));
  }
}

export function decodeStatePayload(encoded: string): any {
  if (!encoded || !encoded.trim()) return null;
  const cleanStr = encoded.trim();
  try {
    // 1. Try Base64 -> decodeURIComponent -> JSON parse
    try {
      const decodedB64 = atob(cleanStr);
      const jsonStr = decodeURIComponent(decodedB64);
      return JSON.parse(jsonStr);
    } catch {
      // 2. Fallback: URI Decode -> JSON parse
      const decodedUri = decodeURIComponent(cleanStr);
      return JSON.parse(decodedUri);
    }
  } catch (e) {
    console.error('Failed to decode state payload:', e);
    return null;
  }
}


