import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ConfigProvider } from 'antd';

import { createAppThemeConfig } from '@/app/theme';

import {
  readStoredColorScheme,
  readStoredFontScale,
  writeStoredColorScheme,
  writeStoredFontScale,
} from '@/shared/theme-storage';

import { FONT_SCALE_CONFIG, type FontScale } from './theme-constants';
import { ThemeContext } from './use-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(readStoredColorScheme);
  const [fontScale, setFontScale] = useState<FontScale>(readStoredFontScale);
  const themeConfig = useMemo(
    () =>
      createAppThemeConfig({
        fontSize: FONT_SCALE_CONFIG[fontScale].antdFontSize,
        isDark,
      }),
    [fontScale, isDark],
  );

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE_CONFIG[fontScale].htmlFontSize;
    writeStoredFontScale(fontScale);
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    writeStoredColorScheme(isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ fontScale, isDark, setFontScale, setIsDark }}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}