import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const HangingBulbToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [isSwinging, setIsSwinging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isLight = themeMode === 'liquid-light';

  const handlePullCord = () => {
    if (isPulling) return;
    setIsPulling(true);
    setIsSwinging(true);

    // Toggle theme halfway through pull
    setTimeout(() => {
      setThemeMode(isLight ? 'liquid-dark' : 'liquid-light');
    }, 180);

    // Release pull bounce
    setTimeout(() => {
      setIsPulling(false);
    }, 420);

    // Stop pendulum swing after natural decay
    setTimeout(() => {
      setIsSwinging(false);
    }, 1800);
  };

  return (
    <>
      {/* 1. Dramatic Volumetric Overhead Spotlight Cone (Zero-Lag CSS Conic Gradient) */}
      <div 
        className="pointer-events-none fixed top-0 right-0 left-0 bottom-0 z-30 transition-opacity duration-700"
        style={{
          background: isLight
            ? 'conic-gradient(from 180deg at calc(100vw - 110px) 0%, transparent 40%, rgba(254, 243, 199, 0.22) 50%, transparent 60%)'
            : 'conic-gradient(from 180deg at calc(100vw - 110px) 0%, transparent 41%, rgba(245, 158, 11, 0.15) 50%, transparent 59%)',
          opacity: 1
        }}
      />

      {/* Secondary Ambient Desk Pool Light */}
      <div 
        className="pointer-events-none fixed top-0 right-[20px] sm:right-[70px] w-80 h-80 rounded-full z-20 transition-all duration-700"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(254, 240, 138, 0.18) 0%, rgba(253, 230, 138, 0.05) 55%, transparent 75%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.04) 55%, transparent 75%)',
          transform: 'translateY(-20px)'
        }}
      />

      {/* 2. Interactive Hanging Fixture Container */}
      <aside 
        aria-label="Theme switcher light fixture"
        className="fixed top-0 right-[20px] sm:right-[90px] z-[60] flex flex-col items-center select-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Ceiling Mount Brass Rosette */}
        <div 
          className="w-5 h-2 rounded-b-sm bg-stone-700 border-b border-amber-600/50 shadow-md"
          style={{ background: 'linear-gradient(to right, #44403C, #78716C, #44403C)' }}
        />

        {/* Dynamic Cord + Bulb Assembly with Pull Physics */}
        <div 
          onClick={handlePullCord}
          className={`flex flex-col items-center cursor-pointer transition-transform duration-500 origin-top ${
            isSwinging ? 'animate-bulb-swing' : ''
          }`}
          style={{
            transform: isPulling 
              ? 'translate3d(0, 22px, 0)' 
              : 'translate3d(0, 0, 0)',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          title={isLight ? 'Pull cord to switch to Night Mode' : 'Pull cord to switch to Day Mode'}
        >
          {/* Studio Braided Wire Cord */}
          <div 
            className="w-[2.5px] h-9 sm:h-12 bg-stone-800 dark:bg-stone-900 border-x border-stone-700/60 shadow-xs"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #292524, #292524 3px, #44403C 3px, #44403C 5px)'
            }}
          />

          {/* Brass Bulb Socket */}
          <div 
            className="w-4 h-3 rounded-t-xs border border-amber-600/70 shadow-sm"
            style={{
              background: 'linear-gradient(to right, #78350F, #D97706, #B45309, #78350F)'
            }}
          />

          {/* SVG Filament Light Bulb */}
          <div className="relative -mt-[1px] flex flex-col items-center">
            <svg 
              width="32" 
              height="44" 
              viewBox="0 0 32 44" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              {/* Glass Envelope */}
              <path 
                d="M10 2H22V6C22 7.5 23 8.5 24 9.5C26.5 12 28 15.5 28 19.5C28 26.1274 22.6274 31.5 16 31.5C9.37258 31.5 4 26.1274 4 19.5C4 15.5 5.5 12 8 9.5C9 8.5 10 7.5 10 6V2Z" 
                fill={isLight ? 'rgba(254, 240, 138, 0.45)' : 'rgba(245, 158, 11, 0.28)'}
                stroke={isLight ? '#F59E0B' : '#D97706'}
                strokeWidth="1.2"
              />

              {/* Internal Filament Structure */}
              <path 
                d="M13 5L13 14L15 17L16 14L17 17L19 14L19 5" 
                stroke={isLight ? '#D97706' : '#F59E0B'} 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Glowing Filament Coil Loop */}
              <circle 
                cx="16" 
                cy="17" 
                r="3.5" 
                fill={isLight ? '#FEF08A' : '#F59E0B'} 
                className="transition-colors duration-300"
                style={{
                  filter: isLight 
                    ? 'drop-shadow(0 0 8px rgba(253, 224, 71, 0.9))' 
                    : 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.95))'
                }}
              />

              {/* Glass Specular Glare Reflection */}
              <path 
                d="M7 16C7 13.5 8 11.5 9.5 10" 
                stroke="#FFFFFF" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                opacity={isLight ? 0.75 : 0.45}
              />
            </svg>

            {/* Pull Cord Wire descending from bulb base */}
            <div className="w-[1.5px] h-7 bg-stone-500/80 dark:bg-stone-400/80 -mt-2" />

            {/* Brass Pull Handle / Tassel */}
            <div 
              className="w-2.5 h-4 rounded-full border border-amber-600 shadow-md transition-transform hover:scale-125"
              style={{
                background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 60%, #78350F 100%)'
              }}
            />
          </div>
        </div>

        {/* Hover Tooltip / Status Badge */}
        {showTooltip && (
          <div 
            className="absolute top-28 right-0 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold whitespace-nowrap shadow-xl border animate-fade-in pointer-events-none"
            style={{
              backgroundColor: isLight ? '#1C1917' : '#F5F5F4',
              color: isLight ? '#F5F5F4' : '#1C1917',
              borderColor: isLight ? '#44403C' : '#D6D3D1',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
            }}
          >
            <span>💡 {isLight ? 'Pull for Night Mode' : 'Pull for Day Mode'}</span>
          </div>
        )}
      </aside>
    </>
  );
};
