// src/shared/theme-storage/index.ts

export type FontScale = 'compact' | 'standard' | 'comfortable';

const STORAGE_KEY_FONT_SCALE = 'font-scale';
const STORAGE_KEY_COLOR_SCHEME = 'color-scheme';

const VALID_FONT_SCALES: readonly FontScale[] = ['compact', 'standard', 'comfortable'];

export function readStoredFontScale(): FontScale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FONT_SCALE);

    if (saved && (VALID_FONT_SCALES as readonly string[]).includes(saved)) {
      return saved as FontScale;
    }
  } catch {
    // Storage can be unavailable in restricted browsers.
  }

  return 'standard';
}

export function writeStoredFontScale(scale: FontScale) {
  try {
    localStorage.setItem(STORAGE_KEY_FONT_SCALE, scale);
  } catch {
    // Storage can be unavailable in restricted browsers.
  }
}

export function readStoredColorScheme(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_COLOR_SCHEME) === 'dark';
  } catch {
    return false;
  }
}

export function writeStoredColorScheme(isDark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_COLOR_SCHEME, isDark ? 'dark' : 'light');
  } catch {
    // Storage can be unavailable in restricted browsers.
  }
}
