// PyqRanker In-Page Study Companion & Content Script (Manifest V3 - Obsidian Titanium & Cyber Emerald Edition)
(function() {
  if (window.__PYQ_RANKER_INJECTED__) return;
  window.__PYQ_RANKER_INJECTED__ = true;

  // State
  let currentQuestions = [];
  let currentSubjects = [];
  let activeSubjectId = 'os';
  let activeTheme = 'dark';
  let matchedPyqs = [];
  let isSidebarOpen = false;
  let expandedExamPoints = {};
  let expandedPractice = {};
  let lastEvaluations = {};

  // Initialize data from chrome.storage or fallback to global dataset from data/pyqData.js
  async function initData() {
    try {
      const stored = await chrome.storage.local.get([
        'pyq_questions', 
        'pyq_subjects', 
        'pyq_active_subject', 
        'pyq_theme'
      ]);

      if (stored.pyq_questions && Array.isArray(stored.pyq_questions) && stored.pyq_questions.length > 0) {
        currentQuestions = stored.pyq_questions;
      } else if (typeof INITIAL_QUESTIONS !== 'undefined') {
        currentQuestions = INITIAL_QUESTIONS;
        chrome.storage.local.set({ pyq_questions: INITIAL_QUESTIONS });
      }

      if (stored.pyq_subjects && Array.isArray(stored.pyq_subjects)) {
        currentSubjects = stored.pyq_subjects;
      } else if (typeof INITIAL_SUBJECTS !== 'undefined') {
        currentSubjects = INITIAL_SUBJECTS;
      }

      if (stored.pyq_active_subject) {
        activeSubjectId = stored.pyq_active_subject;
      }

      if (stored.pyq_theme) {
        activeTheme = stored.pyq_theme;
      }
    } catch (e) {
      console.warn('[PyqRanker] Storage read fallback:', e);
      if (typeof INITIAL_QUESTIONS !== 'undefined') currentQuestions = INITIAL_QUESTIONS;
      if (typeof INITIAL_SUBJECTS !== 'undefined') currentSubjects = INITIAL_SUBJECTS;
    }

    // Run Initial Scan on current page
    scanPageContent();
  }

  // ==========================================
  // CONTENT SIMILARITY SCANNER
  // ==========================================
  const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
    'can\'t', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'don\'t', 'down', 'during', 'each', 'few',
    'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
    'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let\'s', 'me', 'more',
    'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
    'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
    'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
    'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would', 'you', 'your', 'yours', 'yourself'
  ]);

  function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w));
  }

  function extractPageText() {
    const title = document.title || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.innerText || '')
      .join(' ');
    const paragraphs = Array.from(document.querySelectorAll('article p, main p, p'))
      .slice(0, 15)
      .map(p => p.innerText || '')
      .join(' ');

    return `${title} ${title} ${headings} ${headings} ${metaDesc} ${paragraphs}`;
  }

  function scoreQuestionAgainstPage(question, pageTokens, pageTokenFreq) {
    const qTokens = tokenize(question.question);
    const kwTokens = (question.expectedKeywords || []).flatMap(kw => tokenize(kw));
    const unitTokens = tokenize(question.unitTitle || '');

    let matchCount = 0;
    let keywordHits = 0;

    for (const token of qTokens) {
      if (pageTokenFreq[token]) {
        matchCount += Math.min(pageTokenFreq[token], 3);
      }
    }

    for (const token of kwTokens) {
      if (pageTokenFreq[token]) {
        keywordHits += Math.min(pageTokenFreq[token], 4);
      }
    }

    for (const token of unitTokens) {
      if (pageTokenFreq[token]) {
        matchCount += 1.5;
      }
    }

    return (matchCount * 1.5) + (keywordHits * 3.5);
  }

  function scanPageContent(overrideText = null) {
    const textToScan = overrideText || extractPageText();
    const tokens = tokenize(textToScan);
    
    const tokenFreq = {};
    for (const t of tokens) {
      tokenFreq[t] = (tokenFreq[t] || 0) + 1;
    }

    const scored = currentQuestions.map(q => {
      const score = scoreQuestionAgainstPage(q, tokens, tokenFreq);
      return { question: q, score };
    });

    const filtered = scored
      .filter(item => item.score > 4.5 || (item.question.isHighProbability && item.score > 2.0))
      .sort((a, b) => b.score - a.score);

    matchedPyqs = filtered.map(item => item.question);

    if (matchedPyqs.length === 0) {
      matchedPyqs = currentQuestions
        .filter(q => q.subjectId === activeSubjectId)
        .slice(0, 5);
    }

    updateLauncherPill();
    if (isSidebarOpen) {
      renderSidebarContent();
    }
  }

  // ==========================================
  // RUBRIC GRADER IN EXTENSION
  // ==========================================
  function evaluateInPageAnswer(question, answerText) {
    const trimmed = (answerText || '').trim();
    if (!trimmed) {
      return { score: 0, matchedKeywords: [], missingKeywords: [...(question.expectedKeywords || [])], wordCount: 0 };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lower = trimmed.toLowerCase();

    const matchedKeywords = [];
    const missingKeywords = [];

    for (const kw of (question.expectedKeywords || [])) {
      const clean = kw.toLowerCase().trim();
      if (lower.includes(clean)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    const kwRatio = question.expectedKeywords.length > 0 
      ? matchedKeywords.length / question.expectedKeywords.length 
      : 1;
    
    let score = Math.round((kwRatio * 7.0 + Math.min(2.0, (wordCount / 40) * 2.0) + (/[•\-*\d]/.test(trimmed) ? 1.0 : 0)) * 10) / 10;
    score = Math.min(10, score);

    return {
      score,
      matchedKeywords,
      missingKeywords,
      wordCount
    };
  }

  // ==========================================
  // SHADOW DOM INJECTION & ISOLATION
  // ==========================================
  const hostElement = document.createElement('div');
  hostElement.id = 'pyq-ranker-shadow-host';
  hostElement.style.cssText = 'all: initial; position: absolute; z-index: 2147483647;';
  document.body.appendChild(hostElement);

  const shadow = hostElement.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* Floating Launcher Pill */
    .pyq-launcher-pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 9999px;
      background: linear-gradient(135deg, #00E599 0%, #059669 100%);
      color: #06090E;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 25px -5px rgba(0, 229, 153, 0.4), 0 8px 10px -6px rgba(0, 229, 153, 0.2);
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }
    .pyq-launcher-pill:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 15px 30px -5px rgba(0, 229, 153, 0.6);
    }
    .pyq-launcher-pill:active {
      transform: scale(0.97);
    }
    .pyq-flame-icon {
      display: inline-block;
      animation: flamePulse 1.8s ease-in-out infinite;
    }
    @keyframes flamePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    /* Overlay */
    .pyq-sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(6, 9, 14, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2147483646;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .pyq-sidebar-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Sidebar */
    .pyq-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 450px;
      max-width: 95vw;
      z-index: 2147483647;
      transform: translateX(105%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 35px rgba(0, 0, 0, 0.4);
    }
    .pyq-sidebar.open {
      transform: translateX(0);
    }

    /* Night Mode (Default) */
    .theme-dark {
      background: #06090E;
      color: #F8FAFC;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
    }
    .theme-dark .pyq-card {
      background: rgba(15, 23, 34, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #F8FAFC;
    }
    .theme-dark .pyq-card:hover {
      border-color: rgba(0, 229, 153, 0.4);
    }
    .theme-dark .pyq-header {
      background: rgba(6, 9, 14, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .theme-dark .pyq-subtext {
      color: #94A3B8;
    }
    .theme-dark .pyq-chip {
      background: rgba(0, 229, 153, 0.12);
      color: #00E599;
      border: 1px solid rgba(0, 229, 153, 0.3);
    }
    .theme-dark .pyq-textarea {
      background: #0B111A;
      color: #F8FAFC;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .theme-dark .pyq-exam-points-box {
      background: rgba(0, 229, 153, 0.05);
      border: 1px solid rgba(0, 229, 153, 0.2);
    }
    .theme-dark .pyq-diagram-tip-box {
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid #38BDF8;
    }

    /* Day Mode */
    .theme-light {
      background: #F3F6FA;
      color: #090D16;
      border-left: 1px solid #E2E8F0;
    }
    .theme-light .pyq-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      color: #090D16;
    }
    .theme-light .pyq-card:hover {
      border-color: #059669;
    }
    .theme-light .pyq-header {
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid #E2E8F0;
    }
    .theme-light .pyq-subtext {
      color: #475569;
    }
    .theme-light .pyq-chip {
      background: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
    }
    .theme-light .pyq-textarea {
      background: #F8FAFC;
      color: #090D16;
      border: 1px solid #CBD5E1;
    }
    .theme-light .pyq-exam-points-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
    }
    .theme-light .pyq-diagram-tip-box {
      background: #F0F9FF;
      border-left: 3px solid #0284C7;
    }

    /* Header */
    .pyq-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(12px);
      flex-shrink: 0;
    }
    .pyq-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pyq-brand-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: rgba(0, 229, 153, 0.15);
      border: 1px solid rgba(0, 229, 153, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00E599;
      font-weight: 800;
    }
    .pyq-brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .pyq-brand-title span {
      color: #00E599;
    }
    .pyq-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pyq-btn-icon {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 8px;
      color: inherit;
      opacity: 0.8;
      font-size: 14px;
      transition: all 0.2s;
    }
    .pyq-btn-icon:hover {
      opacity: 1;
      background: rgba(148, 163, 184, 0.15);
    }

    /* Toolbar */
    .pyq-toolbar {
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      font-size: 11px;
      font-weight: 600;
    }
    .pyq-btn-tool {
      padding: 6px 12px;
      border-radius: 6px;
      background: #00E599;
      color: #06090E;
      border: none;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .pyq-btn-tool:hover {
      background: #34D399;
      transform: translateY(-1px);
    }
    .pyq-btn-secondary {
      background: transparent;
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: inherit;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
    }
    .pyq-btn-secondary:hover {
      border-color: #00E599;
      color: #00E599;
    }

    /* Body List */
    .pyq-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Cards */
    .pyq-card {
      border-radius: 12px;
      padding: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .pyq-card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
    }
    .pyq-badge-marks {
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.15);
      color: #38BDF8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .pyq-badge-repeat {
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .pyq-qtext {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.45;
      margin-bottom: 12px;
    }

    /* Card Action Bar */
    .pyq-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }
    .pyq-btn-action {
      flex: 1;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .pyq-btn-action-primary {
      background: rgba(0, 229, 153, 0.12);
      border: 1px solid rgba(0, 229, 153, 0.3);
      color: #00E599;
    }
    .pyq-btn-action-primary:hover {
      background: #00E599;
      color: #06090E;
    }
    .pyq-btn-action-secondary {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38BDF8;
    }
    .pyq-btn-action-secondary:hover {
      background: #38BDF8;
      color: #06090E;
    }

    /* Exam Points Box */
    .pyq-exam-points-box {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
    }
    .pyq-bullet-item {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .pyq-bullet-dot {
      color: #00E599;
      font-weight: 800;
    }
    .pyq-diagram-tip-box {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 11px;
    }

    /* Rubric Chips */
    .pyq-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    .pyq-chip {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Recall Box */
    .pyq-recall-box {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.15);
    }
    .pyq-textarea {
      width: 100%;
      min-height: 70px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 12px;
      outline: none;
      resize: vertical;
      margin-bottom: 8px;
    }
    .pyq-textarea:focus {
      border-color: #00E599;
    }
    .pyq-score-banner {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .score-green { background: rgba(0, 229, 153, 0.15); color: #00E599; border: 1px solid rgba(0, 229, 153, 0.3); }
    .score-amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
    .score-red { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }

    /* Footer */
    .pyq-footer {
      padding: 12px 20px;
      border-top: 1px solid rgba(148, 163, 184, 0.15);
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
  `;
  shadow.appendChild(styleTag);

  // Floating Launcher Pill Button
  const launcherPill = document.createElement('div');
  launcherPill.className = 'pyq-launcher-pill';
  launcherPill.innerHTML = `
    <span class="pyq-flame-icon">🔥</span>
    <span id="pyq-pill-text">0 PYQs Match This Page</span>
  `;
  launcherPill.addEventListener('click', toggleSidebar);
  shadow.appendChild(launcherPill);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'pyq-sidebar-overlay';
  overlay.addEventListener('click', toggleSidebar);
  shadow.appendChild(overlay);

  // Slide-over Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = `pyq-sidebar theme-${activeTheme}`;
  shadow.appendChild(sidebar);

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
      overlay.classList.add('open');
      sidebar.classList.add('open');
      renderSidebarContent();
    } else {
      overlay.classList.remove('open');
      sidebar.classList.remove('open');
    }
  }

  function updateLauncherPill() {
    const textSpan = shadow.getElementById('pyq-pill-text');
    if (textSpan) {
      const count = matchedPyqs.length;
      textSpan.textContent = count > 0 
        ? `${count} PYQs Match This Page` 
        : `PYQ Matcher (Alt+Q)`;
    }
  }

  function renderSidebarContent() {
    sidebar.className = `pyq-sidebar theme-${activeTheme}`;
    
    sidebar.innerHTML = `
      <!-- Header -->
      <div class="pyq-header">
        <div class="pyq-brand">
          <div class="pyq-brand-icon">⚡</div>
          <div>
            <div class="pyq-brand-title">Pyq<span>Ranker</span></div>
            <div class="pyq-subtext" style="font-size: 10px;">Exam Companion & Recall</div>
          </div>
        </div>

        <div class="pyq-header-actions">
          <button class="pyq-btn-icon" id="pyq-theme-toggle" title="Toggle Day/Night Theme">
            ${activeTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button class="pyq-btn-icon" id="pyq-close-btn" title="Close Sidebar">
            ✕
          </button>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="pyq-toolbar">
        <div>
          <span class="pyq-subtext">Subject:</span>
          <strong>${activeSubjectId.toUpperCase()}</strong>
          <span class="pyq-subtext">(${matchedPyqs.length} matched)</span>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="pyq-btn-secondary" id="pyq-scan-selection" title="Scan Highlighted Selection">
            🔍 Scan Selection
          </button>
          <button class="pyq-btn-tool" id="pyq-open-dashboard" title="Open Web Dashboard">
            🚀 Open App
          </button>
        </div>
      </div>

      <!-- Matched Questions List -->
      <div class="pyq-body" id="pyq-body-list">
        ${matchedPyqs.length === 0 ? `
          <div style="text-align: center; padding: 40px 10px;" class="pyq-subtext">
            <div>🔍 No relevant past questions found for this specific page.</div>
            <div style="font-size: 11px; margin-top: 8px;">Try highlighting key study text or switch subjects.</div>
          </div>
        ` : matchedPyqs.map(q => {
          const evalResult = lastEvaluations[q.id];
          const isPointsOpen = !!expandedExamPoints[q.id];
          const isPracticeOpen = !!expandedPractice[q.id];

          return `
            <div class="pyq-card" data-qid="${q.id}">
              <div class="pyq-card-meta">
                <span class="pyq-badge-marks">${q.marks} Marks • Unit ${q.unit}</span>
                ${q.repeatCount >= 3 ? `<span class="pyq-badge-repeat">🔥 Asked ${q.repeatCount}x (${q.yearsAsked ? q.yearsAsked.slice(-3).join(', ') : 'Recent'})</span>` : `<span class="pyq-subtext">Asked ${q.repeatCount}x</span>`}
              </div>

              <div class="pyq-qtext">${q.question}</div>

              <!-- Action Buttons -->
              <div class="pyq-card-actions">
                <button class="pyq-btn-action pyq-btn-action-primary" data-action="toggle-exam-points" data-qid="${q.id}">
                  📖 ${isPointsOpen ? 'Hide Points' : 'Show Exam Points'}
                </button>
                <button class="pyq-btn-action pyq-btn-action-secondary" data-action="toggle-practice" data-qid="${q.id}">
                  ✍️ ${isPracticeOpen ? 'Close Test' : 'Quick Practice'}
                </button>
              </div>

              <!-- Model Exam Answer Points -->
              ${isPointsOpen ? `
                <div class="pyq-exam-points-box">
                  <div style="font-weight: 700; font-size: 11px; margin-bottom: 8px; color: #00E599;">
                    ✓ MODEL EXAM POINTS (MEMORIZE THESE):
                  </div>
                  ${(q.bullets && q.bullets.length > 0) ? q.bullets.map(b => `
                    <div class="pyq-bullet-item">
                      <span class="pyq-bullet-dot">•</span>
                      <span>${b}</span>
                    </div>
                  `).join('') : `
                    <div class="pyq-bullet-item">
                      <span class="pyq-bullet-dot">•</span>
                      <span>${q.modelAnswerSummary || 'Define core algorithm and provide structural diagram.'}</span>
                    </div>
                  `}

                  ${q.diagramFormulaTip ? `
                    <div class="pyq-diagram-tip-box">
                      <strong>📐 Must-Draw Diagram / Formula:</strong> ${q.diagramFormulaTip}
                    </div>
                  ` : ''}

                  <div class="pyq-chips-wrap">
                    ${(q.expectedKeywords || []).map(k => `<span class="pyq-chip">${k}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Active Recall Practice Box -->
              ${isPracticeOpen ? `
                <div class="pyq-recall-box">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px;">
                    <span class="pyq-subtext">Test memory without looking:</span>
                    <button class="pyq-btn-secondary" style="padding: 2px 6px; font-size: 10px;" data-action="pin-highlight" data-qid="${q.id}">
                      📌 Attach Selected Text
                    </button>
                  </div>

                  <textarea class="pyq-textarea" placeholder="Type key points from memory..." id="textarea-${q.id}">${q.lastAttemptAnswer || ''}</textarea>

                  <div style="display: flex; justify-content: flex-end;">
                    <button class="pyq-btn-tool" data-action="check-rubric" data-qid="${q.id}">
                      ✓ Check Score
                    </button>
                  </div>

                  ${evalResult ? `
                    <div class="pyq-score-banner ${evalResult.score >= 7.5 ? 'score-green' : evalResult.score >= 5 ? 'score-amber' : 'score-red'}">
                      <span>Score: ${evalResult.score}/10 (${evalResult.wordCount} words)</span>
                      <span>${evalResult.matchedKeywords.length}/${q.expectedKeywords.length} Keywords Hit</span>
                    </div>
                    ${evalResult.missingKeywords.length > 0 ? `
                      <div style="font-size: 11px; margin-top: 6px;" class="pyq-subtext">
                        Missing: <span style="color: #F59E0B;">${evalResult.missingKeywords.slice(0, 3).join(', ')}</span>
                      </div>
                    ` : ''}
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer -->
      <div class="pyq-footer">
        <span class="pyq-subtext">Shortcut: <code style="font-weight: 700;">Alt + Q</code></span>
        <span style="color: #00E599; font-weight: 700;">● Cyber Sync Active</span>
      </div>
    `;

    // Attach Event Listeners
    shadow.getElementById('pyq-close-btn')?.addEventListener('click', toggleSidebar);
    shadow.getElementById('pyq-theme-toggle')?.addEventListener('click', () => {
      activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
      chrome.storage.local.set({ pyq_theme: activeTheme });
      renderSidebarContent();
    });

    shadow.getElementById('pyq-open-dashboard')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_WEB_DASHBOARD', url: 'https://anything14907-byte.github.io/PyqRanker/' });
    });

    shadow.getElementById('pyq-scan-selection')?.addEventListener('click', () => {
      const selected = window.getSelection()?.toString() || '';
      if (selected.trim().length > 3) {
        scanPageContent(selected);
      } else {
        alert('Please highlight some text on this webpage first to scan!');
      }
    });

    // Toggle Exam Points
    shadow.querySelectorAll('[data-action="toggle-exam-points"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-qid');
        expandedExamPoints[qid] = !expandedExamPoints[qid];
        renderSidebarContent();
      });
    });

    // Toggle Practice
    shadow.querySelectorAll('[data-action="toggle-practice"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-qid');
        expandedPractice[qid] = !expandedPractice[qid];
        renderSidebarContent();
      });
    });

    // Check Rubric
    shadow.querySelectorAll('[data-action="check-rubric"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-qid');
        const textarea = shadow.getElementById(`textarea-${qid}`);
        const q = currentQuestions.find(item => item.id === qid);
        if (q && textarea) {
          const evalResult = evaluateInPageAnswer(q, textarea.value);
          lastEvaluations[qid] = evalResult;
          q.lastAttemptAnswer = textarea.value;
          q.lastAttemptScore = evalResult.score;
          chrome.storage.local.set({ pyq_questions: currentQuestions });
          renderSidebarContent();
        }
      });
    });

    // Pin Highlight
    shadow.querySelectorAll('[data-action="pin-highlight"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-qid');
        const selected = window.getSelection()?.toString() || '';
        if (!selected.trim()) {
          alert('Highlight some text on this webpage first to pin as a study note!');
          return;
        }

        const q = currentQuestions.find(item => item.id === qid);
        if (q) {
          q.userNotes = q.userNotes ? `${q.userNotes}\n\n[Web Clip]: ${selected}` : `[Web Clip]: ${selected}`;
          chrome.storage.local.set({ pyq_questions: currentQuestions });
          window.postMessage({ type: 'PYQ_PIN_NOTE', payload: { questionId: qid, note: selected } }, '*');
          alert(`Pinned text snippet to "${q.question.slice(0, 30)}..."!`);
        }
      });
    });
  }

  // ==========================================
  // SYNC BRIDGE WITH WEB APP
  // ==========================================
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PYQ_SYNC_DATA') {
      const payload = event.data.payload;
      if (payload && Array.isArray(payload.questions)) {
        currentQuestions = payload.questions;
        if (Array.isArray(payload.subjects)) {
          currentSubjects = payload.subjects;
        }
        activeSubjectId = payload.activeSubjectId || activeSubjectId;
        activeTheme = payload.theme || activeTheme;

        chrome.storage.local.set({
          pyq_questions: currentQuestions,
          pyq_subjects: currentSubjects,
          pyq_active_subject: activeSubjectId,
          pyq_theme: activeTheme,
          pyq_last_synced: Date.now()
        }, () => {
          window.postMessage({ type: 'PYQ_EXTENSION_ACK', timestamp: Date.now() }, '*');
        });

        scanPageContent();
      }
    }
  });

  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE_SIDEBAR') {
      toggleSidebar();
      sendResponse({ status: 'ok' });
    }
    if (msg.type === 'SCAN_PAGE_AND_OPEN') {
      scanPageContent();
      if (!isSidebarOpen) toggleSidebar();
      sendResponse({ status: 'ok' });
    }
  });

  initData();
})();
