// @vitest-environment happy-dom
// src/features/blog/hooks/use-blog-comments.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the infrastructure layer to prevent Apollo Client loading
vi.mock('../infrastructure/comments-api', () => ({
  fetchBlogCommentsByPost: vi.fn(),
}));

// Mock the shared layer to prevent full dependency chain and OOM
vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogComments } from './use-blog-comments';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('useBlogComments', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to useAsyncQuery with autoLoad true by default', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ isLoading: true }));

    renderHook(() =>
      useBlogComments({ postId: 1, pagination: { page: 1, pageSize: 20 } }),
    );

    expect(mockUseAsyncQuery).toHaveBeenCalledWith(
      expect.objectContaining({ autoLoad: true }),
    );
  });

  it('passes autoLoad false when specified', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogComments({
        postId: 1,
        pagination: { page: 1, pageSize: 20 },
        autoLoad: false,
      }),
    );

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('reports isEmpty when data has no items and not loading', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({
        data: { items: [], total: 0, current: 1, pageSize: 20 },
      }),
    );

    const { result } = renderHook(() =>
      useBlogComments({ postId: 1, pagination: { page: 1, pageSize: 20 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });

  it('reports isEmpty as false when data has items', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({
        data: {
          items: [{ id: 'c1' }],
          total: 1,
          current: 1,
          pageSize: 20,
        },
      }),
    );

    const { result } = renderHook(() =>
      useBlogComments({ postId: 1, pagination: { page: 1, pageSize: 20 } }),
    );

    expect(result.current.isEmpty).toBe(false);
  });

  it('propagates error from useAsyncQuery', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ error: 'Server error' }),
    );

    const { result } = renderHook(() =>
      useBlogComments({ postId: 1, pagination: { page: 1, pageSize: 20 } }),
    );

    expect(result.current.error).toBe('Server error');
    expect(result.current.data).toBeNull();
  });

  it('fetcher validates postId is not zero', async () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogComments({ postId: 0, pagination: { page: 1, pageSize: 20 } }),
    );

    const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];
    await expect(fetcher()).rejects.toThrow('postId is required');
  });

  it('fetcher calls fetchBlogCommentsByPost with correct arguments', async () => {
    const { fetchBlogCommentsByPost } = await import('../infrastructure/comments-api');
    const mockFetch = vi.mocked(fetchBlogCommentsByPost);
    mockFetch.mockResolvedValueOnce({
      items: [],
      total: 0,
      current: 1,
      pageSize: 20,
    });
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useBlogComments({ postId: 1, pagination: { page: 1, pageSize: 20 } }),
    );

    const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];
    await fetcher();

    expect(mockFetch).toHaveBeenCalledWith(1, { page: 1, pageSize: 20 });
  });
});
