import React, { useState } from 'react';
import { 
  X, 
  Chrome, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Flame, 
  Search, 
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { PYQQuestion } from '../types';

interface ExtensionInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: PYQQuestion[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExtensionInstallerModal: React.FC<ExtensionInstallerModalProps> = ({
  isOpen,
  onClose,
  questions,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'simulator'>('install');
  const [simulatedTopic, setSimulatedTopic] = useState("Operating Systems: Banker's Algorithm & Deadlock Avoidance");
  const [simulatedMatches, setSimulatedMatches] = useState<PYQQuestion[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const copyShortcut = () => {
    navigator.clipboard.writeText('Alt + Q');
    onShowToast('Copied shortcut "Alt + Q" to clipboard!', 'success');
  };

  const copyRepoExtensionLink = () => {
    navigator.clipboard.writeText('https://github.com/anything14907-byte/creative/tree/main/extension');
    onShowToast('Copied extension folder link to clipboard!', 'success');
  };

  const handleSimulateScan = (topicOverride?: string) => {
    const query = topicOverride || simulatedTopic;
    setIsSimulating(true);
    setTimeout(() => {
      const lower = query.toLowerCase();
      const matched = questions.filter(q => {
        const textMatch = q.question.toLowerCase().includes(lower) || lower.split(/\s+/).some(term => term.length > 3 && q.question.toLowerCase().includes(term));
        const kwMatch = q.expectedKeywords.some(kw => lower.includes(kw.toLowerCase()));
        const unitMatch = q.unitTitle.toLowerCase().includes(lower);
        return textMatch || kwMatch || unitMatch;
      });

      setSimulatedMatches(matched.length > 0 ? matched.slice(0, 3) : questions.slice(0, 3));
      setIsSimulating(false);
      onShowToast(`Matched ${matched.length || 3} university questions!`, 'success');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-paper-border dark:border-night-border flex items-center justify-between bg-paper-cardElevated dark:bg-night-cardElevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Chrome className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-paper-ink dark:text-night-text">
                  Study OS In-Page Companion
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                  Chrome & Edge Ready
                </span>
              </div>
              <p className="text-xs text-paper-muted dark:text-night-muted">
                Matches past university questions right inside Wikipedia, GeeksforGeeks, and study tabs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-paper-muted hover:text-paper-ink dark:hover:text-night-text hover:bg-paper-card dark:hover:bg-night-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-paper-border dark:border-night-border px-6 pt-2 gap-4 text-xs font-semibold bg-paper-cardElevated dark:bg-night-cardElevated">
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>How to Load Extension (3 Steps)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('simulator');
              if (simulatedMatches.length === 0) handleSimulateScan();
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Interactive Scanner Simulator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {activeTab === 'install' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Zero External Keys • Works 100% Locally
                  </div>
                  <p className="text-[11px] text-paper-muted dark:text-night-muted mt-0.5">
                    Isolated Shadow DOM ensures no host page styles conflict or leak.
                  </p>
                </div>

                <a
                  href="https://github.com/anything14907-byte/creative/tree/main/extension"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-shrink-0 btn-tactile"
                >
                  <span>View /extension on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 3 Steps */}
              <div className="space-y-3 text-xs">
                
                <div className="p-4 rounded-xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">1</span>
                    <span className="font-bold text-paper-ink dark:text-night-text">Get the /extension directory</span>
                  </div>
                  <p className="text-paper-muted dark:text-night-muted pl-7">
                    Download the <code className="px-1.5 py-0.5 rounded bg-paper-input dark:bg-night-input text-emerald-600 dark:text-emerald-400 font-mono">/extension</code> folder from the repository root to your machine.
                  </p>
                  <div className="pl-7 flex items-center gap-2 pt-1">
                    <code className="text-[11px] px-2.5 py-1 rounded-lg bg-paper-input dark:bg-night-input border border-paper-border dark:border-night-border font-mono text-paper-body dark:text-night-text flex-1 overflow-x-auto">
                      git clone https://github.com/anything14907-byte/creative.git
                    </code>
                    <button
                      onClick={copyRepoExtensionLink}
                      className="px-2.5 py-1 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-card dark:hover:bg-night-card text-[11px] font-bold"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">2</span>
                    <span className="font-bold text-paper-ink dark:text-night-text">Open Extensions and Turn On Developer Mode</span>
                  </div>
                  <p className="text-paper-muted dark:text-night-muted pl-7">
                    In Chrome, Brave, or Edge, visit <span className="px-1.5 py-0.5 rounded bg-paper-input dark:bg-night-input font-mono">chrome://extensions</span> and toggle on <strong>"Developer mode"</strong> in the top-right.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">3</span>
                    <span className="font-bold text-paper-ink dark:text-night-text">Click "Load unpacked" & Select /extension</span>
                  </div>
                  <p className="text-paper-muted dark:text-night-muted pl-7">
                    Select the <code className="font-mono text-emerald-600 dark:text-emerald-400">/extension</code> folder. Done! Press <kbd className="px-1.5 py-0.5 rounded bg-paper-input dark:bg-night-input font-mono font-bold">Alt + Q</kbd> anywhere on the web to open your study companion.
                  </p>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-paper-ink dark:text-night-text">
                  Test Webpage Scanner Simulator:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simulatedTopic}
                    onChange={(e) => setSimulatedTopic(e.target.value)}
                    placeholder="Enter topic..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-input dark:bg-night-input text-xs text-paper-body dark:text-night-text outline-none"
                  />
                  <button
                    onClick={() => handleSimulateScan()}
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs btn-tactile"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Banker's Algorithm & Deadlock",
                    "Paging & TLB Access Time",
                    "Two-Phase Locking (2PL)",
                    "TCP Congestion Control & Handshake",
                    "AVL Tree Rotations"
                  ].map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setSimulatedTopic(preset);
                        handleSimulateScan(preset);
                      }}
                      className="px-2 py-0.5 rounded-md bg-paper-cardElevated dark:bg-night-cardElevated text-[11px] text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Pill & Results */}
              <div className="p-4 rounded-2xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-paper-muted dark:text-night-muted">
                  <span>Simulated In-Page Floating Pill:</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{simulatedMatches.length} PYQs Match This Page</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {simulatedMatches.map(q => (
                    <div 
                      key={q.id}
                      className="p-3 rounded-xl border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {q.subjectName} • Unit {q.unit} ({q.marks}M)
                        </span>
                        <span className="font-bold text-amber-500">
                          Asked {q.repeatCount}x
                        </span>
                      </div>
                      <p className="font-bold text-paper-ink dark:text-night-text">
                        {q.question}
                      </p>
                      <div className="text-[11px] text-paper-muted dark:text-night-muted pl-2 border-l border-emerald-500">
                        {q.bullets[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated flex items-center justify-between text-xs">
          <button
            onClick={copyShortcut}
            className="flex items-center gap-1 text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text font-bold"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Shortcut: Alt + Q</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold btn-tactile"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
