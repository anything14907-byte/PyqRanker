import { PYQQuestion, SubjectMeta, Flashcard, SyllabusTopic } from '../types';

export interface SectionHeading {
  id: string;
  raw: string;
  title: string;
  cleanTitle: string;
  level: 1 | 2 | 3;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface FormulasAndAlgorithms {
  formulas: string[];
  algorithms: string[];
}

export interface PracticeQuestionItem {
  id: string;
  question: string;
  marks: 2 | 5 | 10;
  type: 'define' | 'explain' | 'derive' | 'algorithm' | 'differentiate';
  sourceSnippet?: string;
}

export interface TextQualityAssessment {
  isReliable: boolean;
  charCount: number;
  wordCount: number;
  reason?: string;
}

export interface NotesAnalysisResult {
  rawText: string;
  cleanedText: string;
  quality: TextQualityAssessment;
  headings: SectionHeading[];
  summary: string[];
  keyTerms: KeyTerm[];
  formulasAndAlgorithms: FormulasAndAlgorithms;
  practiceQuestions: PracticeQuestionItem[];
}

// =========================================================================
// 1. CLEAN THE TEXT FIRST
// =========================================================================
export function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove page markers (e.g. --- Page 1 ---, Page 1 of 10, Page 1, [Page 1])
  text = text.replace(/[-—_]{2,}\s*Page\s*\d+\s*[-—_]{2,}/gi, '\n');
  text = text.replace(/\bPage\s+\d+\s*(?:of|\/)\s*\d+\b/gi, '');
  text = text.replace(/\[\s*Page\s+\d+\s*\]/gi, '');
  text = text.replace(/\bPage\s+\d+\b/gi, '');

  // 2. Remove standalone line page numbers (e.g. lines that are just numbers like "  14  ")
  text = text.replace(/^[ \t]*\d{1,4}[ \t]*$/gm, '');

  // 3. Fix hyphenated words broken across line breaks (e.g. "algo-\nrithm" -> "algorithm")
  text = text.replace(/(\b[A-Za-z]+)-\s*\r?\n\s*([A-Za-z]+\b)/g, '$1$2');

  // 4. Split into lines to filter out recurring headers/footers
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  // Find frequency of short lines to detect repeating headers/footers
  const lineCounts = new Map<string, number>();
  for (const line of lines) {
    if (line.length > 5 && line.length < 80) {
      const lower = line.toLowerCase();
      lineCounts.set(lower, (lineCounts.get(lower) || 0) + 1);
    }
  }

  // Filter out lines that repeat >= 2 times if they look like header/footer noise
  const filteredLines: string[] = [];
  const seenRepeated = new Set<string>();
  for (const line of lines) {
    const lower = line.toLowerCase();
    const count = lineCounts.get(lower) || 0;
    if (count >= 2) {
      const isPureNoise = (
        lower.includes('department of') ||
        lower.includes('university') ||
        lower.includes('all rights reserved') ||
        lower.includes('copyright') ||
        lower.includes('all pages') ||
        lower.includes('dr.') ||
        lower.includes('prof.') ||
        lower.includes('www.') ||
        /^page\s+\d+/i.test(lower)
      );
      if (isPureNoise) {
        continue;
      }
      // If repeated across pages (e.g. course title header), keep at most once
      if (seenRepeated.has(lower)) {
        continue;
      }
      seenRepeated.add(lower);
    }
    filteredLines.push(line);
  }

  // 5. Unwrap broken lines while preserving true paragraphs, headers, and bullet points
  const unwrappedLines: string[] = [];
  let currentBuffer = '';

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];
    if (!line) {
      if (currentBuffer) {
        unwrappedLines.push(currentBuffer);
        currentBuffer = '';
      }
      continue;
    }

    const isBulletOrStep = /^([•\-*]|\d+[\.)]|\([a-z0-9]\)|Step\s+\d+:?)/i.test(line);
    const isHeading = isLikelyHeading(line);
    const isFormula = /[=≈≤≥≠]/.test(line) && line.length < 120;

    if (isBulletOrStep || isHeading || isFormula) {
      if (currentBuffer) {
        unwrappedLines.push(currentBuffer);
        currentBuffer = '';
      }
      unwrappedLines.push(line);
    } else {
      if (!currentBuffer) {
        currentBuffer = line;
      } else {
        const lastChar = currentBuffer.slice(-1);
        const endsSentence = /[.?!:;]/.test(lastChar);
        const nextStartsLower = /^[a-z]/.test(line);
        // Only unwrap soft line-breaks if the next line starts with lowercase or previous ended with continuation punctuation
        if (!endsSentence && (nextStartsLower || /[,(\[\{]$/.test(lastChar))) {
          currentBuffer += ' ' + line;
        } else {
          unwrappedLines.push(currentBuffer);
          currentBuffer = line;
        }
      }
    }
  }

  if (currentBuffer) {
    unwrappedLines.push(currentBuffer);
  }

  return unwrappedLines
    .map(l => l.replace(/[ \t]{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function isLikelyHeading(line: string): boolean {
  if (line.length > 80 || line.length < 3) return false;
  if (/^(\d+\.|\d+\.\d+|\d+\.\d+\.\d+)\s+[A-Z0-9]/.test(line)) return true;
  if (/^(UNIT|Unit|MODULE|Module|CHAPTER|Chapter)\s+([IVXLCDM]+|\d+)/i.test(line)) return true;
  if (/^[A-Z0-9\s,&/\-–()]{4,60}$/.test(line) && line.split(/\s+/).length >= 1 && line.split(/\s+/).length <= 8) return true;
  if (/^[A-Z][A-Za-z0-9\s,&/\-–()]{3,60}:$/.test(line)) return true;
  if (/^[A-Z0-9]{2,8}:\s+[A-Za-z0-9\s,&/\-–()]{3,60}$/.test(line)) return true;
  return false;
}

// =========================================================================
// 2. QUALITY GUARD: ASSESS TEXT QUALITY
// =========================================================================
export function assessTextQuality(text: string): TextQualityAssessment {
  if (!text || text.trim().length === 0) {
    return {
      isReliable: false,
      charCount: 0,
      wordCount: 0,
      reason: 'The file contains no readable text. It may be an image without OCR, scanned, or empty.'
    };
  }

  const clean = text.trim();
  const charCount = clean.length;
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;

  if (charCount < 45 || wordCount < 8) {
    return {
      isReliable: false,
      charCount,
      wordCount,
      reason: `The extracted text is too short (${charCount} characters, ${wordCount} words) to analyze reliably.`
    };
  }

  // Check alphanumeric ratio (if it is pure random symbols/binary junk)
  const alphanumericChars = (clean.match(/[a-zA-Z0-9]/g) || []).length;
  const alphaRatio = alphanumericChars / charCount;

  if (alphaRatio < 0.45) {
    return {
      isReliable: false,
      charCount,
      wordCount,
      reason: 'The extracted text contains excessive non-alphanumeric symbols or garbled characters.'
    };
  }

  return {
    isReliable: true,
    charCount,
    wordCount
  };
}

// =========================================================================
// 3. FIND THE STRUCTURE: HEADINGS & OUTLINE
// =========================================================================
export function detectStructureAndHeadings(text: string): SectionHeading[] {
  if (!text) return [];

  // REQUIREMENT 5.c: Split joined inline text before numbering patterns like '1.', '1.1', '2.3' and before 'UNIT I'
  // so that headings concatenated into a single line land on their own individual lines.
  const headingSplitPattern = /(?<=\S)\s+(?=(?:\b\d+(?:\.\d+)+(?:\.|\b)\s+[A-Z]|\b\d+\.\s+[A-Z]|\b(?:UNIT|Unit|MODULE|Module|CHAPTER|Chapter)\s+(?:[IVXLCDM]+|\d+)\b))/gi;
  const preprocessedText = text.replace(headingSplitPattern, '\n');

  const lines = preprocessedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const headings: SectionHeading[] = [];
  const seenTitles = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 3 || line.length > 85) continue;
    
    // Skip lines with mathematical formulas, equalities, or relations
    if (/[=≈≤≥≠<>→√′″]/.test(line)) continue;

    // Skip full sentences ending in period (at least 5 words long)
    if (/\.\s*$/.test(line) && line.split(/\s+/).length >= 5) continue;

    let cleanTitle = '';
    let level: 1 | 2 | 3 = 2;

    // Pattern 1: Numbered like 1., 1.1, 1.1.1, 2.3
    const numMatch = line.match(/^(\d+(?:\.\d+)*)(?:\.|\b)\s*[\.\-–\)]?\s*([A-Z].+)$/);
    if (numMatch) {
      const numPart = numMatch[1];
      const titlePart = numMatch[2].replace(/:$/, '').trim();
      const dotCount = (numPart.match(/\./g) || []).length;
      level = dotCount === 0 ? 1 : dotCount === 1 ? 2 : 3;
      cleanTitle = titlePart;
    }

    // Pattern 2: Unit / Module / Chapter header (e.g. UNIT I: Line Search Methods)
    else if (/^(?:UNIT|Unit|MODULE|Module|CHAPTER|Chapter)\s+([IVXLCDM]+|\d+)\s*[:\-–—]?\s*(.*)$/i.test(line)) {
      const match = line.match(/^(?:UNIT|Unit|MODULE|Module|CHAPTER|Chapter)\s+([IVXLCDM]+|\d+)\s*[:\-–—]?\s*(.*)$/i);
      if (match) {
        level = 1;
        const sub = match[2]?.replace(/^[—\-–:]\s*/, '').trim();
        cleanTitle = sub && sub.toLowerCase() !== 'contents' ? sub : `Unit ${match[1]}`;
      }
    }

    // Pattern 3: Short line in ALL CAPS (length 4 to 60, 1-7 words)
    else if (/^[A-Z0-9\s,&/\-–()]{4,60}$/.test(line)) {
      const wordCount = line.split(/\s+/).length;
      if (wordCount >= 1 && wordCount <= 7 && !/^(PAGE|OF|DATE|TOTAL|NOTE|FIG|FIGURE)\b/i.test(line)) {
        level = 1;
        cleanTitle = line.replace(/[:\-–]$/, '').trim();
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1).toLowerCase();
      }
    }

    // Pattern 4: Short line ending with colon (e.g. "Types of Optimization Methods:")
    else if (/^[A-Z][A-Za-z0-9\s,&/\-–()]{3,60}:$/.test(line)) {
      level = 2;
      cleanTitle = line.replace(/:$/, '').trim();
    }

    if (cleanTitle && cleanTitle.length >= 3) {
      // Clean up punctuation
      cleanTitle = cleanTitle.replace(/^[\d\.\-\s]+/, '').trim();
      if (!cleanTitle || cleanTitle.length < 3) continue;

      const norm = cleanTitle.toLowerCase();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        headings.push({
          id: `heading-${headings.length + 1}`,
          raw: line,
          title: line.replace(/:$/, '').trim(),
          cleanTitle,
          level
        });
      }
    }
  }

  return headings;
}

// =========================================================================
// 4. SUMMARY (3 TO 5 COMPLETE SENTENCES FROM WHOLE DOCUMENT)
// =========================================================================
export function generateInformativeSummary(text: string): string[] {
  // Strip out heading lines, formulas, and numbered steps so summary contains only pure prose
  const proseLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (isLikelyHeading(l)) return false;
      if (/^(Step\s+\d+:?|\d+\.\s*(?:Initialize|Set|For|While|Repeat|If|Else|Compute|Return|Print|Input|Output)\b)/i.test(l)) return false;
      if (/[=≈≤≥≠]/.test(l) && l.length < 120) return false;
      return true;
    });

  const proseText = proseLines.join(' ');

  // Extract all grammatical sentences without internal line breaks
  const rawSentences = proseText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => {
      if (s.length < 40 || s.length > 250) return false;
      if (!/^[A-Z]/.test(s)) return false; // Must start with capital letter
      if (!/[.?!]$/.test(s)) return false; // Must end with sentence punctuation
      if (/^(http|www\.|---|\/\/|copyright|UNIT|MODULE|CHAPTER|Step\s+\d+|\d+\.)/i.test(s)) return false;
      if (s.includes('=') && s.length < 80) return false; // Exclude formulas from prose summary
      return true;
    });

  if (rawSentences.length === 0) {
    const fallback = text.replace(/\s+/g, ' ').slice(0, 250).trim();
    return [fallback.endsWith('.') ? fallback : fallback + '.'];
  }

  if (rawSentences.length <= 4) {
    return Array.from(new Set(rawSentences));
  }

  // Score sentences by information density
  const highYieldWords = [
    'defined', 'refers', 'called', 'architecture', 'algorithm', 'system',
    'function', 'process', 'memory', 'component', 'primary', 'structure',
    'principle', 'mechanism', 'classification', 'performance', 'objective', 'allocates'
  ];

  const scored = rawSentences.map((sentence, idx) => {
    let score = 0;
    const lower = sentence.toLowerCase();

    for (const kw of highYieldWords) {
      if (lower.includes(kw)) score += 3;
    }

    // Capitalized words (proper nouns, technical acronyms)
    const capMatches = sentence.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g) || [];
    score += Math.min(5, capMatches.length);

    // Prefer sentences of ideal length (60 - 180 chars)
    if (sentence.length >= 60 && sentence.length <= 180) score += 2;

    return { sentence, idx, score };
  });

  // Pick sentences distributed across the document: chunk into 4 or 5 buckets
  const bucketCount = Math.min(4, Math.max(3, Math.floor(rawSentences.length / 3)));
  const bucketSize = Math.floor(rawSentences.length / bucketCount);
  const chosen: string[] = [];
  const chosenNorm = new Set<string>();

  for (let b = 0; b < bucketCount; b++) {
    const start = b * bucketSize;
    const end = b === bucketCount - 1 ? rawSentences.length : (b + 1) * bucketSize;
    const bucketItems = scored.slice(start, end).sort((a, b) => b.score - a.score);

    for (const item of bucketItems) {
      const norm = item.sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!chosenNorm.has(norm)) {
        chosenNorm.add(norm);
        chosen.push(item.sentence);
        break;
      }
    }
  }

  // Ensure 3 to 5 sentences
  if (chosen.length < 3 && rawSentences.length >= 3) {
    for (const s of rawSentences) {
      const norm = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!chosenNorm.has(norm)) {
        chosenNorm.add(norm);
        chosen.push(s);
        if (chosen.length >= 3) break;
      }
    }
  }

  return chosen.slice(0, 5);
}

// =========================================================================
// 5. KEY TERMS & DEFINITIONS (Strict Patterns Only, Max 15, No Duplicates)
// =========================================================================
export function extractKeyTerms(text: string): KeyTerm[] {
  const terms: KeyTerm[] = [];
  const seen = new Set<string>();

  const patterns = [
    // 1. "X is defined as Y"
    /\b([A-Z][A-Za-z0-9 \-]{2,40}?)\s+is\s+defined\s+as\s+([^.?!;\n]+[.?!])/g,
    // 2. "X is called Y" or "X is known as Y"
    /\b([A-Z][A-Za-z0-9 \-]{2,40}?)\s+is\s+(?:called|known\s+as)\s+([^.?!;\n]+[.?!])/g,
    // 3. "X means Y"
    /\b([A-Z][A-Za-z0-9 \-]{2,40}?)\s+means\s+([^.?!;\n]+[.?!])/g,
    // 4. "X refers to Y"
    /\b([A-Z][A-Za-z0-9 \-]{2,40}?)\s+refers\s+to\s+([^.?!;\n]+[.?!])/g,
    // 5. "Definition: X - Y" or "Definition of X: Y"
    /(?:Definition\s*[:\-–]|Definition\s+of\s+([A-Za-z0-9 \-]{2,40})[:\-–])\s*([A-Z][A-Za-z0-9 \-]{2,40})?[:\-–]?\s*([^.?!;\n]+[.?!])/gi
  ];

  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      let rawTerm = (match[1] || match[2] || '').trim();
      let rawDef = (match[3] || match[2] || match[1] || '').trim();

      // Clean term
      rawTerm = rawTerm.replace(/^(The\s+|A\s+|An\s+)/i, '').trim();
      rawTerm = rawTerm.replace(/[:\-–]$/, '').trim();

      // Skip invalid terms
      if (/^(Step\s+\d+|Fig|Figure|Note|Example|Table)\b/i.test(rawTerm)) continue;

      // Clean definition
      rawDef = rawDef.replace(/\s+/g, ' ').trim();
      if (!/[.?!]$/.test(rawDef)) rawDef += '.';
      rawDef = rawDef.charAt(0).toUpperCase() + rawDef.slice(1);

      // Validation
      if (rawTerm.length < 3 || rawTerm.length > 50) continue;
      if (rawDef.length < 15 || rawDef.length > 280) continue;
      if (/^(It|This|These|That|They|There|Here)\b/i.test(rawTerm)) continue;

      const norm = rawTerm.toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        terms.push({ term: rawTerm, definition: rawDef });
        if (terms.length >= 15) return terms;
      }
    }
  }

  // Also check lines formatted like "Operating System: An interface between..."
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const colonMatch = line.match(/^([A-Z][A-Za-z0-9 \-]{2,35}):\s+([A-Z][^.?!]+[.?!])/);
    if (colonMatch) {
      const t = colonMatch[1].replace(/^(The\s+|A\s+|An\s+)/i, '').trim();
      if (/^(Step\s+\d+|Fig|Figure|Note|Example|Table)\b/i.test(t)) continue;

      let d = colonMatch[2].replace(/\s+/g, ' ').trim();
      if (!/[.?!]$/.test(d)) d += '.';

      if (t.length >= 3 && t.length <= 40 && d.length >= 20 && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        terms.push({ term: t, definition: d });
        if (terms.length >= 15) return terms;
      }
    }
  }

  return terms;
}

// =========================================================================
// 6. FORMULAS & ALGORITHMS (Separated)
// =========================================================================
export function extractFormulasAndAlgorithms(text: string): FormulasAndAlgorithms {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const formulas: string[] = [];
  const algorithms: string[] = [];
  const seenFormulas = new Set<string>();
  const seenAlgos = new Set<string>();

  // Regex patterns for formulas: mathematical symbols and relations
  const formulaRegex = /([=≈≤≥≠±×÷∑∫√Δσμπαβ]\s*[^a-zA-Z\s]{0,2}|O\([1nNlog\s\+\*]+\)|\b[A-Za-z]\s*=\s*[A-Za-z0-9\(\)\/\*\+\-\^\_]+)/;

  for (const line of lines) {
    if (line.length < 5 || line.length > 180) continue;

    // Check for Algorithm steps
    if (/^(Step\s+\d+:?|\d+\.\s*(?:Initialize|Set|For|While|Repeat|If|Else|Compute|Return|Print|Input|Output)\b)/i.test(line)) {
      const norm = line.toLowerCase();
      if (!seenAlgos.has(norm)) {
        seenAlgos.add(norm);
        algorithms.push(line);
      }
      continue;
    }

    // Check for mathematical equations
    if (formulaRegex.test(line) && !line.startsWith('http') && !line.includes('---')) {
      const words = line.split(/\s+/);
      // Ensure it's not a normal sentence with just a single '=' sign
      const hasMathChars = /[=≈≤≥≠±×÷∑∫√Δσμπαβ\/\^\_]/.test(line);
      if (hasMathChars && words.length <= 15) {
        const norm = line.toLowerCase();
        if (!seenFormulas.has(norm)) {
          seenFormulas.add(norm);
          formulas.push(line);
        }
      }
    }
  }

  return {
    formulas: formulas.slice(0, 10),
    algorithms: algorithms.slice(0, 12)
  };
}

// =========================================================================
// 7. PRACTICE QUESTIONS GENERATOR (Templates, Complete Sentences, Suggested Marks)
// =========================================================================
export function generatePracticeQuestions(
  headings: SectionHeading[],
  keyTerms: KeyTerm[],
  formulasAndAlgos: FormulasAndAlgorithms
): PracticeQuestionItem[] {
  const questions: PracticeQuestionItem[] = [];
  const seenText = new Set<string>();

  const addQ = (qText: string, marks: 2 | 5 | 10, type: PracticeQuestionItem['type'], source?: string) => {
    // Quality check: must be a complete sentence with >= 5 words
    const trimmed = qText.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 5) return;
    if (!/[.?]$/.test(trimmed)) return;

    const norm = trimmed.toLowerCase();
    if (!seenText.has(norm)) {
      seenText.add(norm);
      questions.push({
        id: `pq-${Date.now().toString(36)}-${questions.length + 1}`,
        question: trimmed,
        marks,
        type,
        sourceSnippet: source
      });
    }
  };

  // 1. "Define X" (from Key Terms) -> suggested marks: 2
  for (const kt of keyTerms.slice(0, 4)) {
    addQ(`Define ${kt.term} and state its primary role.`, 2, 'define', kt.term);
  }

  // 2. "Explain X with an example" (from Headings) -> suggested marks: 5
  for (const h of headings.slice(0, 4)) {
    addQ(`Explain the concept of ${h.cleanTitle} with a suitable example.`, 5, 'explain', h.title);
  }

  // 3. "Differentiate A and B" (when at least two key terms exist) -> suggested marks: 5
  if (keyTerms.length >= 2) {
    const termA = keyTerms[0].term;
    const termB = keyTerms[1].term;
    addQ(`Differentiate between ${termA} and ${termB} with key comparison parameters.`, 5, 'differentiate');
  }

  // 4. "Derive / State formula for X" (from Formulas) -> suggested marks: 10
  if (formulasAndAlgos.formulas.length > 0) {
    const rawF = formulasAndAlgos.formulas[0];
    const cleanFormulaName = rawF.replace(/[=].*$/, '').trim() || 'the governing equation';
    const headingForFormula = headings.find(h => /time|scheduling|formula|calculation|cost|metric/i.test(h.cleanTitle));
    const formulaSubject = cleanFormulaName.length >= 3 && cleanFormulaName.length <= 35 ? cleanFormulaName : (headingForFormula ? headingForFormula.cleanTitle : 'the governing equation');
    addQ(`Derive the mathematical expression for ${formulaSubject} and discuss its significance.`, 10, 'derive', rawF);
  }

  // 5. "Write the steps of X" (from Algorithms) -> suggested marks: 10
  if (formulasAndAlgos.algorithms.length > 0) {
    const headingForAlgo = headings.find(h => /algorithm|scheduling|sort|search|method|process|technique/i.test(h.cleanTitle));
    const firstAlgo = formulasAndAlgos.algorithms[0];
    const fallbackName = firstAlgo.replace(/^(Step\s+\d+:?|\d+\.\s*)/i, '').split(/[:\-–]/)[0]?.trim() || 'the algorithm';
    const algoSubject = headingForAlgo ? headingForAlgo.cleanTitle : fallbackName;
    addQ(`Write the step-by-step algorithm for ${algoSubject} and analyze its working.`, 10, 'algorithm', firstAlgo);
  }

  // Fallback if notes had very sparse structure
  if (questions.length === 0) {
    addQ(`Define the core technical concepts and governing principles covered in this unit.`, 2, 'define');
    addQ(`Explain the primary execution mechanisms and working architecture with an example.`, 5, 'explain');
    addQ(`Derive the governing mathematical expressions and state all boundary conditions.`, 10, 'derive');
  }

  return questions;
}

// =========================================================================
// 8. TESSERACT.JS OCR LOADER & RUNNER (Images and Scanned PDFs)
// =========================================================================
let tesseractPromise: Promise<any> | null = null;

export function loadTesseractFromCdn(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).Tesseract) {
    return Promise.resolve((window as any).Tesseract);
  }
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('tesseract-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).Tesseract));
      existing.addEventListener('error', () => reject(new Error('Tesseract script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'tesseract-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      resolve((window as any).Tesseract);
    };
    script.onerror = (e) => {
      tesseractPromise = null;
      reject(new Error('Failed to load Tesseract.js from cdnjs. Check your internet connection.'));
    };
    document.head.appendChild(script);
  });

  return tesseractPromise;
}

export async function runOcrOnImage(
  imageSource: File | Blob | string | HTMLCanvasElement,
  onProgress: (progressPercent: number, status: string) => void
): Promise<string> {
  const Tesseract = await loadTesseractFromCdn();
  onProgress(10, 'Initializing OCR engine...');

  const result = await Tesseract.recognize(imageSource, 'eng', {
    logger: (m: any) => {
      if (m && m.status === 'recognizing text') {
        const pct = Math.min(99, Math.max(15, Math.round(m.progress * 100)));
        onProgress(pct, `Scanning image text (${pct}%)...`);
      } else if (m && m.status) {
        onProgress(20, `OCR: ${m.status}...`);
      }
    }
  });

  onProgress(100, 'OCR scanning complete!');
  return result?.data?.text || '';
}

export async function runOcrOnScannedPdf(
  file: File,
  onProgress: (progressPercent: number, status: string) => void
): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/cmaps/`,
    cMapPacked: true,
  });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, 10); // Process up to 10 pages for browser performance
  let combinedOcrText = '';

  const Tesseract = await loadTesseractFromCdn();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pageProgressBase = Math.round(((pageNum - 1) / numPages) * 100);
    onProgress(pageProgressBase, `Rendering page ${pageNum} of ${numPages} for OCR...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;

    onProgress(pageProgressBase + 5, `Running OCR on page ${pageNum} of ${numPages}...`);

    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: (m: any) => {
        if (m && m.status === 'recognizing text') {
          const pagePct = Math.round(m.progress * (100 / numPages));
          const totalPct = Math.min(99, pageProgressBase + pagePct);
          onProgress(totalPct, `Scanning page ${pageNum} (${Math.round(m.progress * 100)}%)...`);
        }
      }
    });

    const pageText = result?.data?.text || '';
    combinedOcrText += `\n\n` + pageText;
  }

  onProgress(100, 'OCR scanning complete for all pages!');
  return combinedOcrText;
}

// =========================================================================
// 9. HIGH-LEVEL PIPELINE: ANALYZE RAW TEXT
// =========================================================================
export function analyzeExtractedNotes(rawText: string): NotesAnalysisResult {
  const cleanedText = cleanExtractedText(rawText);
  const quality = assessTextQuality(cleanedText);

  if (!quality.isReliable) {
    return {
      rawText,
      cleanedText,
      quality,
      headings: [],
      summary: [],
      keyTerms: [],
      formulasAndAlgorithms: { formulas: [], algorithms: [] },
      practiceQuestions: []
    };
  }

  const headings = detectStructureAndHeadings(cleanedText);
  const summary = generateInformativeSummary(cleanedText);
  const keyTerms = extractKeyTerms(cleanedText);
  const formulasAndAlgorithms = extractFormulasAndAlgorithms(cleanedText);
  const practiceQuestions = generatePracticeQuestions(headings, keyTerms, formulasAndAlgorithms);

  return {
    rawText,
    cleanedText,
    quality,
    headings,
    summary,
    keyTerms,
    formulasAndAlgorithms,
    practiceQuestions
  };
}
