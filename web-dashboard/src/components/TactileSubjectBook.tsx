import React, { useState } from 'react';
import { SubjectMeta, SyllabusTopic } from '../types';
import { BOOK_CLOTH_COLORS, getBookClothColor } from '../utils/bookColors';
import { LiveCountdown } from './LiveCountdown';
import { 
  BookOpen, 
  Calendar, 
  Edit3, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  Palette,
  Clock
} from 'lucide-react';
import { formatUnitDisplayName } from '../utils/storageService';

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

  // Subject Units mapped as Chapters
  const units = subject.units || [];

  return (
    <div 
      className="relative group select-none transition-all duration-300 w-full flex flex-col justify-end"
      style={{ perspective: '1200px' }}
    >
      {/* Physical Hanging Ribbon Bookmark protruding from TOP */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onEditExamDate(subject);
        }}
        className="absolute -top-3.5 left-8 z-30 cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0.5 group/ribbon"
        title="Click to change exam date"
      >
        <div 
          className="relative px-3 py-1 text-[11px] font-mono font-extrabold flex items-center gap-1.5 shadow-md rounded-t-sm"
          style={{
            background: 'linear-gradient(180deg, #1C1917 0%, #292524 100%)',
            borderTop: '2px solid #F59E0B',
            color: '#F5F5F4'
          }}
        >
          <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
          <LiveCountdown examDate={subject.examDate} compact={true} />
        </div>
        {/* Ribbon Tail Notch */}
        <div 
          className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[8px] border-t-[#292524] mx-auto"
        />
      </div>

      {/* 3D BOOK BODY WRAPPER */}
      <div 
        className="relative w-full rounded-r-2xl rounded-l-md transition-transform duration-500 ease-out cursor-pointer flex"
        style={{
          transformStyle: 'preserve-3d',
          minHeight: '340px',
          boxShadow: '10px 18px 30px -8px rgba(0, 0, 0, 0.45), 2px 4px 8px rgba(0, 0, 0, 0.25)'
        }}
        onClick={() => onOpenBook(subject.id)}
      >
        {/* Embossed Book Spine (Left Edge) */}
        <div 
          className="w-7 sm:w-8 shrink-0 rounded-l-md flex flex-col items-center justify-between py-6 border-r border-black/30 shadow-inner relative z-10"
          style={{
            backgroundColor: cloth.spineHex,
            backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(255,255,255,0.12) 80%, rgba(0,0,0,0.3) 100%)'
          }}
        >
          {/* Top Foil Brand Stamped on Spine */}
          <span 
            className="text-[9px] font-mono font-bold tracking-widest uppercase opacity-75 writing-mode-vertical rotate-180"
            style={{ color: cloth.foilColor }}
          >
            {volumeNumber}
          </span>

          {/* Spine Ribs (Decorative raised bands) */}
          <div className="flex flex-col gap-8 w-full px-1">
            <div className="h-[2px] bg-black/40 shadow-xs" />
            <div className="h-[2px] bg-black/40 shadow-xs" />
            <div className="h-[2px] bg-black/40 shadow-xs" />
          </div>

          {/* Bottom Code */}
          <span 
            className="text-[10px] font-mono font-extrabold tracking-wider writing-mode-vertical rotate-180"
            style={{ color: cloth.foilColor }}
          >
            {subject.code || 'OS'}
          </span>
        </div>

        {/* Tactile Front Cover with 3D Open Angle on Hover */}
        <div 
          className="flex-1 rounded-r-xl p-5 sm:p-6 flex flex-col justify-between relative z-10 transition-transform duration-500 origin-left border-y border-r border-white/10 group-hover:[transform:rotateY(-14deg)_translateY(-6px)]"
          style={{
            backgroundColor: cloth.hex,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.14) 0%, transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.2) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset -2px 0 3px rgba(0,0,0,0.3)'
          }}
        >
          {/* Top Row: Volume & Quick Actions */}
          <div className="flex items-start justify-between gap-2 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span 
                className="text-[11px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-sm bg-black/30 border border-white/10"
                style={{ color: cloth.foilColor }}
              >
                {volumeNumber}
              </span>
              {subject.code && (
                <span className="text-[11px] font-mono font-bold text-white/70">
                  [{subject.code}]
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Color Swatch Trigger */}
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

              {/* Edit Subject */}
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

          {/* 10 Cloth Colors Inline Palette Picker */}
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
          <div className="my-auto py-4">
            <h3 
              className="text-lg sm:text-xl font-serif font-extrabold text-white tracking-tight leading-snug drop-shadow-md break-words"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {subject.name}
            </h3>

            <div className="flex items-center gap-2 mt-2 text-xs text-white/80 font-mono">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{units.length} Chapters</span>
              <span>•</span>
              <span>{totalTopics} Topics</span>
            </div>
          </div>

          {/* Bottom Row: Syllabus Mastery Breakdown & Open Book Action */}
          <div className="space-y-3 pt-3 border-t border-white/15">
            {/* Mastery Tally Pills: Weak / Okay / Strong */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-white/90 font-bold">{progressPct}% Mastered</span>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-red-900/60 text-red-200 border border-red-700/50" title="Weak topics">
                  {weakCount} W
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50" title="Okay topics">
                  {okayCount} O
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50" title="Strong topics">
                  {strongCount} S
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
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
              onClick={() => onOpenBook(subject.id)}
              className="w-full py-2.5 rounded-lg bg-black/40 hover:bg-black/60 active:scale-98 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md group-hover:border-amber-400/60"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Open Book (Read Chapters)</span>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 3D Layered Cream Paper Pages Stack (Fore-Edge along Right Edge) */}
        <div 
          className="w-5 shrink-0 rounded-r-md border-y border-r border-stone-400/40"
          style={{
            background: 'repeating-linear-gradient(90deg, #FBF8F1, #FBF8F1 2px, #E7E5E4 2px, #E7E5E4 4px)',
            boxShadow: 'inset 3px 0 5px rgba(0,0,0,0.25), 4px 0 8px rgba(0,0,0,0.3)'
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
                onOpenBook(subject.id, u.id);
              }}
              className="px-1.5 py-1 rounded-r-md text-[10px] font-mono font-extrabold border-y border-r transition-all hover:translate-x-1 active:translate-x-0 shadow-md text-stone-900"
              style={{
                backgroundColor: uIdx % 2 === 0 ? '#FDE68A' : '#FED7AA',
                borderColor: '#B45309',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
              }}
              title={`Open ${formatUnitDisplayName(u)}`}
            >
              <span>Ch {uIdx + 1}</span>
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
