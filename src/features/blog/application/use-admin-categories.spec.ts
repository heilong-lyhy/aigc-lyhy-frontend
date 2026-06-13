// @vitest-environment happy-dom
// src/features/blog/application/use-admin-categories.spec.ts

import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogCategory } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
  useMutationError: () => {
    const [mutationError, setMutationErrorState] = React.useState<string | null>(null);
    const setMutationError = vi.fn((message: string) => {
      setMutationErrorState(message);
    });
    const clearMutationError = vi.fn(() => {
      setMutationErrorState(null);
    });
    return { mutationError, setMutationError, clearMutationError };
  },
}));

vi.mock('../infrastructure/categories-api', () => ({
  createBlogCategory: vi.fn(),
  updateBlogCategory: vi.fn(),
  deleteBlogCategory: vi.fn(),
  fetchBlogCategoryTree: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { createBlogCategory, deleteBlogCategory, updateBlogCategory } from '../infrastructure/categories-api';

import { useAdminCategories } from './use-admin-categories';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockCreate = vi.mocked(createBlogCategory);
const mockUpdate = vi.mocked(updateBlogCategory);
const mockRemove = vi.mocked(deleteBlogCategory);

const sampleCategory: BlogCategory = {
  id: '1',
  name: '技术',
  slug: 'tech',
  description: null,
  postCount: 5,
  parentId: null,
  sortOrder: 0,
  children: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogCategory[] | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminCategories', () => {
  // ── 初始状态 ──

  it('data 为 null 时应返回空数组', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    const { result } = renderHook(() => useAdminCategories());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mutationError).toBeNull();
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useAdminCategories());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null, isLoading: true }));

    const { result } = renderHook(() => useAdminCategories());

    expect(result.current.isEmpty).toBe(false);
  });

  // ── create ──

  describe('create', () => {
    it('应创建分类并 refetch', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockResolvedValueOnce(sampleCategory);

      const { result } = renderHook(() => useAdminCategories());

      let returned: BlogCategory | null = null;
      await act(async () => {
        returned = await result.current.create({ name: '技术', slug: 'tech' });
      });

      expect(returned).toEqual(sampleCategory);
      expect(mockCreate).toHaveBeenCalledWith({ name: '技术', slug: 'tech' });
      expect(refetch).toHaveBeenCalled();
    });

    it('创建失败时应捕获错误并返回 null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockRejectedValueOnce(new Error('Duplicate slug'));

      const { result } = renderHook(() => useAdminCategories());

      let returned: BlogCategory | null = undefined as unknown as BlogCategory | null;
      await act(async () => {
        returned = await result.current.create({ name: 'Dup', slug: 'dup' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Duplicate slug');
      expect(refetch).not.toHaveBeenCalled();
    });

    it('非 Error 拒绝应使用默认消息', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminCategories());

      await act(async () => {
        await result.current.create({ name: 'X', slug: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to create category');
    });
  });

  // ── update ──

  describe('update', () => {
    it('应更新分类并 refetch', async () => {
      const updated = { ...sampleCategory, name: '技术 2' };
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdate.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useAdminCategories());

      let returned: BlogCategory | null = null;
      await act(async () => {
        returned = await result.current.update({ id: 1, name: '技术 2' });
      });

      expect(returned).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalledWith({ id: 1, name: '技术 2' });
      expect(refetch).toHaveBeenCalled();
    });

    it('更新失败时应捕获错误并返回 null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdate.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useAdminCategories());

      let returned: BlogCategory | null = undefined as unknown as BlogCategory | null;
      await act(async () => {
        returned = await result.current.update({ id: 99, name: 'X' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('应删除分类并 refetch', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockRemove.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAdminCategories());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(1);
      expect(refetch).toHaveBeenCalled();
    });

    it('删除失败时应捕获错误并返回 false', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockRemove.mockRejectedValueOnce(new Error('Has posts'));

      const { result } = renderHook(() => useAdminCategories());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Has posts');
      expect(refetch).not.toHaveBeenCalled();
    });
  });

  // ── mutationError 清除 ──

  it('每次 mutation 前应清除 mutationError', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
    mockCreate.mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useAdminCategories());

    await act(async () => {
      await result.current.create({ name: 'X', slug: 'x' });
    });

    expect(result.current.mutationError).toBe('First error');

    mockCreate.mockResolvedValueOnce(sampleCategory);
    await act(async () => {
      await result.current.create({ name: 'Y', slug: 'y' });
    });

    expect(result.current.mutationError).toBeNull();
  });
});
