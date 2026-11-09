import React, { useState, useEffect, memo } from 'react';
import { getExamUrgencyColor } from '../utils/storageService';

interface LiveCountdownProps {
  examDate?: string;
  compact?: boolean;
  showRibbonStyle?: boolean;
  className?: string;
}

export const LiveCountdown: React.FC<LiveCountdownProps> = memo(({
  examDate,
  compact = false,
  showRibbonStyle = false,
  className = ''
}) => {
  const [, setTick] = useState(0);

  // Isolate the 1-second interval strictly to this micro-component
  useEffect(() => {
    if (!examDate || !examDate.trim()) return;
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [examDate]);

  if (!examDate || !examDate.trim()) {
    return (
      <span className={`inline-flex items-center text-xs font-mono font-medium text-stone-400 dark:text-stone-500 ${className}`}>
        No exam date set
      </span>
    );
  }

  const urgency = getExamUrgencyColor(examDate);

  if (!urgency.hasDate) {
    return (
      <span className={`inline-flex items-center text-xs font-mono font-medium text-stone-400 dark:text-stone-500 ${className}`}>
        No exam date set
      </span>
    );
  }

  // Smooth color shift based on days remaining:
  // Green (> 15 days), Yellow/Amber (15 to 5 days), Urgent Crimson Red (< 5 days)
  let ribbonBg = '#10B981'; // Green
  let ribbonText = '#FFFFFF';
  let badgeBorder = 'rgba(16, 185, 129, 0.4)';
  let urgencyLabel = 'Normal';

  if (urgency.fractionalDays <= 0) {
    ribbonBg = '#64748B'; // Past
    ribbonText = '#FFFFFF';
    badgeBorder = 'rgba(100, 116, 139, 0.4)';
    urgencyLabel = 'Completed / Past';
  } else if (urgency.fractionalDays < 5) {
    ribbonBg = '#EF4444'; // Urgent Crimson Red
    ribbonText = '#FFFFFF';
    badgeBorder = 'rgba(239, 68, 68, 0.4)';
    urgencyLabel = 'Urgent';
  } else if (urgency.fractionalDays <= 15) {
    ribbonBg = '#F59E0B'; // Amber / Yellow
    ribbonText = '#1C1917';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    urgencyLabel = 'Approaching';
  }

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
  const timeString = `${pad(urgency.days)}d : ${pad(urgency.hours)}h : ${pad(urgency.minutes)}m : ${pad(urgency.seconds)}s`;

  if (showRibbonStyle) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-mono font-extrabold shadow-md transition-colors duration-300 ${className}`}
        style={{
          backgroundColor: ribbonBg,
          color: ribbonText,
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
        }}
        title={`Exam: ${urgency.formattedExamDate} (${urgencyLabel})`}
      >
        <span className="opacity-90">⏳</span>
        <span>{timeString} left</span>
      </div>
    );
  }

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${className}`}
        style={{
          backgroundColor: `${ribbonBg}22`,
          color: ribbonBg,
          border: `1px solid ${badgeBorder}`
        }}
      >
        {timeString}
      </span>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${className}`}
      style={{
        backgroundColor: `${ribbonBg}22`,
        color: ribbonBg,
        border: `1px solid ${badgeBorder}`
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ribbonBg }} />
      <span>{timeString}</span>
    </div>
  );
});

LiveCountdown.displayName = 'LiveCountdown';
