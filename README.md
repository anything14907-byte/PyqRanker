# Study OS: Personal College Exam Command Center & Academic Hub

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg)](https://vitejs.dev/)
[![Design](https://img.shields.io/badge/UI-Aurora%20HUD%20Command%20Center-00F0FF.svg)]()
[![Zero External Keys](https://img.shields.io/badge/Setup-100%25%20Local%20%26%20Self--Contained-emerald.svg)]()

> **Study OS** is an Apple Liquid Glass & Fluid Dynamic **Personal College Exam Command Center & Academic Hub** for university students. It combines real-time ticking exam countdowns for every subject, dynamic custom subject creation/deletion, a smart AI-style study coach, an embedded YouTube lecture vault with side-by-side timestamps & notes, a client-side PDF document vault, 4-card deep concept explainers with 3D memory flashcards, and a high-repeat university PYQ bank with inline active recall testing.

**Live Deployment on GitHub Pages:** [https://anything14907-byte.github.io/PyqRanker/](https://anything14907-byte.github.io/PyqRanker/)

---

## 🎨 Futuristic Holographic Theme: Aurora HUD Command Center

| Mode | Theme Name | Canvas Background | Accents | Card Surfaces |
| :--- | :--- | :--- | :--- | :--- |
| 🌙 **Night Mode** (Default) | **Aurora HUD Command Center** | Deep Cosmic Navy (`#0A0F24`) with animated multi-color radial Aurora mesh and perspective HUD grid | Electric Cyan (`#00F0FF`), Solar Gold (`#FFB800`), Neon Coral (`#FF3366`), Hyper Emerald (`#00F5A0`) | Translucent 3D frosted panels (`rgba(17, 25, 54, 0.72)`) with `backdrop-filter: blur(20px)` and neon hover lift |
| ☀️ **Day Mode** | **Holographic Pearl Studio** | Luminous Pearl Ice (`#EEF4FF`) with soft sky-cyan, amber, and coral glows | Deep Cyber Cyan (`#0284C7`), Cyber Emerald (`#059669`), and Solar Gold (`#D97706`) | Crisp frosted glass white (`rgba(255, 255, 255, 0.90)`) with deep navy text (`#0A0F24`) |

---

## ⚡ Key Feature Tour

### 1. ⏰ Live Exam Countdown Timers (Ticking Every Second)
- **Global "Next Upcoming Exam" Hero HUD Banner:**
  - Displayed at the top of the command center showing the nearest subject exam.
  - Live ticking clock: `DAYS : HOURS : MINUTES : SECONDS` updating every second.
  - Urgency indicators: `🚨 CRITICAL < 3 DAYS`, `⚡ HIGH PRIORITY < 7 DAYS`, `🟢 ON TRACK > 7 DAYS`.
  - 1-Click "Jump Straight into Subject" quick launcher.
- **Per-Subject Countdown Timers & Editable Dates:**
  - Every single subject card features an independent live ticking clock (`DD : HH : MM : SS`).
  - **"⏰ Edit Exam Time"** control: Select any target exam date and time (`<input type="datetime-local">`) to immediately update countdowns, urgency statuses, and daily study plans saved to `localStorage`.

### 2. 🗂️ Dynamic Subject Manager (+Add, Edit & Delete Any Subject)
- Full student control over university courses:
  - **"+ Add New Subject" Modal:** Create subjects with custom name, code, neon accent color (Cyan, Emerald, Gold, Coral, Sky Blue), target exam date & time, and custom syllabus units.
  - **"Edit Subject" & "Delete Subject" Controls:** Edit or delete courses with safe confirmation.

### 3. 🧠 Smart "What To Do Next" Study Coach & Action Plan
- Inside every subject workspace, an intelligent AI-style study coach adapts missions based on time remaining:
  - **Crunch Mode (< 3 Days Remaining):** Recommends focusing exclusively on guaranteed 10-Mark repeated PYQs, reviewing diagram tips, and watching 15-min crash revision videos at 1.5x speed.
  - **Active Practice Mode (3–7 Days Remaining):** Recommends solving unmastered PYQs from memory, testing rubric keywords, and reviewing PDF summaries.
  - **Deep Mastery Mode (> 7 Days Remaining):** Recommends exploring Real-World Analogies and watching comprehensive lecture series.
- **Interactive Checklist:** Pre-populated actionable missions + student can add custom tasks, check them off with animated progress bars, and delete completed items.

### 4. 📚 4-Tab Multimedia Study Hub Per Subject
When clicking into any subject:
1. **Tab 1: 🎯 Smart Action Plan & Deep Concept Explainer:**
   - Real-world 4-Card breakdowns for top university concepts:
     1. 💡 Simple Intuition & Real-World Analogy (e.g. Traffic intersection deadlock, ATM withdrawal ACID).
     2. 📐 Visual Architecture & Step-by-Step Flow (governing formulas & algorithms).
     3. 📝 Exam-Ready 5M / 10M Bullet Points & Rubric Keywords.
     4. 🃏 Interactive 3D Flashcard Flip (click to reveal answer key and test recall).
2. **Tab 2: 🎬 Video Learning Hub (Add & Watch YouTube Lectures):**
   - Embed YouTube lectures directly in the dashboard via URL (`youtube.com/watch?v=...`, `youtu.be/...`).
   - In-app playable video theatre with side-by-side persistent notes & timestamps editor.
   - Tag videos as "Watched ✅" and organize by course.
3. **Tab 3: 📄 PDF & Study Material Vault:**
   - Client-side PDF text extraction (`pdf.js`) with instant **Key Points Summary & Extracted Exam Questions**.
   - Full-text reader modal and custom note creator.
4. **Tab 4: 🔥 High-Repeat PYQ Bank & Answer Tester:**
   - Filter pills (`All`, `🔥 4+ Repeats`, `10M`, `2M & 5M`) and topic search.
   - "+ Add Custom PYQ" button to add questions for any subject.
   - 1-Click "📖 Reveal Model Exam Answer", "✍️ Test Yourself", and "✅ Mark Mastered" with celebratory confetti.

---

## 📁 Repository Structure

```
/Users/yogeshkumar/Creative/
├── index.html                       # Production GitHub Pages entry point (served from /)
├── 404.html                         # SPA fallback router for GitHub Pages
├── .nojekyll                        # Prevents Jekyll from ignoring assets
├── assets/                          # Production compiled bundles
│
├── web-dashboard/                   # React + TypeScript + Vite Source Code
│   ├── vite.config.ts               # Base relative path configuration (base: './')
│   ├── tailwind.config.js           # Aurora HUD Command Center design tokens
│   ├── src/
│   │   ├── App.tsx                  # Root Command Center orchestrator
│   │   ├── index.css                # Multi-color Aurora Mesh, perspective grid & glassmorphism
│   │   ├── types.ts                 # TypeScript schemas for subjects, countdowns, videos, PDFs
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Global exam ticker, 4 main view switchers, theme toggle
│   │   │   ├── CommandCenterOverview.tsx # Next Upcoming Exam Hero HUD & subject cards
│   │   │   ├── SubjectWorkspace.tsx # Top subject banner, live countdown & 4 multimedia tabs
│   │   │   ├── SmartActionPlanTab.tsx # AI Study Coach & 4-card concept explainer
│   │   │   ├── VideoLearningTab.tsx # In-app YouTube player & side-by-side notes
│   │   │   ├── PdfVaultTab.tsx      # Client-side PDF extractor & document library
│   │   │   ├── PyqBankTab.tsx       # Filterable PYQ bank with custom question creator
│   │   │   ├── QuestionCard.tsx     # 3-Bullet model answers & inline recall tester
│   │   │   ├── AddSubjectModal.tsx  # Custom subject creation modal
│   │   │   ├── EditSubjectModal.tsx # Subject & syllabus editor with safe deletion
│   │   │   ├── EditExamDateModal.tsx# Live exam date & countdown picker
│   │   │   ├── AddCustomPyqModal.tsx# Custom past question creator
│   │   │   ├── TopicScannerView.tsx # Real-time topic matcher & PDF paper parser
│   │   │   ├── CheatSheetView.tsx   # Night-before exam revision & 1-click print
│   │   │   └── ExtensionInstallerModal.tsx # In-app browser extension loader guide
│   │   ├── data/
│   │   │   ├── pyqData.ts           # University CS questions (2021-2025)
│   │   │   └── conceptExplainerData.ts # Curated 4-card conceptual breakdowns
│   │   └── utils/
│   │       ├── storageService.ts    # Persistent storage & live countdown calculator
│   │       ├── pdfExtractor.ts      # Client-side PDF text extraction
│   │       └── rubricEvaluator.ts   # Keyword scoring engine
│
├── extension/                       # Manifest V3 Browser Extension
│   ├── manifest.json                # V3 manifest with commands & host permissions
│   ├── content.js                   # Shadow DOM sidebar & in-page topic matcher
│   ├── popup.html                   # Extension popup UI
│   ├── popup.js                     # Popup state & scan actions
│   ├── styles.css                   # Aurora HUD extension styling
│   └── data/
│       └── pyqData.js               # Offline dataset bundle
└── README.md
```

---

## 🚀 Running Locally

```bash
# 1. Clone repository
git clone https://github.com/anything14907-byte/creative.git
cd creative/web-dashboard

# 2. Run local development server
npm run dev

# App runs at: http://localhost:5173
```

---

## 🧩 Browser Extension (`/extension`)

1. Open Chrome/Brave/Edge and navigate to `chrome://extensions`.
2. Enable **"Developer mode"** in the top right.
3. Click **"Load unpacked"** and select the `/extension` folder.
4. Press **`Alt + Q`** on any study webpage (Wikipedia, GeeksforGeeks, MDN) to open your in-page study companion.
