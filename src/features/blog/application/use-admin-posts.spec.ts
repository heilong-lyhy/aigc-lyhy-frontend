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
  restoreBlogPost: vi.fn(),
  permanentDeleteBlogPost: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

import type { BlogPost, BlogPostDetail, PaginatedResult } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPostById,
  permanentDeleteBlogPost,
  restoreBlogPost,
  updateBlogPost,
} from '../infrastructure/posts-api';

import { useAdminPosts } from './use-admin-posts';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockCreateBlogPost = vi.mocked(createBlogPost);
const mockUpdateBlogPost = vi.mocked(updateBlogPost);
const mockDeleteBlogPost = vi.mocked(deleteBlogPost);
const mockFetchBlogPostById = vi.mocked(fetchBlogPostById);
const mockRestoreBlogPost = vi.mocked(restoreBlogPost);
const mockPermanentDeleteBlogPost = vi.mocked(permanentDeleteBlogPost);

const samplePost: BlogPost = {
  id: 'p1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'excerpt',
  coverImage: null,
  categoryId: 1,
  categoryName: 'Tech',
  status: 'published',
  isPinned: false,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  publishedAt: '2024-06-01T00:00:00Z',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const samplePostDetail: BlogPostDetail = {
  ...samplePost,
  content: 'Full content here',
  renderedContent: '<p>Full content here</p>',
  tags: [],
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

    renderHook(() => useAdminPosts({ pagination: { page: 1, pageSize: 10 } }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  // ── create ──

  describe('create', () => {
    it('creates a post and returns mapped entity', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockCreateBlogPost.mockResolvedValueOnce(samplePostDetail);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = null;
      await act(async () => {
        returned = await result.current.create({
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'excerpt',
          content: 'Full content here',
          categoryId: 1,
          tags: [],
          status: 'published',
        });
      });

      expect(returned).toEqual(samplePostDetail);
      expect(mockCreateBlogPost).toHaveBeenCalledTimes(1);
    });

    it('captures create error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockCreateBlogPost.mockRejectedValueOnce(new Error('Validation error'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = undefined as unknown as BlogPostDetail | null;
      await act(async () => {
        returned = await result.current.create({
          title: 'Test',
          slug: 'test',
          content: '',
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
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.create({
          title: 'Test',
          slug: 'test',
          content: '',
          status: 'draft',
        });
      });

      expect(result.current.mutationError).toBe('Failed to create post');
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates a post and returns mapped entity', async () => {
      const updated = { ...samplePostDetail, title: 'Updated' };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockResolvedValueOnce(updated);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = null;
      await act(async () => {
        returned = await result.current.update({ id: 1, title: 'Updated' });
      });

      expect(returned).toEqual(updated);
      expect(mockUpdateBlogPost).toHaveBeenCalledWith({ id: 1, title: 'Updated' });
    });

    it('captures update error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockRejectedValueOnce(new Error('Conflict'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = undefined as unknown as BlogPostDetail | null;
      await act(async () => {
        returned = await result.current.update({ id: 1, title: 'x' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Conflict');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.update({ id: 1, title: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to update post');
    });
  });

  // ── loadById ──

  describe('loadById', () => {
    it('loads a post by id and returns mapped entity', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockFetchBlogPostById.mockResolvedValueOnce(samplePostDetail);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = null;
      await act(async () => {
        returned = await result.current.loadById(1);
      });

      expect(returned).toEqual(samplePostDetail);
      expect(mockFetchBlogPostById).toHaveBeenCalledWith(1);
    });

    it('captures loadById error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockFetchBlogPostById.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = undefined as unknown as BlogPostDetail | null;
      await act(async () => {
        returned = await result.current.loadById(999);
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
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(true);
    });

    it('captures delete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogPost.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.remove(1);
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
      useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });

  // ── restore ──

  describe('restore', () => {
    it('restores a deleted post and returns detail', async () => {
      const restored = { ...samplePostDetail, status: 'draft' as const };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockRestoreBlogPost.mockResolvedValueOnce(restored);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = null;
      await act(async () => {
        returned = await result.current.restore(1);
      });

      expect(returned).toEqual(restored);
      expect(mockRestoreBlogPost).toHaveBeenCalledWith(1);
    });

    it('calls refetch after successful restore', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockRestoreBlogPost.mockResolvedValueOnce(samplePostDetail);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.restore(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('captures restore error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockRestoreBlogPost.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogPostDetail | null = undefined as unknown as BlogPostDetail | null;
      await act(async () => {
        returned = await result.current.restore(999);
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockRestoreBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.restore(1);
      });

      expect(result.current.mutationError).toBe('Failed to restore post');
    });
  });

  // ── permanentDelete ──

  describe('permanentDelete', () => {
    it('permanently deletes a post and returns true', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockPermanentDeleteBlogPost.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.permanentDelete(1);
      });

      expect(deleted).toBe(true);
      expect(mockPermanentDeleteBlogPost).toHaveBeenCalledWith(1);
    });

    it('calls refetch after successful permanentDelete', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockPermanentDeleteBlogPost.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.permanentDelete(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('does not call refetch when permanentDelete returns false', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockPermanentDeleteBlogPost.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.permanentDelete(999);
      });

      expect(refetch).not.toHaveBeenCalled();
    });

    it('captures permanentDelete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockPermanentDeleteBlogPost.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = true;
      await act(async () => {
        deleted = await result.current.permanentDelete(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockPermanentDeleteBlogPost.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.permanentDelete(1);
      });

      expect(result.current.mutationError).toBe('Failed to permanently delete post');
    });
  });

  // ── refetch after mutation ──

  describe('refetch after mutation', () => {
    it('calls refetch after successful update', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdateBlogPost.mockResolvedValueOnce(samplePostDetail);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.update({ id: 1, title: 'Updated' });
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('calls refetch after successful remove', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogPost.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.remove(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('does not call refetch when remove returns false', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogPost.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useAdminPosts({ pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.remove(1);
      });

      expect(refetch).not.toHaveBeenCalled();
    });
  });
});
