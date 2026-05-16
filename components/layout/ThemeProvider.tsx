'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { TeacherSettings } from '@/types';
import { setSoundEnabled, setSoundVolume } from '@/lib/sounds';

interface SettingsContextType {
  settings: Partial<TeacherSettings>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
});

// 默认暖橙主题 CSS 变量
const defaultCSS = {
  '--color-primary': '#FF8C42',
  '--color-secondary': '#FFD166',
  '--color-accent': '#EF476F',
  '--color-bg': '#FFF9F0',
  '--color-card-bg': '#FFF5E8',
  '--color-text': '#4A3728',
  '--color-text-secondary': '#8B7E74',
  '--color-success': '#06D6A0',
  '--color-danger': '#EF476F',
  '--color-border': '#FFE0C0',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Partial<TeacherSettings>>({});

  // 应用默认 CSS 变量
  useEffect(() => {
    Object.entries(defaultCSS).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }, []);

  // 加载用户设置（音效等）
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success && d.data) {
          setSettings({
            soundEnabled: d.data.sound_enabled,
            soundVolume: d.data.sound_volume,
            animationsReduced: d.data.animations_reduced,
          });
          setSoundEnabled(d.data.sound_enabled ?? true);
          setSoundVolume(d.data.sound_volume ?? 0.5);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(SettingsContext);
}
