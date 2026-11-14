import React, { useState } from 'react';
import { SubjectMeta, SyllabusTopic } from '../types';
import { BOOK_CLOTH_COLORS, getBookClothColor } from '../utils/bookColors';
import { LiveCountdown } from './LiveCountdown';
import { 
  BookOpen, 
  Calendar, 
  Edit3, 
  Layers, 
  ChevronRight, 
  Palette
} from 'lucide-react';
import { formatUnitDisplayName, getUnitDisplayLabel, getUnitShortBadge, getExamUrgencyColor, sortUnitsByNumber } from '../utils/storageService';

interface TactileSubjectBookProps {
  subject: SubjectMeta;
  volumeIndex: number;
  topics: SyllabusTopic[];
  onOpenBook: (subjectId: string, unitId?: string) => void;
  onEditExamDate: (subject: SubjectMeta) => void;
  onEditSubject?: (subject: SubjectMeta) => void;
  onUpdateSubjectColor: (subjectId: string, colorHex: string) => void;
}

export const TactileSubjectBook: React.FC<TactileSubjectBookProps> = ({
  subject,
  volumeIndex,
  topics,
  onOpenBook,
  onEditExamDate,
  onEditSubject,
  onUpdateSubjectColor
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const cloth = getBookClothColor(subject.accentColor);

  // Subject topics & mastery counts
  const subTopics = topics.filter(t => t.subjectId === subject.id);
  const totalTopics = subTopics.length;
  const completedTopics = subTopics.filter(t => t.completed).length;
  const weakCount = subTopics.filter(t => t.mastery === 'weak').length;
  const okayCount = subTopics.filter(t => t.mastery === 'okay').length;
  const strongCount = subTopics.filter(t => t.mastery === 'strong').length;
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Formatted volume number: VOLUME 01, VOLUME 02
  const volumeNumber = `VOLUME ${String(volumeIndex + 1).padStart(2, '0')}`;

  // Subject Units mapped as Chapters - strictly sorted by numerical sequence (1, 2, 3, 4...)
  const units = sortUnitsByNumber(subject.units || []);

  // Exam urgency calculation for the Inset Chronometer Band
  const examUrgency = subject.examDate ? getExamUrgencyColor(subject.examDate) : null;
  const hasExamDate = !!(examUrgency && examUrgency.hasDate && examUrgency.fractionalDays > 0);
  const isPast = !!(examUrgency && examUrgency.hasDate && examUrgency.fractionalDays <= 0);

  // Smooth Green → Yellow → Red Urgency Accent:
  // >15d: #10B981 (Emerald)
  // 15–5d: #F59E0B (Warm Amber)
  // <5d: #EF4444 (Urgent Crimson Red) with soft pulse
  let urgencyAccent = '#A8A29E'; // default / unset
  let isCriticallyUrgent = false;

  if (hasExamDate) {
    if (examUrgency.fractionalDays > 15) {
      urgencyAccent = '#10B981';
    } else if (examUrgency.fractionalDays >= 5) {
      urgencyAccent = '#F59E0B';
    } else {
      urgencyAccent = '#EF4444';
      isCriticallyUrgent = true;
    }
  } else if (isPast) {
    urgencyAccent = '#64748B';
  }

  const handleBookClick = (unitId?: string) => {
    if (isOpening) return;
    setIsOpening(true);
    // Smooth 60fps opening sequence before switching view
    setTimeout(() => {
      onOpenBook(subject.id, unitId);
      setIsOpening(false);
    }, 420);
  };

  return (
    <div 
      className="relative group select-none w-full flex flex-col justify-end"
      style={{ perspective: '1600px' }}
    >
      {/* 3D HARDCOVER BOOK BODY (Stripe Press Craftsmanship) */}
      <div 
        className={`relative w-full rounded-r-2xl rounded-l-md cursor-pointer flex transition-all duration-500 ease-out ${
          isOpening ? 'scale-105 -translate-y-3' : 'hover:-translate-y-1.5'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          minHeight: '360px',
          boxShadow: '12px 22px 35px -8px rgba(0, 0, 0, 0.5), 2px 4px 8px rgba(0, 0, 0, 0.3)'
        }}
        onClick={() => handleBookClick()}
      >
        {/* Embossed Book Spine & Recessed Spine Groove (Left Edge) */}
        <div 
          className="w-7 sm:w-8 shrink-0 rounded-l-md flex flex-col items-center justify-between py-6 border-r border-black/40 relative z-10"
          style={{
            backgroundColor: cloth.spineHex,
            backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 35%, rgba(255,255,255,0.15) 75%, rgba(0,0,0,0.35) 100%)',
            boxShadow: 'inset 6px 0 12px rgba(0,0,0,0.45)'
          }}
        >
          {/* Top Foil Stamped Volume Number */}
          <span 
            className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-80 writing-mode-vertical rotate-180"
            style={{ color: cloth.foilColor }}
          >
            {volumeNumber}
          </span>

          {/* Raised Spine Bands */}
          <div className="flex flex-col gap-8 w-full px-1">
            <div className="h-[2px] bg-black/50 shadow-xs" />
            <div className="h-[2px] bg-black/50 shadow-xs" />
            <div className="h-[2px] bg-black/50 shadow-xs" />
          </div>

          {/* Bottom Subject Code */}
          <span 
            className="text-[10px] font-mono font-extrabold tracking-wider writing-mode-vertical rotate-180"
            style={{ color: cloth.foilColor }}
          >
            {subject.code || 'TEXTBOOK'}
          </span>
        </div>

        {/* Tactile Front Cover with 3D Flip Open Animation on Click/Hover */}
        <div 
          className="flex-1 rounded-r-xl p-5 sm:p-6 flex flex-col justify-between relative z-10 transition-transform duration-500 origin-left border-y border-r border-white/10"
          style={{
            backgroundColor: cloth.hex,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.22) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset -2px 0 4px rgba(0,0,0,0.35)',
            transform: isOpening 
              ? 'rotateY(-45deg) translateY(-8px)' 
              : undefined
          }}
        >
          {/* Top Row: Volume Badge & Color Trigger */}
          <div className="flex items-start justify-between gap-2 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span 
                className="text-[11px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-sm bg-black/35 border border-white/10"
                style={{ color: cloth.foilColor }}
              >
                {volumeNumber}
              </span>
              {subject.code && (
                <span className="text-[11px] font-mono font-bold text-white/75">
                  [{subject.code}]
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1 rounded-md bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors"
                title="Change Book-Cloth Color"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {onEditSubject && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubject(subject);
                  }}
                  className="p-1 rounded-md bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors"
                  title="Edit Subject Name & Settings"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Color Swatch Picker */}
          {showColorPicker && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute top-14 left-4 right-4 z-40 p-2.5 rounded-xl bg-stone-900 border border-stone-700 shadow-2xl flex flex-wrap gap-2 items-center justify-center animate-fade-in"
            >
              {BOOK_CLOTH_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onUpdateSubjectColor(subject.id, c.hex);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${
                    subject.accentColor === c.hex ? 'border-amber-400 scale-110 shadow-md' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Center: Full Uncut Subject Title in Architectural Typography */}
          <div className="my-auto py-2">
            <h3 
              className="text-lg sm:text-xl font-serif font-extrabold text-white tracking-tight leading-snug drop-shadow-md break-words"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {subject.name}
            </h3>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-white/80 font-mono">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{units.length} Chapters</span>
              <span>•</span>
              <span>{totalTopics} Topics</span>
            </div>
          </div>

          {/* Embossed Collector's Edition Chronometer Band (2-Row Instrument Layout, Zero Truncation) */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onEditExamDate(subject);
            }}
            className="w-full my-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group/band hover:scale-[1.01] active:scale-[0.99] space-y-2"
            style={{
              backgroundColor: 'rgba(10, 12, 16, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderLeft: `4px solid ${urgencyAccent}`,
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
            title="Click to edit exam target date & time"
          >
            {/* Top Row: Urgency Dot + Full Uncut Exam Date & Time + Subtle "Edit Date ✎" */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                    isCriticallyUrgent ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: urgencyAccent,
                    boxShadow: `0 0 8px ${urgencyAccent}`
                  }}
                />
                <span className="text-[11px] font-mono font-bold text-white/95 whitespace-nowrap overflow-visible flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span>
                    {hasExamDate 
                      ? examUrgency.formattedExamDate 
                      : isPast 
                      ? 'Exam Finished' 
                      : 'No Target Date Set'}
                  </span>
                </span>
              </div>

              <span className="text-[10px] font-mono font-bold text-white/50 group-hover/band:text-amber-400 flex items-center gap-1 shrink-0 transition-colors">
                <span>Edit Date</span>
                <span className="text-[11px]">✎</span>
              </span>
            </div>

            {/* Bottom Row: Full-Width Recessed Digital Countdown Display */}
            <div 
              className="w-full py-1 px-2.5 rounded-lg font-mono text-[11px] sm:text-xs font-black tracking-wider tabular-nums flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                color: urgencyAccent,
                border: `1px solid ${urgencyAccent}35`,
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)'
              }}
            >
              {hasExamDate ? (
                <LiveCountdown examDate={subject.examDate} compact={true} />
              ) : isPast ? (
                <span className="text-stone-400 font-bold">Exam Finished</span>
              ) : (
                <span className="text-amber-400/90 font-bold flex items-center gap-1">
                  + Set Target Countdown
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Syllabus Mastery Breakdown & Open Book Action */}
          <div className="space-y-3 pt-3 border-t border-white/15">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-white/90 font-bold">{progressPct}% Mastered</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-red-950/70 text-red-200 border border-red-700/50" title="Weak topics">
                  {weakCount} W
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-200 border border-amber-700/50" title="Okay topics">
                  {okayCount} O
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-200 border border-emerald-700/50" title="Strong topics">
                  {strongCount} S
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(to right, #F59E0B, #10B981)'
                }}
              />
            </div>

            {/* "📖 Open Book" Action Button */}
            <button
              type="button"
              onClick={() => handleBookClick()}
              className="w-full py-2.5 rounded-lg bg-black/45 hover:bg-black/65 active:scale-98 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md group-hover:border-amber-400/60"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{isOpening ? 'Opening Textbook...' : 'Open Book'}</span>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3D Multi-Layered Paper Block Edge (Simulating 400 Stacked Pages) */}
        <div 
          className="w-5 shrink-0 rounded-r-md border-y border-r border-stone-400/40"
          style={{
            background: 'repeating-linear-gradient(90deg, #FBF8F1, #FBF8F1 2px, #E7E5E4 2px, #E7E5E4 4px)',
            boxShadow: 'inset 3px 0 5px rgba(0,0,0,0.25), 2px 0 0 #E6E0D4, 3px 0 0 #BDB5A6, 5px 0 0 #E6E0D4, 6px 0 0 #BDB5A6'
          }}
        />

        {/* Physical Die-Cut Chapter Tabs sticking out of the Right Edge */}
        <aside 
          aria-label="Chapter navigation tabs"
          className="absolute -right-7 top-8 bottom-8 flex flex-col justify-start gap-2 z-20"
        >
          {units.slice(0, 5).map((u, uIdx) => (
            <button
              key={u.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBookClick(u.id);
              }}
              className="px-1.5 py-1 rounded-r-md text-[10px] font-mono font-extrabold border-y border-r transition-all hover:translate-x-1 active:translate-x-0 shadow-md text-stone-900"
              style={{
                backgroundColor: uIdx % 2 === 0 ? '#FDE68A' : '#FED7AA',
                borderColor: '#B45309',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
              }}
              title={`Open ${formatUnitDisplayName(u)}`}
            >
              <span>{getUnitShortBadge(u)}</span>
            </button>
          ))}
          {units.length > 5 && (
            <span className="text-[9px] font-mono font-bold text-amber-400 ml-1">
              +{units.length - 5}
            </span>
          )}
        </aside>
      </div>
    </div>
  );
};
