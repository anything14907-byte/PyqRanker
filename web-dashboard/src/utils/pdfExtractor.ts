import { PYQQuestion, SubjectId } from '../types';

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/cmaps/`,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += `\n--- Page ${pageNum} ---\n` + pageText;
    }

    return fullText;
  } catch (err) {
    console.warn('PDF.js client extraction notice (trying fallback text decoder):', err);
    return await file.text();
  }
}

export function parseQuestionsFromText(
  rawText: string, 
  defaultSubjectId: SubjectId = 'os',
  defaultYear: number = 2025
): PYQQuestion[] {
  const extracted: PYQQuestion[] = [];
  
  const yearMatch = rawText.match(/\b(202[0-6])\b/);
  const detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : defaultYear;

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const questionStartRegex = /^(?:Q(?:uestion)?\.?\s*(\d+[a-z]?)|(\d+)\s*[\.)]\s*(?:\([a-z]\))?|\[\s*Q?(\d+)\s*\])/i;

  let currentBlock = '';
  const blocks: string[] = [];

  for (const line of lines) {
    if (questionStartRegex.test(line) && currentBlock.length > 25) {
      blocks.push(currentBlock);
      currentBlock = line;
    } else {
      currentBlock += (currentBlock ? ' ' : '') + line;
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  const candidateBlocks = blocks.length > 1 ? blocks : rawText.split(/\n\s*\n/).filter(b => b.trim().length > 20);

  let counter = 1;
  for (const block of candidateBlocks) {
    const cleanBlock = block.replace(/\s+/g, ' ').trim();
    if (cleanBlock.length < 20) continue;

    let marks: 2 | 5 | 10 = 5;
    const marksMatch = cleanBlock.match(/(?:\[|\()?\s*(\d{1,2})\s*(?:M|Marks?|marks?)\s*(?:\]|\))?/i) ||
                       cleanBlock.match(/(?:Marks?|weightage)\s*[:=]\s*(\d{1,2})/i);
    if (marksMatch) {
      const val = parseInt(marksMatch[1], 10);
      if (val <= 3) marks = 2;
      else if (val <= 7) marks = 5;
      else marks = 10;
    } else {
      marks = cleanBlock.length < 90 ? 2 : cleanBlock.length > 220 ? 10 : 5;
    }

    const cleanedQuestion = cleanBlock
      .replace(questionStartRegex, '')
      .replace(/(?:\[|\()?\s*\d{1,2}\s*(?:M|Marks?|marks?)\s*(?:\]|\))?$/i, '')
      .trim();

    if (cleanedQuestion.length < 15) continue;

    const { subjectId, subjectName, unit, unitTitle } = classifySubjectAndUnit(cleanedQuestion, defaultSubjectId);
    const keywords = extractKeywordsFromText(cleanedQuestion);

    extracted.push({
      id: `UPLOAD-${Date.now().toString(36)}-${counter++}`,
      subjectId,
      subjectName,
      unit,
      unitTitle,
      question: cleanedQuestion,
      marks,
      yearsAsked: [detectedYear],
      repeatCount: 1,
      isHighProbability: marks === 10,
      expectedKeywords: keywords.length >= 3 ? keywords : ['Core Concept', 'Technical Definition', 'System Impact'],
      bullets: [
        `Clear technical definition of ${keywords[0] || 'the core concept'}.`,
        `Working mechanism and step-by-step logic expected by university evaluators.`,
        `Key comparison points, practical application, or state transition summary.`
      ],
      diagramFormulaTip: `Draw a block diagram illustrating ${keywords[0] || 'the architecture'} with labeled input, processing, and output states.`,
      userStatus: 'not-started'
    });
  }

  return extracted;
}

function classifySubjectAndUnit(text: string, fallbackSubject: SubjectId): {
  subjectId: SubjectId;
  subjectName: string;
  unit: number;
  unitTitle: string;
} {
  const lower = text.toLowerCase();

  // OS
  if (lower.includes('deadlock') || lower.includes('banker') || lower.includes('semaphore') || lower.includes('critical section')) {
    return { subjectId: 'os', subjectName: 'Operating Systems', unit: 2, unitTitle: 'Synchronization & Deadlocks' };
  }
  if (lower.includes('paging') || lower.includes('tlb') || lower.includes('page fault') || lower.includes('belady')) {
    return { subjectId: 'os', subjectName: 'Operating Systems', unit: 3, unitTitle: 'Memory & Paging' };
  }
  if (lower.includes('scheduling') || lower.includes('round robin') || lower.includes('sjf') || lower.includes('pcb')) {
    return { subjectId: 'os', subjectName: 'Operating Systems', unit: 1, unitTitle: 'Process Scheduling' };
  }
  if (lower.includes('disk') || lower.includes('scan') || lower.includes('c-scan')) {
    return { subjectId: 'os', subjectName: 'Operating Systems', unit: 4, unitTitle: 'Storage & Disk Management' };
  }

  // DBMS
  if (lower.includes('normal') || lower.includes('bcnf') || lower.includes('3nf') || lower.includes('functional dependency')) {
    return { subjectId: 'dbms', subjectName: 'Database Systems', unit: 2, unitTitle: 'SQL & Normalization' };
  }
  if (lower.includes('acid') || lower.includes('serializab') || lower.includes('2pl') || lower.includes('transaction')) {
    return { subjectId: 'dbms', subjectName: 'Database Systems', unit: 3, unitTitle: 'Transactions & Concurrency' };
  }
  if (lower.includes('b+ tree') || lower.includes('b-tree') || lower.includes('index')) {
    return { subjectId: 'dbms', subjectName: 'Database Systems', unit: 4, unitTitle: 'Indexing & B+ Trees' };
  }

  // CN
  if (lower.includes('tcp') || lower.includes('congestion') || lower.includes('handshake') || lower.includes('aimd')) {
    return { subjectId: 'cn', subjectName: 'Computer Networks', unit: 4, unitTitle: 'Transport Layer & TCP' };
  }
  if (lower.includes('routing') || lower.includes('distance vector') || lower.includes('link state') || lower.includes('subnet')) {
    return { subjectId: 'cn', subjectName: 'Computer Networks', unit: 3, unitTitle: 'Network Layer & Routing' };
  }

  // DSA
  if (lower.includes('avl') || lower.includes('rotation') || lower.includes('bst')) {
    return { subjectId: 'dsa', subjectName: 'Data Structures & Algorithms', unit: 2, unitTitle: 'Trees & AVL Balancing' };
  }
  if (lower.includes('dijkstra') || lower.includes('shortest path') || lower.includes('graph')) {
    return { subjectId: 'dsa', subjectName: 'Data Structures & Algorithms', unit: 4, unitTitle: 'Graphs & Dijkstra' };
  }
  if (lower.includes('knapsack') || lower.includes('dynamic programming')) {
    return { subjectId: 'dsa', subjectName: 'Data Structures & Algorithms', unit: 5, unitTitle: 'Dynamic Programming' };
  }

  const names: Record<SubjectId, string> = {
    os: 'Operating Systems',
    dbms: 'Database Systems',
    cn: 'Computer Networks',
    dsa: 'Data Structures & Algorithms'
  };

  return {
    subjectId: fallbackSubject,
    subjectName: names[fallbackSubject] || 'Computer Science',
    unit: 1,
    unitTitle: 'Core Concepts'
  };
}

function extractKeywordsFromText(text: string): string[] {
  const stopwords = new Set([
    'explain', 'describe', 'what', 'define', 'with', 'using', 'between', 'difference', 'compare',
    'example', 'examples', 'discuss', 'calculate', 'write', 'short', 'notes', 'following',
    'various', 'types', 'given', 'show', 'briefly', 'their', 'which', 'state', 'illustrate',
    'algorithm', 'from', 'each', 'that', 'this', 'have', 'more', 'also', 'such', 'into'
  ]);

  const words = text.replace(/[^a-zA-Z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const candidates: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (stopwords.has(word.toLowerCase())) continue;

    if (i + 1 < words.length && !stopwords.has(words[i + 1].toLowerCase())) {
      const phrase = `${word} ${words[i + 1]}`;
      if (!candidates.includes(phrase) && candidates.length < 5) {
        candidates.push(phrase);
      }
    }

    if (!candidates.includes(word) && candidates.length < 5) {
      candidates.push(word);
    }
  }

  return candidates.slice(0, 5);
}
