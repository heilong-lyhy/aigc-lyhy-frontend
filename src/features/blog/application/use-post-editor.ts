// src/features/blog/application/use-post-editor.ts

import { useCallback, useState } from 'react';

import type { BlogPostStatus, PostEditorForm } from '@/entities/blog';

type UsePostEditorOptions = {
  readonly initial?: Partial<PostEditorForm>;
  readonly initialSavedAt?: string | null;
};

type UsePostEditorResult = {
  readonly form: PostEditorForm;
  readonly isDirty: boolean;
  readonly lastSavedAt: string | null;
  readonly setTitle: (value: string) => void;
  readonly setSlug: (value: string) => void;
  readonly setExcerpt: (value: string) => void;
  readonly setContent: (value: string) => void;
  readonly setCoverImage: (value: string) => void;
  readonly setCategoryId: (value: string) => void;
  readonly setTags: (value: readonly string[]) => void;
  readonly setStatus: (value: BlogPostStatus) => void;
  readonly setIsPinned: (value: boolean) => void;
  readonly markSaved: () => void;
  readonly reset: (values?: Partial<PostEditorForm>, savedAt?: string | null) => void;
};

const DEFAULT_FORM: PostEditorForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  categoryId: '',
  tags: [],
  status: 'draft',
  isPinned: false,
};

export function usePostEditor(options: UsePostEditorOptions = {}): UsePostEditorResult {
  const { initial, initialSavedAt } = options;

  const [form, setForm] = useState<PostEditorForm>(() => ({
    ...DEFAULT_FORM,
    ...initial,
  }));
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSavedAt ?? null);

  const updateField = useCallback(<K extends keyof PostEditorForm>(key: K, value: PostEditorForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const setTitle = useCallback((value: string) => updateField('title', value), [updateField]);
  const setSlug = useCallback((value: string) => updateField('slug', value), [updateField]);
  const setExcerpt = useCallback((value: string) => updateField('excerpt', value), [updateField]);
  const setContent = useCallback((value: string) => updateField('content', value), [updateField]);
  const setCoverImage = useCallback((value: string) => updateField('coverImage', value), [updateField]);
  const setCategoryId = useCallback((value: string) => updateField('categoryId', value), [updateField]);
  const setTags = useCallback((value: readonly string[]) => updateField('tags', value), [updateField]);
  const setStatus = useCallback((value: BlogPostStatus) => updateField('status', value), [updateField]);
  const setIsPinned = useCallback((value: boolean) => updateField('isPinned', value), [updateField]);

  const markSaved = useCallback(() => {
    setLastSavedAt(new Date().toISOString());
  }, []);

  const reset = useCallback((values?: Partial<PostEditorForm>, savedAt?: string | null) => {
    setForm({ ...DEFAULT_FORM, ...values });
    setIsDirty(false);
    if (savedAt !== undefined) {
      setLastSavedAt(savedAt);
    }
  }, []);

  return {
    form,
    isDirty,
    lastSavedAt,
    setTitle,
    setSlug,
    setExcerpt,
    setContent,
    setCoverImage,
    setCategoryId,
    setTags,
    setStatus,
    setIsPinned,
    markSaved,
    reset,
  };
}
