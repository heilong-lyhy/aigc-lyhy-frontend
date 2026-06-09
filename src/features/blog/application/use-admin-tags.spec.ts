// @vitest-environment happy-dom
// src/features/blog/application/use-admin-tags.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/tags-api', () => ({
  createBlogTag: vi.fn(),
  updateBlogTag: vi.fn(),
  deleteBlogTag: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

import type { BlogTag } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { createBlogTag, deleteBlogTag, updateBlogTag } from '../infrastructure/tags-api';

import { useAdminTags } from './use-admin-tags';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockCreateBlogTag = vi.mocked(createBlogTag);
const mockUpdateBlogTag = vi.mocked(updateBlogTag);
const mockDeleteBlogTag = vi.mocked(deleteBlogTag);

const sampleTag: BlogTag = {
  id: '1',
  name: 'TypeScript',
  slug: 'typescript',
  postCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogTag[] | null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminTags', () => {
  // ── 初始状态 ──

  it('returns empty data by default', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    const { result } = renderHook(() => useAdminTags());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mutationError).toBeNull();
  });

  it('isEmpty is true when data is empty and not loading', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useAdminTags());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty is false when loading', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null, isLoading: true }));

    const { result } = renderHook(() => useAdminTags());

    expect(result.current.isEmpty).toBe(false);
  });

  // ── create ──

  describe('create', () => {
    it('creates a tag and refetches', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreateBlogTag.mockResolvedValueOnce(sampleTag);

      const { result } = renderHook(() => useAdminTags());

      let returned: BlogTag | null = null;
      await act(async () => {
        returned = await result.current.create({ name: 'TypeScript', slug: 'typescript' });
      });

      expect(returned).toEqual(sampleTag);
      expect(mockCreateBlogTag).toHaveBeenCalledWith({ name: 'TypeScript', slug: 'typescript' });
      expect(refetch).toHaveBeenCalled();
    });

    it('captures create error and returns null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreateBlogTag.mockRejectedValueOnce(new Error('Duplicate slug'));

      const { result } = renderHook(() => useAdminTags());

      let returned: BlogTag | null = undefined as unknown as BlogTag | null;
      await act(async () => {
        returned = await result.current.create({ name: 'Dup', slug: 'dup' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Duplicate slug');
      expect(refetch).not.toHaveBeenCalled();
    });

    it('captures non-Error rejection with default message', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreateBlogTag.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminTags());

      await act(async () => {
        await result.current.create({ name: 'X', slug: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to create tag');
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates a tag and refetches', async () => {
      const updated = { ...sampleTag, name: 'TypeScript 5', slug: 'typescript-5' };
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdateBlogTag.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useAdminTags());

      let returned: BlogTag | null = null;
      await act(async () => {
        returned = await result.current.update({
          id: 1,
          name: 'TypeScript 5',
          slug: 'typescript-5',
        });
      });

      expect(returned).toEqual(updated);
      expect(mockUpdateBlogTag).toHaveBeenCalledWith({
        id: 1,
        name: 'TypeScript 5',
        slug: 'typescript-5',
      });
      expect(refetch).toHaveBeenCalled();
    });

    it('captures update error and returns null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdateBlogTag.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useAdminTags());

      let returned: BlogTag | null = undefined as unknown as BlogTag | null;
      await act(async () => {
        returned = await result.current.update({ id: 99, name: 'X', slug: 'x' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
      expect(refetch).not.toHaveBeenCalled();
    });

    it('captures non-Error rejection with default message', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdateBlogTag.mockRejectedValueOnce(undefined);

      const { result } = renderHook(() => useAdminTags());

      await act(async () => {
        await result.current.update({ id: 1, name: 'X', slug: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to update tag');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes a tag and refetches', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogTag.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAdminTags());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(true);
      expect(mockDeleteBlogTag).toHaveBeenCalledWith(1);
      expect(refetch).toHaveBeenCalled();
    });

    it('captures delete error and returns false', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogTag.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useAdminTags());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Forbidden');
      expect(refetch).not.toHaveBeenCalled();
    });

    it('captures non-Error rejection with default message', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogTag.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminTags());

      await act(async () => {
        await result.current.remove(1);
      });

      expect(result.current.mutationError).toBe('Failed to delete tag');
    });
  });

  // ── mutationError 清除 ──

  it('clears mutationError before each mutation', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
    mockCreateBlogTag.mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useAdminTags());

    await act(async () => {
      await result.current.create({ name: 'X', slug: 'x' });
    });

    expect(result.current.mutationError).toBe('First error');

    // Second successful call should clear the error
    mockCreateBlogTag.mockResolvedValueOnce(sampleTag);
    await act(async () => {
      await result.current.create({ name: 'Y', slug: 'y' });
    });

    expect(result.current.mutationError).toBeNull();
  });
});
