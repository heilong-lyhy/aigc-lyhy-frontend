// @vitest-environment happy-dom
// src/features/blog/application/use-admin-posts.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/posts-api', () => ({
  fetchBlogPosts: vi.fn(),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  fetchBlogPostById: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

import type { BlogPost, PaginatedResult } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPostById,
  updateBlogPost,
} from '../infrastructure/posts-api';

import { useAdminPosts } from './use-admin-posts';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockCreateBlogPost = vi.mocked(createBlogPost);
const mockUpdateBlogPost = vi.mocked(updateBlogPost);
const mockDeleteBlogPost = vi.mocked(deleteBlogPost);
const mockFetchBlogPostById = vi.mocked(fetchBlogPostById);

const samplePost: BlogPost = {
  id: 'p1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'excerpt',
  content: 'content',
  coverImage: null,
  categoryId: 'cat-1',
  tags: [],
  authorId: 'author-1',
  status: 'published',
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
  offset: 0,
  limit: 10,
  hasMore: false,
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as PaginatedResult<BlogPost> | null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminPosts', () => {
  it('auto-loads by default', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useAdminPosts({ pagination: { offset: 0, limit: 10 } }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  // ── create ──

  describe('create', () => {
    it('creates a post and returns mapped entity', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockCreateBlogPost.mockResolvedValueOnce(samplePost);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = null;
      await act(async () => {
        returned = await result.current.create({
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'excerpt',
          content: 'content',
          categoryId: 'cat-1',
          tags: [],
          status: 'published',
        });
      });

      expect(returned).toEqual(samplePost);
      expect(mockCreateBlogPost).toHaveBeenCalledTimes(1);
    });

    it('captures create error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockCreateBlogPost.mockRejectedValueOnce(new Error('Validation error'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = undefined as unknown as BlogPost | null;
      await act(async () => {
        returned = await result.current.create({
          title: 'Test',
          slug: 'test',
          excerpt: '',
          content: '',
          categoryId: 'cat-1',
          tags: [],
          status: 'draft',
        });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Validation error');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockCreateBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      await act(async () => {
        await result.current.create({
          title: 'Test',
          slug: 'test',
          excerpt: '',
          content: '',
          categoryId: 'cat-1',
          tags: [],
          status: 'draft',
        });
      });

      expect(result.current.mutationError).toBe('Failed to create post');
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates a post and returns mapped entity', async () => {
      const updated = { ...samplePost, title: 'Updated' };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockResolvedValueOnce(updated);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = null;
      await act(async () => {
        returned = await result.current.update('p1', { title: 'Updated' });
      });

      expect(returned).toEqual(updated);
      expect(mockUpdateBlogPost).toHaveBeenCalledWith('p1', { title: 'Updated' });
    });

    it('captures update error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockRejectedValueOnce(new Error('Conflict'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = undefined as unknown as BlogPost | null;
      await act(async () => {
        returned = await result.current.update('p1', { title: 'x' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Conflict');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      await act(async () => {
        await result.current.update('p1', { title: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to update post');
    });
  });

  // ── loadById ──

  describe('loadById', () => {
    it('loads a post by id and returns mapped entity', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockFetchBlogPostById.mockResolvedValueOnce(samplePost);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = null;
      await act(async () => {
        returned = await result.current.loadById('p1');
      });

      expect(returned).toEqual(samplePost);
      expect(mockFetchBlogPostById).toHaveBeenCalledWith('p1');
    });

    it('captures loadById error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockFetchBlogPostById.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogPost | null = undefined as unknown as BlogPost | null;
      await act(async () => {
        returned = await result.current.loadById('nonexistent');
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes a post and returns true', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogPost.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove('p1');
      });

      expect(deleted).toBe(true);
    });

    it('captures delete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogPost.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove('p1');
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
      );

      await act(async () => {
        await result.current.remove('p1');
      });

      expect(result.current.mutationError).toBe('Failed to delete post');
    });
  });

  // ── isEmpty ──

  it('computes isEmpty from data', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: { ...samplePage, items: [] } }),
    );

    const { result } = renderHook(() =>
      useAdminPosts({ pagination: { offset: 0, limit: 10 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });
});
