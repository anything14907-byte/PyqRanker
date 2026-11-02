import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const LiquidAuroraScene: React.FC = () => {
  const { themeMode, liquidMotionEnabled } = useTheme();

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-700"
      style={{
        background: 
          themeMode === 'liquid-light'
            ? 'linear-gradient(135deg, #F0F4FA 0%, #FFFFFF 50%, #F5F7FB 100%)'
            : themeMode === 'pro-cyber'
            ? '#030508'
            : '#090D16'
      }}
    >
      {/* 1. VIBRANT AMBIENT LIGHT ORBS BEHIND THE GLASS (CYAN #00F0FF, INDIGO #6366F1, EMERALD MINT #10B981) */}
      {(themeMode === 'liquid-dark' || themeMode === 'pro-cyber') && (
        <div className={`absolute inset-0 overflow-hidden ${liquidMotionEnabled ? 'opacity-100' : 'opacity-80'}`}>
          {/* Orb 1: Electric Cyan (#00F0FF) */}
          <div 
            className={`absolute -top-24 -left-20 w-[650px] h-[650px] rounded-full blur-[90px] opacity-55 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-1' : ''}`}
            style={{
              background: 'radial-gradient(circle at 40% 40%, #00F0FF, rgba(0, 240, 255, 0.6) 40%, rgba(6, 182, 212, 0.2) 70%, transparent 85%)'
            }}
          />

          {/* Orb 2: Hyper Indigo (#6366F1) */}
          <div 
            className={`absolute top-1/4 -right-28 w-[720px] h-[720px] rounded-full blur-[95px] opacity-55 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-2' : ''}`}
            style={{
              background: 'radial-gradient(circle at 60% 50%, #6366F1, rgba(99, 102, 241, 0.6) 40%, rgba(139, 92, 246, 0.2) 70%, transparent 85%)'
            }}
          />

          {/* Orb 3: Emerald Mint (#10B981) */}
          <div 
            className={`absolute -bottom-32 left-1/4 w-[660px] h-[660px] rounded-full blur-[90px] opacity-50 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-3' : ''}`}
            style={{
              background: 'radial-gradient(circle at 50% 50%, #10B981, rgba(16, 185, 129, 0.55) 40%, rgba(5, 150, 105, 0.2) 70%, transparent 85%)'
            }}
          />

          {/* Micro Liquid Specular Gold Accent Pool */}
          <div 
            className={`absolute top-2/3 right-1/3 w-[460px] h-[460px] rounded-full blur-[100px] opacity-25 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-4' : ''}`}
            style={{
              background: 'radial-gradient(circle at 50% 50%, #F59E0B, rgba(236, 72, 153, 0.3), transparent 75%)'
            }}
          />

          {/* Subtle Caustic Micro Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
        </div>
      )}

      {/* 2. VISIONOS LIQUID DAYLIGHT MESH */}
      {themeMode === 'liquid-light' && (
        <div className={`absolute inset-0 overflow-hidden ${liquidMotionEnabled ? 'opacity-100' : 'opacity-85'}`}>
          {/* Soft Cerulean Sky Pool */}
          <div 
            className={`absolute -top-16 -left-16 w-[580px] h-[580px] rounded-full blur-[90px] opacity-45 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-1' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.4), rgba(56, 189, 248, 0.15), transparent 75%)'
            }}
          />

          {/* Soft Pearlescent Mint Pool */}
          <div 
            className={`absolute top-1/3 -right-16 w-[600px] h-[600px] rounded-full blur-[95px] opacity-40 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-2' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35), rgba(52, 211, 153, 0.15), transparent 75%)'
            }}
          />

          {/* Warm Sunlit Alabaster Pool */}
          <div 
            className={`absolute -bottom-16 left-1/4 w-[560px] h-[560px] rounded-full blur-[90px] opacity-50 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-3' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(254, 243, 199, 0.8), rgba(253, 230, 138, 0.35), transparent 75%)'
            }}
          />
        </div>
      )}
    </div>
  );
};
