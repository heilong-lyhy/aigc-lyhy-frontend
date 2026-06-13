// @vitest-environment happy-dom
// src/features/blog/application/use-blog-dashboard.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogDashboard } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/dashboard-api', () => ({
  fetchBlogDashboard: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogDashboard } from './use-blog-dashboard';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

const sampleDashboard: BlogDashboard = {
  totalPosts: 10,
  publishedPosts: 7,
  draftPosts: 3,
  totalCategories: 3,
  totalTags: 5,
  totalComments: 20,
  pendingComments: 2,
  totalLikes: 50,
  totalViews: 1000,
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as BlogDashboard | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogDashboard', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogDashboard());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogDashboard({ autoLoad: false }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: sampleDashboard }));

    const { result } = renderHook(() => useBlogDashboard());

    expect(result.current.data).toEqual(sampleDashboard);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应返回加载状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ isLoading: true }));

    const { result } = renderHook(() => useBlogDashboard());

    expect(result.current.isLoading).toBe(true);
  });

  it('应返回错误状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ error: 'Network error' }));

    const { result } = renderHook(() => useBlogDashboard());

    expect(result.current.error).toBe('Network error');
  });

  it('isEmpty 在 data 非 null 且非加载/错误时为 true（当前逻辑：data !== null 即视为"空状态已解除"）', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: sampleDashboard }));

    const { result } = renderHook(() => useBlogDashboard());

    // isEmpty 逻辑: data !== null && !isLoading && !error
    // 有数据时 isEmpty=true，语义上不太直观但这是当前实现
    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 在 data 为 null 且非加载/错误时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null }));

    const { result } = renderHook(() => useBlogDashboard());

    expect(result.current.isEmpty).toBe(false);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() => useBlogDashboard());

    expect(result.current.refetch).toBe(refetch);
  });

  // ── useMockFallback ──

  describe('useMockFallback', () => {
    it('fetcher 在 useMockFallback=true 时应回退到 mock 数据', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogDashboard({ useMockFallback: true }));

      const fetcher = mockUseAsyncQuery.mock.calls[0][0].fetcher;

      // 模拟 fetchBlogDashboard 抛出异常
      const { fetchBlogDashboard } = await import('../infrastructure/dashboard-api');
      vi.mocked(fetchBlogDashboard).mockRejectedValueOnce(new Error('API down'));

      // 动态 import mock 模块
      const mockModule = await import('../infrastructure/mock');
      const mockDashboard: BlogDashboard = { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalCategories: 0, totalTags: 0, totalComments: 0, pendingComments: 0, totalLikes: 0, totalViews: 0 };
      vi.spyOn(mockModule, 'mockBlogDashboard', 'get').mockReturnValue(mockDashboard);

      const result = await fetcher();

      expect(result).toEqual(mockDashboard);
    });

    it('fetcher 在 useMockFallback=false 时应直接抛出异常', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogDashboard({ useMockFallback: false }));

      const fetcher = mockUseAsyncQuery.mock.calls[0][0].fetcher;

      const { fetchBlogDashboard } = await import('../infrastructure/dashboard-api');
      vi.mocked(fetchBlogDashboard).mockRejectedValueOnce(new Error('API down'));

      await expect(fetcher()).rejects.toThrow('API down');
    });
  });
});
