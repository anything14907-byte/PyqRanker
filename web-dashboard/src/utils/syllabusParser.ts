/**
 * Context-Aware Smart Syllabus Parser & Auto-Distributor
 * Accurately parses college/university syllabus paragraphs into clean individual topics
 * using colon sub-list grouping, parentheses protection, and conjunction boundaries.
 */

// Protect parentheses/brackets so commas/colons inside them are not treated as delimiters
function protectParens(text: string): string {
  let result = '';
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      result += ch;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth > 0) depth--;
      result += ch;
    } else if (ch === ',' && depth > 0) {
      result += '___COMMA___';
    } else if (ch === ';' && depth > 0) {
      result += '___SEMICOLON___';
    } else if (ch === ':' && depth > 0) {
      result += '___COLON___';
    } else {
      result += ch;
    }
  }
  return result;
}

// Restore protected characters
function restoreParens(text: string): string {
  return text
    .replace(/___COMMA___/g, ', ')
    .replace(/___SEMICOLON___/g, '; ')
    .replace(/___COLON___/g, ': ');
}

// Clean up numbering prefixes, bullet symbols, unit prefixes, markdown markers, etc.
export function cleanPrefix(str: string): string {
  if (!str) return '';
  let s = str.trim();

  // Strip markdown headers like ### or ##
  s = s.replace(/^#+\s*/, '');

  // Strip markdown bold/italic tags e.g. **Topic** or *Topic*
  s = s.replace(/\*\*/g, '').replace(/__/g, '');

  // Strip Unit/Chapter/Module prefix at the very beginning (e.g. "Unit 1:", "Module-II -", "Chapter 3.")
  s = s.replace(/^(?:Unit|Chapter|Module|Part|Section)\s*[-:]?\s*(?:[0-9]+|[IVXLCDM]+)[\s:.-]*/i, '');

  // Strip bullet points and numbering like: 1., 1), (1), a., a), (a), i., i), •, -, *, etc.
  s = s.replace(/^(?:[\u2022\u25CF\u25AA\u25B6\u2219*-]+|\(?\d+\)?[.:)]|\(?[a-zA-Z]\)?[.:]|\(?[ivxIVX]+\)?[.:])\s*/, '');

  // Strip leading punctuation
  s = s.replace(/^[:;,.–—\s]+/, '');

  // Strip trailing punctuation
  s = s.replace(/[:;,.–—\s]+$/, '');

  // Normalize internal whitespace
  s = s.replace(/\s+/g, ' ');

  return s.trim();
}

// Extract the significant last word or stem for suffix matching
function getTailWord(phrase: string): string {
  if (!phrase) return '';
  const clean = phrase.replace(/___COMMA___|___SEMICOLON___|___COLON___/g, ' ');
  const words = clean.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return '';
  const last = words[words.length - 1];
  // Stem plural to singular
  if (last.endsWith('ies') && last.length > 4) return last.slice(0, -3) + 'y';
  if (last.endsWith('es') && last.length > 3) return last.slice(0, -2);
  if (last.endsWith('s') && !last.endsWith('ss') && last.length > 3) return last.slice(0, -1);
  return last;
}

/**
 * Intelligent context-aware syllabus text parser.
 * Splits a full raw syllabus paragraph into clean individual topics.
 */
export function parseSyllabusText(rawText: string): string[] {
  if (!rawText || typeof rawText !== 'string') return [];

  let text = rawText.trim();
  if (!text) return [];

  // Protect brackets so internal commas/colons/semicolons are not split
  const protectedText = protectParens(text);

  // Split into strong structural chunks:
  // 1. Newlines (\r?\n)
  // 2. Semicolons (;)
  // 3. Bullet symbols (•, ●, ▪, etc.)
  // 4. Sentences: Period followed by space and Capital Letter, but NOT "1. " or "e.g. "
  const rawSegments = protectedText
    .split(/(?:\r?\n|;|[\u2022\u25CF\u25AA\u25B6\u2219]+|(?<=[a-zA-Z]{2,})\.\s+(?=[A-Z\u2022(]))/g)
    .map(s => s.trim())
    .filter(Boolean);

  const topics: string[] = [];

  for (const rawSeg of rawSegments) {
    const seg = cleanPrefix(rawSeg);
    if (!seg) continue;

    // Case 1: No colon in this segment
    if (!seg.includes(':')) {
      const parts = seg.split(',').map(p => cleanPrefix(p)).filter(Boolean);
      for (const p of parts) {
        const restored = cleanPrefix(restoreParens(p));
        if (restored) topics.push(restored);
      }
      continue;
    }

    // Case 2: Contains colon(s)
    const commaParts = seg.split(',').map(p => p.trim()).filter(Boolean);

    let colonHeader = '';
    let subItems: string[] = [];
    let detectedSuffix: string | null = null; // Only set if >= 2 consecutive items share the suffix

    const flushColonTopic = () => {
      if (colonHeader) {
        const fullTopic = subItems.length > 0 
          ? `${colonHeader} ${subItems.join(', ')}`
          : colonHeader;
        const cleaned = cleanPrefix(restoreParens(fullTopic));
        if (cleaned) topics.push(cleaned);
        colonHeader = '';
        subItems = [];
        detectedSuffix = null;
      }
    };

    for (let i = 0; i < commaParts.length; i++) {
      const part = commaParts[i];
      const isNewColon = part.includes(':');

      if (isNewColon) {
        // Flush previous colon group if any
        flushColonTopic();

        const colonIdx = part.indexOf(':');
        colonHeader = part.slice(0, colonIdx + 1).trim();
        const firstItem = part.slice(colonIdx + 1).trim();

        if (firstItem) {
          subItems.push(firstItem);
        }
        continue;
      }

      // If we are currently accumulating sub-items for a colon header:
      if (colonHeader) {
        const cleanPart = cleanPrefix(part);
        const tail = getTailWord(cleanPart);
        const startsWithConjunction = /^(?:and|or)\s+/i.test(cleanPart);

        // Check if a repeated suffix pattern is established or should be established
        if (!detectedSuffix && subItems.length >= 1) {
          const prevTail = getTailWord(subItems[subItems.length - 1]);
          if (prevTail && prevTail === tail && tail.length >= 3) {
            // Established pattern! e.g. "natural resources", "renewable resources" -> "resource"
            detectedSuffix = tail;
          }
        }

        let belongsToColon = false;

        if (detectedSuffix) {
          // Rule B: Repeated category suffix
          if (tail === detectedSuffix || (startsWithConjunction && tail === detectedSuffix)) {
            belongsToColon = true;
          } else {
            // Suffix pattern broken! (e.g. "Soil Erosion" breaks "resource")
            belongsToColon = false;
          }
        } else {
          // No repeating suffix pattern detected.
          // Rule D: Conjunction item is the final item of the sub-list
          if (startsWithConjunction) {
            subItems.push(part);
            flushColonTopic();
            continue;
          }

          // In general syllabus clauses, comma-separated sub-items belong to the colon header
          belongsToColon = true;
        }

        if (belongsToColon) {
          subItems.push(part);
          if (startsWithConjunction) {
            flushColonTopic();
          }
        } else {
          // Suffix pattern broken or list terminated
          flushColonTopic();
          const restored = cleanPrefix(restoreParens(cleanPart));
          if (restored) topics.push(restored);
        }
      } else {
        // Normal comma-separated item
        const restored = cleanPrefix(restoreParens(part));
        if (restored) topics.push(restored);
      }
    }

    // Flush any remaining colon topic
    flushColonTopic();
  }

  // Deduplicate consecutive identical items and filter out empties
  return topics.filter((t, idx, arr) => t && t.length > 0 && (idx === 0 || t !== arr[idx - 1]));
}

/**
 * Merge a topic at index with the topic above it (index - 1).
 */
export function mergeTopicWithAbove(topics: string[], index: number): string[] {
  if (index <= 0 || index >= topics.length) return topics;
  const prev = topics[index - 1];
  const curr = topics[index];

  // Join with comma or appropriate punctuation
  const connector = prev.endsWith(':') ? ' ' : ', ';
  const merged = `${prev}${connector}${curr}`;

  const nextTopics = [...topics];
  nextTopics.splice(index - 1, 2, cleanPrefix(merged));
  return nextTopics;
}

/**
 * Split a topic at its first natural delimiter (comma, colon, or ' and ').
 * If no delimiter exists, splits roughly at word boundary.
 */
export function splitTopicAtDelimiter(topics: string[], index: number): string[] {
  if (index < 0 || index >= topics.length) return topics;
  const target = topics[index];

  // Find natural split points outside parens
  const protectedTarget = protectParens(target);
  let splitIdx = -1;
  let delimiterLength = 1;

  // Prefer comma first
  const commaIdx = protectedTarget.indexOf(',');
  if (commaIdx > 0 && commaIdx < target.length - 2) {
    splitIdx = commaIdx;
    delimiterLength = 1;
  } else {
    // Check colon
    const colonIdx = protectedTarget.indexOf(':');
    if (colonIdx > 0 && colonIdx < target.length - 2) {
      splitIdx = colonIdx;
      delimiterLength = 1;
    } else {
      // Check ' and '
      const andMatch = /\s+(?:and|or)\s+/i.exec(protectedTarget);
      if (andMatch && andMatch.index > 0) {
        splitIdx = andMatch.index;
        delimiterLength = andMatch[0].length;
      }
    }
  }

  if (splitIdx > 0) {
    const part1 = restoreParens(protectedTarget.slice(0, splitIdx));
    const part2 = restoreParens(protectedTarget.slice(splitIdx + delimiterLength));
    const c1 = cleanPrefix(part1);
    const c2 = cleanPrefix(part2);
    if (c1 && c2) {
      const nextTopics = [...topics];
      nextTopics.splice(index, 1, c1, c2);
      return nextTopics;
    }
  }

  // Fallback: split in half by word
  const words = target.split(/\s+/);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    const part1 = cleanPrefix(words.slice(0, mid).join(' '));
    const part2 = cleanPrefix(words.slice(mid).join(' '));
    if (part1 && part2) {
      const nextTopics = [...topics];
      nextTopics.splice(index, 1, part1, part2);
      return nextTopics;
    }
  }

  return topics;
}
