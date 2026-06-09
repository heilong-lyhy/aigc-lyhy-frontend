// @vitest-environment happy-dom
// src/features/blog/application/use-blog-search.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogPost, PaginatedResult } from '@/entities/blog';

vi.mock('../infrastructure/blog-storage', () => ({
  blogStorage: {
    getSearchHistory: vi.fn(() => []),
    addSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
  },
}));

vi.mock('../infrastructure/posts-api', () => ({
  fetchBlogPublishedPosts: vi.fn(),
}));

import { blogStorage } from '../infrastructure/blog-storage';
import { fetchBlogPublishedPosts } from '../infrastructure/posts-api';

import { useBlogSearch } from './use-blog-search';

const mockFetchBlogPublishedPosts = vi.mocked(fetchBlogPublishedPosts);
const mockGetSearchHistory = vi.mocked(blogStorage.getSearchHistory);
const mockAddSearchHistory = vi.mocked(blogStorage.addSearchHistory);
const mockClearSearchHistory = vi.mocked(blogStorage.clearSearchHistory);

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

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogSearch', () => {
  // ── 初始状态 ──

  it('应返回初始默认状态', () => {
    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.filters.keyword).toBe('');
    expect(result.current.searchHistory).toEqual([]);
  });

  // ── setFilters ──

  it('setFilters 应更新 filters 状态', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValueOnce(samplePage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ sortBy: 'title' });
    });

    expect(result.current.filters.sortBy).toBe('title');
  });

  it('setFilters(keyword) 应触发防抖搜索', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValue(samplePage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'react' });
    });

    // 等待防抖回调执行
    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    expect(mockFetchBlogPublishedPosts).toHaveBeenCalled();
  });

  // ── 搜索历史 ──

  it('搜索成功时应将关键词添加到搜索历史', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValueOnce(samplePage);
    mockGetSearchHistory.mockReturnValueOnce(['react']);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'react' });
    });

    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    expect(mockAddSearchHistory).toHaveBeenCalledWith('react');
  });

  it('空关键词不应添加到搜索历史', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValue(samplePage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    // 先设置非空关键词触发搜索
    await act(async () => {
      result.current.setFilters({ keyword: 'react' });
    });

    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    mockAddSearchHistory.mockClear();

    // 清空关键词不应添加历史
    await act(async () => {
      result.current.setFilters({ keyword: '' });
    });

    expect(mockAddSearchHistory).not.toHaveBeenCalled();
  });

  // ── clearFilters ──

  it('clearFilters 应重置 filters 和 data', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValue(samplePage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'test' });
    });

    expect(result.current.filters.keyword).toBe('test');

    await act(async () => {
      result.current.clearFilters();
    });

    expect(result.current.filters.keyword).toBe('');
    expect(result.current.data).toBeNull();
  });

  // ── resetSearchSession ──

  it('resetSearchSession 应清除搜索历史和 filters', async () => {
    mockGetSearchHistory.mockReturnValue(['old-keyword']);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.resetSearchSession();
    });

    expect(mockClearSearchHistory).toHaveBeenCalled();
    expect(result.current.searchHistory).toEqual([]);
    expect(result.current.filters.keyword).toBe('');
  });

  // ── 错误路径 ──

  it('搜索失败时应设置 error 状态', async () => {
    mockFetchBlogPublishedPosts.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'fail' });
    });

    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('非 Error 类型的拒绝应使用默认错误消息', async () => {
    mockFetchBlogPublishedPosts.mockRejectedValueOnce('unknown');

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'fail' });
    });

    // 等待防抖回调执行
    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    expect(result.current.error).toBe('Search failed');
  });

  // ── isEmpty ──

  it('isEmpty 应在结果为空列表且非加载/错误时为 true', async () => {
    const emptyPage: PaginatedResult<BlogPost> = {
      items: [],
      total: 0,
      current: 1,
      pageSize: 10,
    };
    mockFetchBlogPublishedPosts.mockResolvedValueOnce(emptyPage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'nothing' });
    });

    // 等待防抖回调执行
    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(false);
  });

  // ── refetch ──

  it('refetch 应重新执行搜索', async () => {
    mockFetchBlogPublishedPosts.mockResolvedValue(samplePage);

    const { result } = renderHook(() =>
      useBlogSearch({ pagination: { page: 1, pageSize: 10 }, debounceMs: 0 }),
    );

    await act(async () => {
      result.current.setFilters({ keyword: 'test' });
    });

    // 等待防抖回调执行
    await act(async () => {
      await new Promise((r) => { setTimeout(r, 10); });
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFetchBlogPublishedPosts).toHaveBeenCalledTimes(2);
  });
});
