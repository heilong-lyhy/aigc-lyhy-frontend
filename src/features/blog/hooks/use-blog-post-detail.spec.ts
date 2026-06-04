// @vitest-environment happy-dom
// src/features/blog/hooks/use-blog-post-detail.spec.ts

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchBlogPostBySlug } from '../infrastructure/posts-api';

import { useBlogPostDetail } from './use-blog-post-detail';

vi.mock('../infrastructure/posts-api', () => ({
  fetchBlogPostBySlug: vi.fn(),
}));

const mockFetchBySlug = vi.mocked(fetchBlogPostBySlug);

const mockPost = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Excerpt',
  content: '# Hello',
  coverImage: null,
  categoryId: 'cat-1',
  tags: ['tag-1'],
  authorId: 'author-1',
  status: 'published' as const,
  isPinned: false,
  viewCount: 10,
  likeCount: 5,
  commentCount: 2,
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useBlogPostDetail', () => {
  it('does not fetch when slug is null', () => {
    renderHook(() => useBlogPostDetail(null));
    expect(mockFetchBySlug).not.toHaveBeenCalled();
  });

  it('fetches post by slug', async () => {
    mockFetchBySlug.mockResolvedValueOnce(mockPost);

    const { result } = renderHook(() => useBlogPostDetail('test-post'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPost);
    });

    expect(mockFetchBySlug).toHaveBeenCalledWith('test-post');
    expect(result.current.isLoading).toBe(false);
  });

  it('reports error when fetch fails', async () => {
    mockFetchBySlug.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useBlogPostDetail('missing'));

    await waitFor(() => {
      expect(result.current.error).toBe('Not found');
    });

    expect(result.current.data).toBeNull();
  });

  it('reports isEmpty as false when data is loaded', async () => {
    mockFetchBySlug.mockResolvedValueOnce(mockPost);

    const { result } = renderHook(() => useBlogPostDetail('test-post'));

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(false);
    });
  });
});
