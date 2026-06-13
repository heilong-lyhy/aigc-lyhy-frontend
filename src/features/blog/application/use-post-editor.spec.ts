// @vitest-environment happy-dom
// src/features/blog/application/use-post-editor.spec.ts

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePostEditor } from './use-post-editor';

describe('usePostEditor', () => {
  it('initializes with default form values', () => {
    const { result } = renderHook(() => usePostEditor());

    expect(result.current.form.title).toBe('');
    expect(result.current.form.status).toBe('draft');
    expect(result.current.form.isPinned).toBe(false);
    expect(result.current.form.tags).toEqual([]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.lastSavedAt).toBeNull();
  });

  it('initializes with provided initial values', () => {
    const { result } = renderHook(() =>
      usePostEditor({
        initial: { title: 'Hello', slug: 'hello' },
        initialSavedAt: '2024-01-01T00:00:00Z',
      }),
    );

    expect(result.current.form.title).toBe('Hello');
    expect(result.current.form.slug).toBe('hello');
    expect(result.current.lastSavedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('updates a field and marks form as dirty', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.setTitle('New Title'));

    expect(result.current.form.title).toBe('New Title');
    expect(result.current.isDirty).toBe(true);
  });

  it('updates all field setters', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.setSlug('new-slug'));
    act(() => result.current.setExcerpt('New excerpt'));
    act(() => result.current.setContent('# Content'));
    act(() => result.current.setCoverImage('cover.jpg'));
    act(() => result.current.setCategoryId('cat-1'));
    act(() => result.current.setTags(['tag-1']));
    act(() => result.current.setStatus('published'));
    act(() => result.current.setIsPinned(true));

    expect(result.current.form.slug).toBe('new-slug');
    expect(result.current.form.excerpt).toBe('New excerpt');
    expect(result.current.form.content).toBe('# Content');
    expect(result.current.form.coverImage).toBe('cover.jpg');
    expect(result.current.form.categoryId).toBe('cat-1');
    expect(result.current.form.tags).toEqual(['tag-1']);
    expect(result.current.form.status).toBe('published');
    expect(result.current.form.isPinned).toBe(true);
  });

  it('markSaved updates lastSavedAt', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.markSaved());

    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it('reset restores default values and clears dirty flag', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.setTitle('Changed'));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.reset());

    expect(result.current.form.title).toBe('');
    expect(result.current.isDirty).toBe(false);
  });

  it('reset with values overrides defaults', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.reset({ title: 'Reset Title', slug: 'reset-slug' }));

    expect(result.current.form.title).toBe('Reset Title');
    expect(result.current.form.slug).toBe('reset-slug');
    expect(result.current.form.status).toBe('draft');
  });

  it('reset with savedAt updates lastSavedAt', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.markSaved());
    const savedAt = result.current.lastSavedAt;
    expect(savedAt).not.toBeNull();

    act(() => result.current.reset(undefined, null));
    expect(result.current.lastSavedAt).toBeNull();
  });

  it('reset without savedAt preserves existing lastSavedAt', () => {
    const { result } = renderHook(() => usePostEditor());

    act(() => result.current.markSaved());
    const savedAt = result.current.lastSavedAt;

    act(() => result.current.reset({ title: 'New' }));
    expect(result.current.lastSavedAt).toBe(savedAt);
  });
});
