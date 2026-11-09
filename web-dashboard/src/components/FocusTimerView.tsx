import React, { useState, useEffect, useRef } from 'react';
import { SubjectMeta, PomodoroSession } from '../types';
import { storageService } from '../utils/storageService';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Sparkles,
  Award,
  Clock,
  Settings2,
  AlertCircle
} from 'lucide-react';

import { ConfirmModal } from './ConfirmModal';

interface FocusTimerViewProps {
  subjects: SubjectMeta[];
  activeSubjectId: string;
  pomodoroLogs: PomodoroSession[];
  onLogSession: (subjectId: string, minutes: number) => void;
  onResetTimerData?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focusDuration: number; // minutes: 25 to 180
  shortBreakDuration: number; // minutes: 1 to 60
  longBreakDuration: number; // minutes: 1 to 60
}

interface ActiveTimerSession {
  mode: TimerMode;
  subjectId: string;
  targetEndTime: number | null; // Date.now() + remainingSeconds * 1000
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastUpdated: number;
}

export interface CustomTimerPreset {
  id: string;
  name: string;
  hours: number;
  minutes: number;
  seconds: number;
  isDefault?: boolean;
}

const SETTINGS_KEY = 'pyq_timer_settings';
const ACTIVE_SESSION_KEY = 'pyq_timer_active_session';
const CUSTOM_PRESETS_KEY = 'studyos_custom_timer_presets';

const DEFAULT_PRESETS: CustomTimerPreset[] = [
  { id: 'preset_pomo', name: '25m Pomodoro', hours: 0, minutes: 25, seconds: 0, isDefault: true },
  { id: 'preset_deep', name: '45m Deep Study', hours: 0, minutes: 45, seconds: 0, isDefault: true },
  { id: 'preset_mock', name: '3h Mock Exam', hours: 3, minutes: 0, seconds: 0, isDefault: true },
  { id: 'preset_rev', name: '15m Quick Revision', hours: 0, minutes: 15, seconds: 0, isDefault: true },
];

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  subjects,
  activeSubjectId,
  pomodoroLogs,
  onLogSession,
  onResetTimerData,
  onShowToast
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubjectId || subjects[0]?.id || 'os');
  
  // 1. Settings state (persisted)
  const [settings, setSettings] = useState<TimerSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          focusDuration: Math.max(25, Math.min(180, Number(parsed.focusDuration) || 25)),
          shortBreakDuration: Math.max(1, Math.min(60, Number(parsed.shortBreakDuration) || 5)),
          longBreakDuration: Math.max(1, Math.min(60, Number(parsed.longBreakDuration) || 15)),
        };
      }
    } catch (e) {
      console.error('Failed to parse timer settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState<TimerMode>('focus');
  const [isActive, setIsActive] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(settings.focusDuration * 60);
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  
  const [sessionCount, setSessionCount] = useState(0);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Custom Direct Time Inputs (Hours, Minutes, Seconds)
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  // Click-to-Edit Clock Digits
  const [isEditingClock, setIsEditingClock] = useState<boolean>(false);
  const [clockEditH, setClockEditH] = useState<number>(0);
  const [clockEditM, setClockEditM] = useState<number>(25);
  const [clockEditS, setClockEditS] = useState<number>(0);

  // Custom Presets
  const [presets, setPresets] = useState<CustomTimerPreset[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse custom presets:', e);
    }
    return DEFAULT_PRESETS;
  });

  const [newPresetName, setNewPresetName] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);

  const saveCustomPresets = (updated: CustomTimerPreset[]) => {
    setPresets(updated);
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom presets:', e);
    }
  };

  const handleApplyCustomTime = (h: number, m: number, s: number) => {
    const totalSec = (Math.max(0, h) * 3600) + (Math.max(0, m) * 60) + Math.max(0, s);
    if (totalSec < 5) {
      onShowToast('Please set at least 5 seconds for study timer.', 'info');
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTargetEndTime(null);
    setTotalDurationSeconds(totalSec);
    setSecondsLeft(totalSec);
    persistActiveSession(null);
    setIsEditingClock(false);
    onShowToast(`Timer set to ${h > 0 ? `${h}h ` : ''}${m}m ${s > 0 ? `${s}s` : ''}! ⏱️`, 'success');
  };

  const handleAdjustSeconds = (deltaSec: number) => {
    const newSecondsLeft = Math.max(5, secondsLeft + deltaSec);
    setSecondsLeft(newSecondsLeft);
    setTotalDurationSeconds(prev => Math.max(newSecondsLeft, prev + deltaSec));

    if (isActive && targetEndTime) {
      const updatedEndTime = targetEndTime + (deltaSec * 1000);
      setTargetEndTime(updatedEndTime);
      persistActiveSession({
        mode,
        subjectId: selectedSubjectId,
        targetEndTime: updatedEndTime,
        totalDurationSeconds: Math.max(newSecondsLeft, totalDurationSeconds + deltaSec),
        remainingSeconds: newSecondsLeft,
        isRunning: true,
        lastUpdated: Date.now()
      });
    }
    const minDiff = Math.round(deltaSec / 60);
    onShowToast(`${minDiff > 0 ? `+${minDiff}` : `${minDiff}`} min fine-tuned! ⚡`, 'info');
  };

  const handleApplyPreset = (p: CustomTimerPreset) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTargetEndTime(null);
    const totalSec = (p.hours * 3600) + (p.minutes * 60) + p.seconds;
    setTotalDurationSeconds(totalSec);
    setSecondsLeft(totalSec);
    persistActiveSession(null);
    setCustomHours(p.hours);
    setCustomMinutes(p.minutes);
    setCustomSeconds(p.seconds);
    setIsEditingClock(false);
    onShowToast(`Loaded preset "${p.name}" (${p.hours > 0 ? `${p.hours}h ` : ''}${p.minutes}m)! ⏱️`, 'info');
  };

  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const curH = Math.floor(secondsLeft / 3600);
    const curM = Math.floor((secondsLeft % 3600) / 60);
    const curS = secondsLeft % 60;

    const newP: CustomTimerPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      hours: curH,
      minutes: curM,
      seconds: curS,
      isDefault: false
    };

    const updated = [...presets, newP];
    saveCustomPresets(updated);
    setNewPresetName('');
    setIsSavingPreset(false);
    onShowToast(`Saved preset "${newP.name}"! ⭐`, 'success');
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    saveCustomPresets(updated);
    onShowToast('Preset deleted.', 'info');
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // Helper to get duration in seconds for any mode
  const getModeDurationSeconds = (m: TimerMode, currentSettings: TimerSettings = settings) => {
    if (m === 'focus') return currentSettings.focusDuration * 60;
    if (m === 'shortBreak') return currentSettings.shortBreakDuration * 60;
    return currentSettings.longBreakDuration * 60;
  };

  // Helper to persist settings
  const saveSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save timer settings:', e);
    }
  };

  // Helper to persist active session state
  const persistActiveSession = (state: ActiveTimerSession | null) => {
    try {
      if (state) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to persist active timer session:', e);
    }
  };

  // 2. On mount: resume active session if one was running before refresh/tab close
  useEffect(() => {
    try {
      const savedSessionRaw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSessionRaw) {
        const saved: ActiveTimerSession = JSON.parse(savedSessionRaw);
        if (saved && saved.mode) {
          setMode(saved.mode);
          if (saved.subjectId) setSelectedSubjectId(saved.subjectId);
          setTotalDurationSeconds(saved.totalDurationSeconds || getModeDurationSeconds(saved.mode));

          if (saved.isRunning && saved.targetEndTime) {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((saved.targetEndTime - now) / 1000));
            if (remaining > 0) {
              setSecondsLeft(remaining);
              setTargetEndTime(saved.targetEndTime);
              setIsActive(true);
            } else {
              // Timer completed while away
              setSecondsLeft(0);
              setIsActive(false);
              persistActiveSession(null);
              if (saved.mode === 'focus') {
                const durationMinutes = Math.round((saved.totalDurationSeconds || settings.focusDuration * 60) / 60);
                onLogSession(saved.subjectId || selectedSubjectId, durationMinutes);
                onShowToast(`🎉 Welcome back! Your ${durationMinutes}-min focus session completed while you were away. Logged successfully!`, 'success');
                switchMode('shortBreak');
              } else {
                onShowToast('Break session completed while you were away!', 'info');
                switchMode('focus');
              }
            }
            return;
          } else {
            // Saved while paused
            if (saved.remainingSeconds > 0) {
              setSecondsLeft(saved.remainingSeconds);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error recovering timer session:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Switch mode (focus / shortBreak / longBreak)
  const switchMode = (newMode: TimerMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTargetEndTime(null);
    setMode(newMode);
    const durationSec = getModeDurationSeconds(newMode);
    setTotalDurationSeconds(durationSec);
    setSecondsLeft(durationSec);
    persistActiveSession(null);
  };

  // 4. Timer interval based on targetEndTime (impervious to background throttling and screen lock)
  useEffect(() => {
    if (isActive && targetEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimerComplete();
        }
      }, 500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetEndTime, mode, selectedSubjectId]);

  // Start / Pause timer toggle
  const handleTogglePlay = () => {
    if (!isActive) {
      // Start or Resume
      const durationToRun = secondsLeft > 0 ? secondsLeft : totalDurationSeconds;
      const endTimestamp = Date.now() + durationToRun * 1000;
      setTargetEndTime(endTimestamp);
      setIsActive(true);

      persistActiveSession({
        mode,
        subjectId: selectedSubjectId,
        targetEndTime: endTimestamp,
        totalDurationSeconds,
        remainingSeconds: durationToRun,
        isRunning: true,
        lastUpdated: Date.now(),
      });
    } else {
      // Pause
      const currentRemaining = targetEndTime ? Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000)) : secondsLeft;
      setIsActive(false);
      setTargetEndTime(null);
      setSecondsLeft(currentRemaining);

      persistActiveSession({
        mode,
        subjectId: selectedSubjectId,
        targetEndTime: null,
        totalDurationSeconds,
        remainingSeconds: currentRemaining,
        isRunning: false,
        lastUpdated: Date.now(),
      });
    }
  };

  // Reset timer (Never logs any study minutes)
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTargetEndTime(null);
    const durationSec = getModeDurationSeconds(mode);
    setTotalDurationSeconds(durationSec);
    setSecondsLeft(durationSec);
    persistActiveSession(null);
  };

  // Natural Timer Completion (Logs focus minutes only on completion)
  const handleTimerComplete = () => {
    setIsActive(false);
    setTargetEndTime(null);
    persistActiveSession(null);

    if (mode === 'focus') {
      const minutes = Math.round(totalDurationSeconds / 60);
      onLogSession(selectedSubjectId, minutes);
      setSessionCount(c => c + 1);
      onShowToast(`🎉 Awesome focus session! Logged ${minutes} mins for ${selectedSubject?.name || 'Subject'}. Take a break!`, 'success');
      switchMode('shortBreak');
    } else {
      onShowToast('Break finished! Ready for the next focus session?', 'info');
      switchMode('focus');
    }
  };

  // Manual Log Now (only enabled if at least 1 minute of real focus time has elapsed)
  const handleManualComplete = () => {
    const elapsedSeconds = totalDurationSeconds - secondsLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 1) {
      onShowToast('At least 1 minute of focus time must elapse before logging.', 'info');
      return;
    }

    onLogSession(selectedSubjectId, elapsedMinutes);
    onShowToast(`Logged ${elapsedMinutes} focus minutes!`, 'success');
    switchMode('focus');
  };

  // Duration input handlers with validation
  const handleUpdateFocusDuration = (val: number) => {
    if (isActive) return;
    if (isNaN(val) || val < 25) {
      onShowToast('Minimum focus duration is 25 minutes.', 'info');
      const updated = { ...settings, focusDuration: 25 };
      saveSettings(updated);
      if (mode === 'focus') {
        setTotalDurationSeconds(25 * 60);
        setSecondsLeft(25 * 60);
      }
      return;
    }
    const clamped = Math.min(180, Math.max(25, val));
    const updated = { ...settings, focusDuration: clamped };
    saveSettings(updated);
    if (mode === 'focus') {
      setTotalDurationSeconds(clamped * 60);
      setSecondsLeft(clamped * 60);
    }
  };

  const handleUpdateShortBreak = (val: number) => {
    if (isActive) return;
    const clamped = Math.min(60, Math.max(1, isNaN(val) ? 5 : val));
    const updated = { ...settings, shortBreakDuration: clamped };
    saveSettings(updated);
    if (mode === 'shortBreak') {
      setTotalDurationSeconds(clamped * 60);
      setSecondsLeft(clamped * 60);
    }
  };

  const handleUpdateLongBreak = (val: number) => {
    if (isActive) return;
    const clamped = Math.min(60, Math.max(1, isNaN(val) ? 15 : val));
    const updated = { ...settings, longBreakDuration: clamped };
    saveSettings(updated);
    if (mode === 'longBreak') {
      setTotalDurationSeconds(clamped * 60);
      setSecondsLeft(clamped * 60);
    }
  };

  // Format HH:MM:SS or MM:SS
  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedTime = hours > 0 
    ? `${pad(hours)} : ${pad(mins)} : ${pad(secs)}`
    : `${pad(mins)} : ${pad(secs)}`;

  // Weekly Stats calculation directly from logged sessions
  const weeklyStats = React.useMemo(() => {
    return storageService.getWeeklyPomodoroStats();
  }, [pomodoroLogs]);

  const maxMinutesInWeek = Math.max(...weeklyStats.map(s => s.minutes), 60);

  // Today & Week Totals calculated ONLY from real logged sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = pomodoroLogs
    .filter(l => l.date === todayStr)
    .reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);

  const totalWeekMinutes = weeklyStats.reduce((sum, s) => sum + s.minutes, 0);

  const elapsedSeconds = totalDurationSeconds - secondsLeft;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  // Subject time breakdown
  const subjectTimeBreakdown = subjects.map(s => {
    const mins = pomodoroLogs
      .filter(l => l.subjectId === s.id)
      .reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
    return { subject: s, minutes: mins };
  });
  const maxSubjectMinutes = Math.max(1, ...subjectTimeBreakdown.map(b => b.minutes));

  return (
    <div className="space-y-8 animate-fade-slide-up w-full pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-paper-ink dark:text-night-text flex items-center gap-2">
            <Timer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Focus Timer ({settings.focusDuration}/{settings.shortBreakDuration})</span>
          </h2>
          <p className="text-xs text-paper-muted dark:text-night-muted mt-0.5">
            Accurate background-safe study sessions logged per subject with analytics.
          </p>
        </div>

        {/* Quick Subject Selector & Settings Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-paper-muted dark:text-night-muted">Target Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 btn-tactile transition-all ${
              showSettingsDrawer 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-paper-card dark:bg-night-card border-paper-border dark:border-night-border text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text'
            }`}
            title="Configure Timer Durations"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Durations</span>
          </button>
        </div>
      </div>

      {/* DURATION CONFIGURATION PANEL */}
      {showSettingsDrawer && (
        <div className="p-5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-3 animate-fade-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-paper-border dark:border-night-border">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text">
                Timer Settings (Saved Permanently)
              </span>
            </div>
            {isActive && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Session in progress. Pause/reset to modify.</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Focus Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-paper-ink dark:text-night-text">
                Focus Duration <span className="text-paper-muted text-[10px]">(min 25, max 180 min)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isActive || settings.focusDuration <= 25}
                  onClick={() => handleUpdateFocusDuration(settings.focusDuration - 5)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  -5
                </button>
                <input
                  type="number"
                  min={25}
                  max={180}
                  disabled={isActive}
                  value={settings.focusDuration}
                  onChange={e => handleUpdateFocusDuration(parseInt(e.target.value, 10))}
                  className="w-full text-center px-2 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isActive || settings.focusDuration >= 180}
                  onClick={() => handleUpdateFocusDuration(settings.focusDuration + 5)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Short Break */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-paper-ink dark:text-night-text">
                Short Break <span className="text-paper-muted text-[10px]">(1 - 60 min)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isActive || settings.shortBreakDuration <= 1}
                  onClick={() => handleUpdateShortBreak(settings.shortBreakDuration - 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  -1
                </button>
                <input
                  type="number"
                  min={1}
                  max={60}
                  disabled={isActive}
                  value={settings.shortBreakDuration}
                  onChange={e => handleUpdateShortBreak(parseInt(e.target.value, 10))}
                  className="w-full text-center px-2 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isActive || settings.shortBreakDuration >= 60}
                  onClick={() => handleUpdateShortBreak(settings.shortBreakDuration + 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Long Break */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-paper-ink dark:text-night-text">
                Long Break <span className="text-paper-muted text-[10px]">(1 - 60 min)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isActive || settings.longBreakDuration <= 1}
                  onClick={() => handleUpdateLongBreak(settings.longBreakDuration - 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  -1
                </button>
                <input
                  type="number"
                  min={1}
                  max={60}
                  disabled={isActive}
                  value={settings.longBreakDuration}
                  onChange={e => handleUpdateLongBreak(parseInt(e.target.value, 10))}
                  className="w-full text-center px-2 py-1.5 rounded-lg bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-bold text-paper-ink dark:text-night-text disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isActive || settings.longBreakDuration >= 60}
                  onClick={() => handleUpdateLongBreak(settings.longBreakDuration + 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border bg-paper-card dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed btn-tactile"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN WIDESCREEN STUDIO GRID */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: LARGE FUTURISTIC POMODORO CLOCK + CONTROLS */}
        <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-20">
          {/* Main Pomodoro Clock Card */}
          <div 
            className="p-8 sm:p-12 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card text-center space-y-6 relative overflow-hidden transition-all"
            style={{ borderTop: `6px solid ${selectedSubject?.accentColor || '#10B981'}` }}
          >
            {/* Mode Selector Buttons */}
            <div className="inline-flex p-1.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border gap-1.5 shadow-xs flex-wrap justify-center">
              <button
                onClick={() => switchMode('focus')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all btn-tactile ${
                  mode === 'focus' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card'
                }`}
              >
                🔥 Focus ({settings.focusDuration}m)
              </button>

              <button
                onClick={() => switchMode('shortBreak')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all btn-tactile ${
                  mode === 'shortBreak' 
                    ? 'bg-cyan-600 text-white shadow-xs' 
                    : 'text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card'
                }`}
              >
                ☕ Short Break ({settings.shortBreakDuration}m)
              </button>

              <button
                onClick={() => switchMode('longBreak')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all btn-tactile ${
                  mode === 'longBreak' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card'
                }`}
              >
                🌴 Long Break ({settings.longBreakDuration}m)
              </button>
            </div>

            {/* Selected Subject Banner */}
            <div className="flex items-center justify-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: selectedSubject?.accentColor }} 
              />
              <span className="text-sm font-bold text-paper-ink dark:text-night-text">
                Studying: {selectedSubject?.name}
              </span>
            </div>

            {/* Giant Timer Digits (Click-to-Edit when paused) */}
            <div className="py-2">
              {isEditingClock ? (
                <div className="p-4 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border-2 border-emerald-500/50 max-w-sm mx-auto space-y-3 animate-fade-slide-up">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                    ✏️ Edit Timer Duration Directly
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-paper-muted font-mono font-bold">HOURS</span>
                      <input 
                        type="number"
                        min={0}
                        max={12}
                        value={clockEditH}
                        onChange={e => setClockEditH(Math.max(0, Math.min(12, parseInt(e.target.value, 10) || 0)))}
                        className="w-16 text-center text-2xl font-black font-mono py-1 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border"
                      />
                    </div>
                    <span className="text-2xl font-black font-mono pt-4">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-paper-muted font-mono font-bold">MINS</span>
                      <input 
                        type="number"
                        min={0}
                        max={59}
                        value={clockEditM}
                        onChange={e => setClockEditM(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                        className="w-16 text-center text-2xl font-black font-mono py-1 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border"
                      />
                    </div>
                    <span className="text-2xl font-black font-mono pt-4">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-paper-muted font-mono font-bold">SECS</span>
                      <input 
                        type="number"
                        min={0}
                        max={59}
                        value={clockEditS}
                        onChange={e => setClockEditS(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                        className="w-16 text-center text-2xl font-black font-mono py-1 rounded-xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingClock(false)}
                      className="px-3 py-1 rounded-lg border border-paper-border dark:border-night-border text-xs font-bold text-paper-muted hover:text-paper-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCustomTime(clockEditH, clockEditM, clockEditS)}
                      className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95"
                    >
                      ✓ Apply Time
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    if (isActive) {
                      onShowToast('Pause timer to edit digits directly ⏱️', 'info');
                      return;
                    }
                    setClockEditH(Math.floor(secondsLeft / 3600));
                    setClockEditM(Math.floor((secondsLeft % 3600) / 60));
                    setClockEditS(secondsLeft % 60);
                    setIsEditingClock(true);
                  }}
                  className={`group relative inline-block cursor-pointer px-4 py-1 rounded-2xl transition-all ${
                    !isActive ? 'hover:bg-paper-cardElevated/70 dark:hover:bg-night-cardElevated/70' : ''
                  }`}
                  title={isActive ? 'Timer running' : 'Click to edit custom duration directly'}
                >
                  <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-paper-ink dark:text-night-text select-none countdown-digit">
                    {formattedTime}
                  </div>
                  {!isActive && (
                    <span className="text-[10px] font-mono font-bold text-paper-muted group-hover:text-emerald-500 transition-colors block">
                      👆 Click digits to set custom duration
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-paper-muted dark:text-night-muted mt-1.5">
                {mode === 'focus' ? 'Keep distractions away and master your concepts.' : 'Relax, breathe, and grab water before the next sprint.'}
              </p>
            </div>

            {/* Quick Fine-Tune Stepper Buttons (Adjust time even while running!) */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 pb-2">
              <span className="text-[10px] font-mono font-bold text-paper-muted uppercase mr-1">Fine-Tune:</span>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(-600)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-rose-500 hover:border-rose-500/40 active:scale-95 transition-all"
              >
                -10m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(-300)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-rose-500 hover:border-rose-500/40 active:scale-95 transition-all"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(-60)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-rose-500 hover:border-rose-500/40 active:scale-95 transition-all"
              >
                -1m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(60)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-emerald-500 hover:border-emerald-500/40 active:scale-95 transition-all"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(300)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-emerald-500 hover:border-emerald-500/40 active:scale-95 transition-all"
              >
                +5m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(600)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-emerald-500 hover:border-emerald-500/40 active:scale-95 transition-all"
              >
                +10m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSeconds(1800)}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-muted hover:text-emerald-500 hover:border-emerald-500/40 active:scale-95 transition-all"
              >
                +30m
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleTogglePlay}
                className={`px-8 py-3.5 rounded-2xl text-base font-extrabold text-white flex items-center gap-2 btn-tactile shadow-md transition-all ${
                  isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isActive ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-3.5 rounded-2xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated text-paper-muted hover:text-paper-ink dark:text-night-muted dark:hover:text-night-text btn-tactile"
                title="Reset Timer (No minutes logged)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {mode === 'focus' && (isActive || elapsedMinutes >= 1) && (
                <button
                  onClick={handleManualComplete}
                  className="px-4 py-3.5 rounded-2xl border border-paper-border dark:border-night-border bg-paper-cardElevated dark:bg-night-cardElevated text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 btn-tactile"
                  title="Log completed study minutes right now"
                >
                  Log Now ({elapsedMinutes}m)
                </button>
              )}
            </div>

            {/* Sleek "⚙️ Set Custom Time" Panel */}
            <div className="pt-4 border-t border-paper-border dark:border-night-border text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Set Custom Time</span>
                </span>
                <span className="text-[10px] font-mono text-paper-muted">Direct Hours : Mins : Secs</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-paper-muted block">Hours (0–12)</span>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={customHours}
                    onChange={e => setCustomHours(Math.max(0, Math.min(12, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center px-2 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono font-bold text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-paper-muted block">Mins (0–59)</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customMinutes}
                    onChange={e => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center px-2 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono font-bold text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-paper-muted block">Secs (0–59)</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customSeconds}
                    onChange={e => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-full text-center px-2 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs font-mono font-bold text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => handleApplyCustomTime(customHours, customMinutes, customSeconds)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    Set Timer
                  </button>
                </div>
              </div>
            </div>

            {/* Timer Presets (Default + Custom Saved to LocalStorage) */}
            <div className="pt-3 border-t border-paper-border dark:border-night-border text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-paper-ink dark:text-night-text flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Timer Presets</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(!isSavingPreset)}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {isSavingPreset ? '✕ Cancel' : '+ Save Current as Preset'}
                </button>
              </div>

              {isSavingPreset && (
                <form onSubmit={handleSaveCurrentAsPreset} className="flex items-center gap-2 pt-1 animate-fade-slide-up">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 45m Deep Study, 3h Mock Exam..."
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs text-paper-ink dark:text-night-text focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-xs active:scale-95"
                  >
                    Save
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {presets.map(p => (
                  <div
                    key={p.id}
                    className="group/preset inline-flex items-center rounded-xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border hover:border-emerald-500/50 shadow-xs transition-all overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-3 py-1.5 text-xs font-mono font-bold text-paper-ink dark:text-night-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {p.name}
                    </button>
                    {!p.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(p.id)}
                        className="px-1.5 py-1.5 text-paper-muted hover:text-rose-500 transition-colors border-l border-paper-border dark:border-night-border opacity-0 group-hover/preset:opacity-100"
                        title="Delete custom preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS, TIME BREAKDOWN & SESSIONS */}
        <div className="lg:col-span-6 space-y-6">

      {/* WEEKLY STUDY MINUTES BAR CHART */}
      <div className="p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Weekly Focus Activity (Last 7 Days)</span>
            </h3>
            <p className="text-xs text-paper-muted dark:text-night-muted">
              Total minutes logged exclusively through completed Pomodoro focus sessions.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-paper-muted dark:text-night-muted">
              Today: <strong className="text-emerald-600 dark:text-emerald-400">{todayMinutes}m</strong>
            </span>
            <span className="text-paper-muted dark:text-night-muted">
              Week Total: <strong className="text-emerald-600 dark:text-emerald-400">{totalWeekMinutes}m</strong>
            </span>
          </div>
        </div>

        {/* Clean Bar Chart */}
        <div className="pt-4">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {weeklyStats.map((stat, idx) => {
              const heightPercent = maxMinutesInWeek > 0 
                ? Math.max(8, Math.round((stat.minutes / maxMinutesInWeek) * 100)) 
                : 8;
              const isToday = stat.date === todayStr;

              return (
                <div key={stat.date || idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip minutes badge on hover */}
                  <div className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-paper-ink dark:text-night-text opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.minutes}m
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-paper-cardElevated dark:bg-night-cardElevated rounded-xl overflow-hidden p-1 flex items-end justify-center h-full">
                    <div 
                      className={`w-full rounded-lg transition-all duration-500 ${
                        isToday 
                          ? 'bg-gradient-to-t from-emerald-600 to-cyan-500 shadow-glow-emerald' 
                          : stat.minutes > 0
                          ? 'bg-emerald-600/70 hover:bg-emerald-600'
                          : 'bg-paper-border dark:bg-night-border/40'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center">
                    <div className={`text-xs font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-paper-body dark:text-night-text'}`}>
                      {stat.day}
                    </div>
                    <div className="text-[9px] text-paper-muted dark:text-night-muted font-mono">
                      {stat.minutes}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* SUBJECT TIME BREAKDOWN */}
        <div className="p-6 rounded-3xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-paper-card dark:shadow-night-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
            <h3 className="text-base font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Subject Study Breakdown</span>
            </h3>
            <span className="text-xs font-mono font-bold text-paper-muted dark:text-night-muted">
              {subjects.length} Subjects
            </span>
          </div>

          <div className="space-y-3">
            {subjectTimeBreakdown.map(({ subject: sub, minutes: mins }) => {
              const pct = maxSubjectMinutes > 0 ? Math.round((mins / maxSubjectMinutes) * 100) : 0;
              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-paper-ink dark:text-night-text flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.accentColor }} />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{sub.name}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {mins} mins
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-paper-cardElevated dark:bg-night-cardElevated overflow-hidden border border-paper-border dark:border-night-border">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.max(mins > 0 ? 5 : 0, pct)}%`, 
                        backgroundColor: sub.accentColor 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Sessions List & Reset Timer Data Option */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Recent Focus Sessions</span>
            </h4>

            {onResetTimerData && (
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 btn-tactile py-1 px-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Reset all timer study sessions back to 0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset timer data</span>
              </button>
            )}
          </div>

          {/* Confirmation Modal */}
          <ConfirmModal
            isOpen={isResetConfirmOpen}
            title="Reset Timer Study Data?"
            message="Are you sure you want to reset all Pomodoro focus session history for this exam? This will clear Today's and Week Total study minutes back to 0 and cannot be undone."
            confirmText="Yes, Reset Timer Data"
            cancelText="Keep Data"
            isDanger={true}
            onConfirm={() => {
              if (onResetTimerData) onResetTimerData();
              setIsResetConfirmOpen(false);
            }}
            onCancel={() => setIsResetConfirmOpen(false)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pomodoroLogs.slice(0, 6).map(log => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-2xl bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: log.accentColor || '#10B981' }} />
                  <div>
                    <div className="font-bold text-paper-ink dark:text-night-text">{log.subjectName || log.subjectId}</div>
                    <div className="text-[10px] text-paper-muted dark:text-night-muted">{log.date}</div>
                  </div>
                </div>

                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  +{log.minutes} mins
                </div>
              </div>
            ))}

            {pomodoroLogs.length === 0 && (
              <div className="p-6 text-center rounded-2xl bg-paper-card dark:bg-night-card border border-dashed border-paper-border dark:border-night-border text-paper-muted text-xs sm:col-span-2">
                No sessions logged yet. Complete your first focus session above!
              </div>
            )}
          </div>
        </div>

        </div> {/* Close right column */}
      </div> {/* Close 2-column grid */}

    </div>
  );
};
