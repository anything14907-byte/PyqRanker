import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const StudioLampSwitch: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const isLight = themeMode === 'liquid-light';

  const handleToggle = () => {
    setThemeMode(isLight ? 'liquid-dark' : 'liquid-light');
  };

  return (
    <>
      {/* Subtle Top-Edge Architectural Studio Light Bar (Fixed across desk ceiling) */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none transition-opacity duration-500"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, transparent 5%, #D97706 25%, #FEF3C7 50%, #D97706 75%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, #B45309 25%, #F59E0B 50%, #B45309 75%, transparent 95%)',
          boxShadow: isLight
            ? '0 1px 12px rgba(245, 158, 11, 0.45)'
            : '0 1px 16px rgba(245, 158, 11, 0.65)'
        }}
      />

      {/* Tactile Machined Brass & Matte Onyx Studio Lamp Switch */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative px-3 py-1.5 rounded-xl border flex items-center gap-2 select-none transition-all duration-200 active:scale-95 shadow-sm group"
        style={{
          background: isLight 
            ? 'linear-gradient(180deg, #FDFBF7 0%, #EFE9DC 100%)' 
            : 'linear-gradient(180deg, #1A1D24 0%, #0E1015 100%)',
          borderColor: isLight ? '#D1C7B7' : '#333842',
          boxShadow: isLight 
            ? 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 4px rgba(40,30,20,0.08)' 
            : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 5px rgba(0,0,0,0.45)'
        }}
        title={isLight ? 'Switch to Library Night Mode' : 'Switch to Archival Day Mode'}
      >
        {/* Illuminated Warm LED Indicator Diode */}
        <span 
          className="w-2 h-2 rounded-full transition-all duration-300 shrink-0"
          style={{
            backgroundColor: isLight ? '#F59E0B' : '#10B981',
            boxShadow: isLight 
              ? '0 0 6px rgba(245, 158, 11, 0.9), 0 0 12px rgba(245, 158, 11, 0.4)' 
              : '0 0 7px rgba(16, 185, 129, 0.95), 0 0 14px rgba(16, 185, 129, 0.5)'
          }}
        />

        {/* Switch Icon & Agency Typography */}
        <div className="flex items-center gap-1.5">
          {isLight ? (
            <>
              <Moon className="w-3.5 h-3.5 text-stone-700 group-hover:text-stone-900 transition-colors" />
              <span className="text-xs font-mono font-bold text-stone-800 whitespace-nowrap">
                Library Night
              </span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-xs font-mono font-bold text-stone-200 whitespace-nowrap">
                Archival Day
              </span>
            </>
          )}
        </div>
      </button>
    </>
  );
};
