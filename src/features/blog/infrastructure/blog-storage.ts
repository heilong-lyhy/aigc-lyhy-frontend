// src/features/blog/infrastructure/blog-storage.ts

// ── 安全 Storage 工具 ──

const KEY_PREFIX = 'blog:';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // SSR/SSG 或隐私模式下 localStorage 不可用
  }
  return null;
}

function getItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(`${KEY_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(`${KEY_PREFIX}${key}`, value);
  } catch {
    // quota exceeded 或隐私模式下写入失败，静默忽略
  }
}

function removeItem(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${KEY_PREFIX}${key}`);
  } catch {
    // 静默忽略
  }
}

// ── Storage 键名常量 ──

const STORAGE_KEY_DRAFT = 'draft';
const STORAGE_KEY_SEARCH_HISTORY = 'search-history';
const STORAGE_KEY_ADMIN_PREFERENCES = 'admin-preferences';

// ── 草稿自动保存 ──

export interface DraftData {
  readonly title: string;
  readonly content: string;
  readonly categoryId: string | null;
  readonly tags: readonly string[];
  readonly savedAt: string;
}

export const blogStorage = {
  // ── 草稿 ──

  saveDraft(draft: Omit<DraftData, 'savedAt'>): void {
    const data: DraftData = { ...draft, savedAt: new Date().toISOString() };
    setItem(STORAGE_KEY_DRAFT, JSON.stringify(data));
  },

  loadDraft(): DraftData | null {
    const raw = getItem(STORAGE_KEY_DRAFT);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  },

  clearDraft(): void {
    removeItem(STORAGE_KEY_DRAFT);
  },

  // ── 搜索历史 ──

  getSearchHistory(): readonly string[] {
    const raw = getItem(STORAGE_KEY_SEARCH_HISTORY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === 'string');
    } catch {
      return [];
    }
  },

  addSearchHistory(keyword: string, maxItems: number = 20): void {
    const history = [...this.getSearchHistory()].filter((item) => item !== keyword);
    history.unshift(keyword);
    setItem(STORAGE_KEY_SEARCH_HISTORY, JSON.stringify(history.slice(0, maxItems)));
  },

  clearSearchHistory(): void {
    removeItem(STORAGE_KEY_SEARCH_HISTORY);
  },

  // ── 管理端偏好设置 ──

  getAdminPreferences(): Readonly<Record<string, unknown>> {
    const raw = getItem(STORAGE_KEY_ADMIN_PREFERENCES);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  },

  setAdminPreference(key: string, value: unknown): void {
    const prefs = { ...this.getAdminPreferences(), [key]: value };
    setItem(STORAGE_KEY_ADMIN_PREFERENCES, JSON.stringify(prefs));
  },

  clearAdminPreferences(): void {
    removeItem(STORAGE_KEY_ADMIN_PREFERENCES);
  },
} as const;
