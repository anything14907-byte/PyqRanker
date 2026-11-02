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
      {/* 1. FLUID ORGANIC AURORA MESH (INDIGO, CYAN, MAGENTA, SOLAR AMBER) */}
      {themeMode === 'liquid-dark' && (
        <div className={`absolute inset-0 overflow-hidden ${liquidMotionEnabled ? 'opacity-100' : 'opacity-70'}`}>
          {/* Shifting Cyan & Azure Pool */}
          <div 
            className={`absolute -top-32 -left-20 w-[680px] h-[680px] rounded-full blur-[130px] opacity-40 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-1' : ''}`}
            style={{
              background: 'radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.5), transparent 70%)'
            }}
          />

          {/* Shifting Indigo & Violet Pool */}
          <div 
            className={`absolute top-1/4 -right-32 w-[720px] h-[720px] rounded-full blur-[140px] opacity-35 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-2' : ''}`}
            style={{
              background: 'radial-gradient(circle at 60% 50%, rgba(99, 102, 241, 0.75), rgba(168, 85, 247, 0.45), transparent 70%)'
            }}
          />

          {/* Magenta & Rose Specular Pool */}
          <div 
            className={`absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full blur-[140px] opacity-25 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-3' : ''}`}
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.7), rgba(139, 92, 246, 0.4), transparent 70%)'
            }}
          />

          {/* Deep Amber Solar Specular Glow */}
          <div 
            className={`absolute top-2/3 right-1/4 w-[480px] h-[480px] rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-4' : ''}`}
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.65), rgba(244, 63, 94, 0.3), transparent 70%)'
            }}
          />

          {/* Micro Liquid Caustic Grid Texture */}
          <div 
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />
        </div>
      )}

      {/* 2. VISIONOS LIQUID DAYLIGHT MESH */}
      {themeMode === 'liquid-light' && (
        <div className={`absolute inset-0 overflow-hidden ${liquidMotionEnabled ? 'opacity-100' : 'opacity-80'}`}>
          {/* Sky Cerulean Pool */}
          <div 
            className={`absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full blur-[110px] opacity-35 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-1' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35), rgba(56, 189, 248, 0.15), transparent 70%)'
            }}
          />

          {/* Soft Pearlescent Lavender Pool */}
          <div 
            className={`absolute top-1/3 -right-20 w-[620px] h-[620px] rounded-full blur-[120px] opacity-30 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-2' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3), rgba(192, 132, 252, 0.1), transparent 70%)'
            }}
          />

          {/* Warm Sunlit Alabaster Pool */}
          <div 
            className={`absolute -bottom-20 left-1/4 w-[580px] h-[580px] rounded-full blur-[110px] opacity-40 pointer-events-none ${liquidMotionEnabled ? 'animate-aurora-blob-3' : ''}`}
            style={{
              background: 'radial-gradient(circle, rgba(254, 243, 199, 0.7), rgba(253, 230, 138, 0.3), transparent 70%)'
            }}
          />
        </div>
      )}

      {/* 3. PRO CYBER STUDIO MESH (Obsidian with Neon Cyan & Amber Grid) */}
      {themeMode === 'pro-cyber' && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[130px] opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7), transparent 70%)'
            }}
          />
          <div 
            className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full blur-[120px] opacity-15 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.6), transparent 70%)'
            }}
          />
          {/* Subtle Cyber Grid */}
          <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(56, 189, 248, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
        </div>
      )}
    </div>
  );
};
