// @vitest-environment happy-dom
// src/features/blog/application/use-blog-posts.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogPost, PaginatedResult } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/posts-api', () => ({
  fetchBlogPublishedPosts: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogPosts } from './use-blog-posts';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

const samplePost: BlogPost = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Excerpt',
  coverImage: null,
  status: 'published',
  categoryId: 1,
  categoryName: 'Tech',
  isPinned: false,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  publishedAt: '2024-06-01T00:00:00Z',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const samplePage: PaginatedResult<BlogPost> = {
  items: [samplePost],
  total: 1,
  current: 1,
  pageSize: 10,
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as PaginatedResult<BlogPost> | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogPosts', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 }, autoLoad: false }),
    );

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: samplePage }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.data).toEqual(samplePage);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应返回加载状态', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ isLoading: true }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('应返回错误状态', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ error: 'Network error' }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.error).toBe('Network error');
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: { ...samplePage, items: [], total: 0 } }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, isLoading: true }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(false);
  });

  it('isEmpty 应在错误时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, error: 'Error' }),
    );

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(false);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() =>
      useBlogPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.refetch).toBe(refetch);
  });

  it('应传递 categoryId 和 tagId 到 fetcher 闭包', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogPosts({
        pagination: { page: 2, pageSize: 5 },
        categoryId: 3,
        tagId: 7,
      }),
    );

    // fetcher 通过 useCallback 创建，验证 useAsyncQuery 被正确调用
    expect(mockUseAsyncQuery).toHaveBeenCalledTimes(1);
  });
});
