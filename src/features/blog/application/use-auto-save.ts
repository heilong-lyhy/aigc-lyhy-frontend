// src/features/blog/application/use-auto-save.ts

import { useCallback, useEffect, useRef } from 'react';

import { blogStorage, type DraftData } from '../infrastructure/blog-storage';

type UseAutoSaveOptions = {
  readonly intervalMs?: number;
  readonly enabled?: boolean;
};

type UseAutoSaveInput = Omit<DraftData, 'savedAt'>;

type UseAutoSaveResult = {
  readonly save: (draft: UseAutoSaveInput) => void;
  readonly load: () => DraftData | null;
  readonly clear: () => void;
};

export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveResult {
  const { intervalMs = 5000, enabled = true } = options;

  const draftRef = useRef<UseAutoSaveInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback((draft: UseAutoSaveInput) => {
    draftRef.current = draft;
    blogStorage.saveDraft(draft);
  }, []);

  const load = useCallback((): DraftData | null => {
    return blogStorage.loadDraft();
  }, []);

  const clear = useCallback(() => {
    draftRef.current = null;
    blogStorage.clearDraft();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      if (draftRef.current) {
        blogStorage.saveDraft(draftRef.current);
      }
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [intervalMs, enabled]);

  return { save, load, clear };
}
