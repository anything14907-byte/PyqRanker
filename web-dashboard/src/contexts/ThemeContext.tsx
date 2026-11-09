import React, { createContext, useContext, useEffect, useState } from 'react';

export type VisualMode = 'liquid-dark' | 'liquid-light' | 'pro-cyber';
export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: VisualMode;
  visualMode: VisualMode;
  liquidMotionEnabled: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: VisualMode) => void;
  setVisualMode: (mode: VisualMode) => void;
  setLiquidMotionEnabled: (enabled: boolean) => void;
  toggleLiquidMotion: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<VisualMode>(() => {
    const savedMode = localStorage.getItem('pyq_visual_mode_v2');
    if (savedMode === 'liquid-dark' || savedMode === 'liquid-light' || savedMode === 'pro-cyber') {
      return savedMode;
    }
    const legacy = localStorage.getItem('pyq_ranker_theme_v1');
    if (legacy === 'light') return 'liquid-light';
    if (legacy === 'dark') return 'liquid-dark';

    // System preference fallback
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'liquid-light';
    }
    return 'liquid-dark'; // Apple Liquid Glass (Default)
  });

  const [liquidMotionEnabled, setLiquidMotionEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('pyq_liquid_motion_v1');
    return saved !== null ? saved === 'true' : true;
  });

  const theme: Theme = themeMode === 'liquid-light' ? 'light' : 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    root.setAttribute('data-liquid-motion', liquidMotionEnabled ? 'true' : 'false');
    document.body.setAttribute('data-theme', themeMode);
    document.body.setAttribute('data-liquid-motion', liquidMotionEnabled ? 'true' : 'false');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }

    localStorage.setItem('pyq_visual_mode_v2', themeMode);
    localStorage.setItem('pyq_ranker_theme_v1', theme);

    // Sync browser theme-color meta tag with active theme
    const activeColor = theme === 'light' ? '#FAF8F5' : '#090D16';
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    if (metaTags.length > 0) {
      metaTags.forEach(tag => tag.setAttribute('content', activeColor));
    } else {
      const metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      metaThemeColor.setAttribute('content', activeColor);
      document.head.appendChild(metaThemeColor);
    }
  }, [themeMode, theme, liquidMotionEnabled]);

  const toggleTheme = () => {
    setThemeModeState(prev => (prev === 'liquid-light' ? 'liquid-dark' : 'liquid-light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeModeState(newTheme === 'light' ? 'liquid-light' : 'liquid-dark');
  };

  const setThemeMode = (newMode: VisualMode) => {
    setThemeModeState(newMode);
  };

  const setLiquidMotionEnabled = (enabled: boolean) => {
    setLiquidMotionEnabledState(enabled);
    localStorage.setItem('pyq_liquid_motion_v1', String(enabled));
  };

  const toggleLiquidMotion = () => {
    setLiquidMotionEnabled(!liquidMotionEnabled);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeMode,
        visualMode: themeMode,
        liquidMotionEnabled, 
        toggleTheme, 
        setTheme, 
        setThemeMode,
        setVisualMode: setThemeMode,
        setLiquidMotionEnabled,
        toggleLiquidMotion
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
