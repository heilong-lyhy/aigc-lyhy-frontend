// @vitest-environment happy-dom
// src/features/blog/application/use-admin-friend-links.spec.ts

import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogFriendLink } from '@/entities/blog';

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

vi.mock('../infrastructure', () => ({
  fetchBlogFriendLinks: vi.fn(),
  createBlogFriendLink: vi.fn(),
  updateBlogFriendLink: vi.fn(),
  deleteBlogFriendLink: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import {
  createBlogFriendLink,
  deleteBlogFriendLink,
  updateBlogFriendLink,
} from '../infrastructure';

import { useAdminFriendLinks } from './use-admin-friend-links';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockCreate = vi.mocked(createBlogFriendLink);
const mockUpdate = vi.mocked(updateBlogFriendLink);
const mockRemove = vi.mocked(deleteBlogFriendLink);

const sampleLink: BlogFriendLink = {
  id: '1',
  name: 'Example Blog',
  url: 'https://example.com',
  description: 'A friendly blog',
  logoUrl: null,
  sortOrder: 0,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogFriendLink[] | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminFriendLinks', () => {
  // ── 初始状态 ──

  it('data 为 null 时应返回空数组', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    const { result } = renderHook(() => useAdminFriendLinks());

    expect(result.current.data).toEqual([]);
    expect(result.current.mutationError).toBeNull();
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useAdminFriendLinks());

    expect(result.current.isEmpty).toBe(true);
  });

  // ── create ──

  describe('create', () => {
    it('应创建友链并 refetch', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockResolvedValueOnce(sampleLink);

      const { result } = renderHook(() => useAdminFriendLinks());

      let returned: BlogFriendLink | null = null;
      await act(async () => {
        returned = await result.current.create({
          name: 'Example Blog',
          url: 'https://example.com',
        });
      });

      expect(returned).toEqual(sampleLink);
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Example Blog',
        url: 'https://example.com',
      });
      expect(refetch).toHaveBeenCalled();
    });

    it('创建失败时应捕获错误并返回 null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockRejectedValueOnce(new Error('Duplicate URL'));

      const { result } = renderHook(() => useAdminFriendLinks());

      let returned: BlogFriendLink | null = undefined as unknown as BlogFriendLink | null;
      await act(async () => {
        returned = await result.current.create({ name: 'Dup', url: 'https://dup.com' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Duplicate URL');
      expect(refetch).not.toHaveBeenCalled();
    });

    it('非 Error 拒绝应使用默认消息', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockCreate.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminFriendLinks());

      await act(async () => {
        await result.current.create({ name: 'X', url: 'https://x.com' });
      });

      expect(result.current.mutationError).toBe('Failed to create friend link');
    });
  });

  // ── update ──

  describe('update', () => {
    it('应更新友链并 refetch', async () => {
      const updated = { ...sampleLink, name: 'Updated Blog' };
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdate.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useAdminFriendLinks());

      let returned: BlogFriendLink | null = null;
      await act(async () => {
        returned = await result.current.update({ id: 1, name: 'Updated Blog' });
      });

      expect(returned).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalledWith({ id: 1, name: 'Updated Blog' });
      expect(refetch).toHaveBeenCalled();
    });

    it('更新失败时应捕获错误并返回 null', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdate.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useAdminFriendLinks());

      let returned: BlogFriendLink | null = undefined as unknown as BlogFriendLink | null;
      await act(async () => {
        returned = await result.current.update({ id: 99, name: 'X' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('应删除友链并 refetch', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockRemove.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAdminFriendLinks());

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
      mockRemove.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useAdminFriendLinks());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Forbidden');
      expect(refetch).not.toHaveBeenCalled();
    });
  });

  // ── mutationError 清除 ──

  it('每次 mutation 前应清除 mutationError', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
    mockCreate.mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useAdminFriendLinks());

    await act(async () => {
      await result.current.create({ name: 'X', url: 'https://x.com' });
    });

    expect(result.current.mutationError).toBe('First error');

    mockCreate.mockResolvedValueOnce(sampleLink);
    await act(async () => {
      await result.current.create({ name: 'Y', url: 'https://y.com' });
    });

    expect(result.current.mutationError).toBeNull();
  });
});
