// @vitest-environment happy-dom
// src/features/blog/application/use-admin-comments.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/comments-api', () => ({
  fetchBlogComments: vi.fn(),
  updateBlogCommentStatus: vi.fn(),
  deleteBlogComment: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

import type { BlogComment, PaginatedResult } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  deleteBlogComment,
  updateBlogCommentStatus,
} from '../infrastructure/comments-api';

import { useAdminComments } from './use-admin-comments';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockUpdateBlogCommentStatus = vi.mocked(updateBlogCommentStatus);
const mockDeleteBlogComment = vi.mocked(deleteBlogComment);

const sampleComment: BlogComment = {
  id: 'c1',
  postId: 'p1',
  authorName: 'User',
  authorEmail: 'user@test.com',
  authorAvatar: null,
  content: 'Nice post',
  status: 'pending',
  parentId: null,
  replyToId: null,
  nestingLevel: 0,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const samplePage: PaginatedResult<BlogComment> = {
  items: [sampleComment],
  total: 1,
  offset: 0,
  limit: 10,
  hasMore: false,
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as PaginatedResult<BlogComment> | null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminComments', () => {
  it('does not auto-load when postId is empty', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useAdminComments({ postId: '', pagination: { offset: 0, limit: 10 } }),
    );

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  // ── updateStatus ──

  describe('updateStatus', () => {
    it('updates comment status and returns mapped entity', async () => {
      const approved = { ...sampleComment, status: 'approved' as const };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockResolvedValueOnce(approved);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogComment | null = null;
      await act(async () => {
        returned = await result.current.updateStatus('c1', 'approved');
      });

      expect(returned).toEqual(approved);
      expect(mockUpdateBlogCommentStatus).toHaveBeenCalledWith('c1', 'approved');
    });

    it('captures update error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let returned: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        returned = await result.current.updateStatus('c1', 'approved');
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      await act(async () => {
        await result.current.updateStatus('c1', 'approved');
      });

      expect(result.current.mutationError).toBe('Failed to update comment status');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes a comment and returns true', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove('c1');
      });

      expect(deleted).toBe(true);
    });

    it('captures delete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove('c1');
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Not found');
    });
  });

  // ── batchUpdateStatus ──

  describe('batchUpdateStatus', () => {
    it('updates multiple comments and returns results', async () => {
      const approved = { ...sampleComment, status: 'approved' as const };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus
        .mockResolvedValueOnce(approved)
        .mockResolvedValueOnce({ ...approved, id: 'c2' });

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let results: readonly BlogComment[] = [];
      await act(async () => {
        results = await result.current.batchUpdateStatus(['c1', 'c2'], 'approved');
      });

      expect(results).toHaveLength(2);
      expect(mockUpdateBlogCommentStatus).toHaveBeenCalledTimes(2);
    });

    it('captures batch update error and returns empty array', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let results: readonly BlogComment[] = [sampleComment];
      await act(async () => {
        results = await result.current.batchUpdateStatus(['c1'], 'approved');
      });

      expect(results).toEqual([]);
      expect(result.current.mutationError).toBe('Server error');
    });
  });

  // ── batchRemove ──

  describe('batchRemove', () => {
    it('deletes multiple comments and returns results', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let results: readonly boolean[] = [];
      await act(async () => {
        results = await result.current.batchRemove(['c1', 'c2']);
      });

      expect(results).toEqual([true, true]);
      expect(mockDeleteBlogComment).toHaveBeenCalledTimes(2);
    });

    it('captures batch delete error and returns empty array', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
      );

      let results: readonly boolean[] = [true];
      await act(async () => {
        results = await result.current.batchRemove(['c1']);
      });

      expect(results).toEqual([]);
      expect(result.current.mutationError).toBe('Forbidden');
    });
  });

  // ── isEmpty ──

  it('computes isEmpty from data', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: { ...samplePage, items: [] } }),
    );

    const { result } = renderHook(() =>
      useAdminComments({ postId: 'p1', pagination: { offset: 0, limit: 10 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });
});
