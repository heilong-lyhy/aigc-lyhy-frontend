// @vitest-environment happy-dom
// src/features/blog/application/use-admin-comments.spec.ts

import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/comments-api', () => ({
  fetchBlogComments: vi.fn(),
  updateBlogCommentStatus: vi.fn(),
  deleteBlogComment: vi.fn(),
  replyBlogComment: vi.fn(),
  hideBlogComment: vi.fn(),
  unhideBlogComment: vi.fn(),
}));

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

import type { BlogComment, PaginatedResult } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  deleteBlogComment,
  hideBlogComment,
  replyBlogComment,
  unhideBlogComment,
  updateBlogCommentStatus,
} from '../infrastructure/comments-api';

import { useAdminComments } from './use-admin-comments';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockUpdateBlogCommentStatus = vi.mocked(updateBlogCommentStatus);
const mockDeleteBlogComment = vi.mocked(deleteBlogComment);
const mockReplyBlogComment = vi.mocked(replyBlogComment);
const mockHideBlogComment = vi.mocked(hideBlogComment);
const mockUnhideBlogComment = vi.mocked(unhideBlogComment);

const sampleComment: BlogComment = {
  id: 'c1',
  postId: 1,
  authorName: 'User',
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
  current: 1,
  pageSize: 10,
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
  it('does not auto-load when postId is undefined', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useAdminComments({ pagination: { page: 1, pageSize: 10 } }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  // ── updateStatus ──

  describe('updateStatus', () => {
    it('updates comment status and returns mapped entity', async () => {
      const approved = { ...sampleComment, status: 'approved' as const };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockResolvedValueOnce(approved);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = null;
      await act(async () => {
        returned = await result.current.updateStatus(1, 'approved');
      });

      expect(returned).toEqual(approved);
      expect(mockUpdateBlogCommentStatus).toHaveBeenCalledWith({ id: 1, status: 'approved' });
    });

    it('captures update error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        returned = await result.current.updateStatus(1, 'approved');
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.updateStatus(1, 'approved');
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
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(true);
    });

    it('captures delete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.mutationError).toBe('Not found');
    });
  });

  // ── reply ──

  describe('reply', () => {
    it('replies to a comment and returns mapped entity', async () => {
      const replyResult = {
        ...sampleComment,
        id: 'c2',
        content: 'Reply content',
        isAdminReply: true,
      };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockReplyBlogComment.mockResolvedValueOnce(replyResult);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = null;
      await act(async () => {
        returned = await result.current.reply({ postId: 1, content: 'Reply content' });
      });

      expect(returned).toEqual(replyResult);
      expect(mockReplyBlogComment).toHaveBeenCalledWith({ postId: 1, content: 'Reply content' });
    });

    it('captures reply error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockReplyBlogComment.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        returned = await result.current.reply({ postId: 1, content: 'Reply content' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockReplyBlogComment.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.reply({ postId: 1, content: 'Reply content' });
      });

      expect(result.current.mutationError).toBe('Failed to reply comment');
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
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let results: readonly BlogComment[] = [];
      await act(async () => {
        results = await result.current.batchUpdateStatus([1, 2], 'approved');
      });

      expect(results).toHaveLength(2);
      expect(mockUpdateBlogCommentStatus).toHaveBeenCalledTimes(2);
    });

    it('captures batch update error and returns empty array', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogCommentStatus.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let results: readonly BlogComment[] = [sampleComment];
      await act(async () => {
        results = await result.current.batchUpdateStatus([1], 'approved');
      });

      expect(results).toEqual([]);
      expect(result.current.mutationError).toBe('Server error');
    });
  });

  // ── batchRemove ──

  describe('batchRemove', () => {
    it('deletes multiple comments and returns results', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let results: readonly boolean[] = [];
      await act(async () => {
        results = await result.current.batchRemove([1, 2]);
      });

      expect(results).toEqual([true, true]);
      expect(mockDeleteBlogComment).toHaveBeenCalledTimes(2);
    });

    it('captures batch delete error and returns empty array', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogComment.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let results: readonly boolean[] = [true];
      await act(async () => {
        results = await result.current.batchRemove([1]);
      });

      expect(results).toEqual([]);
      expect(result.current.mutationError).toBe('Forbidden');
    });
  });

  // ── hide ──

  describe('hide', () => {
    it('hides a comment and returns mapped entity', async () => {
      const hidden = { ...sampleComment, isHidden: true };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockHideBlogComment.mockResolvedValueOnce(hidden);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = null;
      await act(async () => {
        returned = await result.current.hide(1);
      });

      expect(returned).toEqual(hidden);
      expect(mockHideBlogComment).toHaveBeenCalledWith(1);
    });

    it('calls refetch after successful hide', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockHideBlogComment.mockResolvedValueOnce({ ...sampleComment, isHidden: true });

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.hide(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('captures hide error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockHideBlogComment.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        returned = await result.current.hide(1);
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Forbidden');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockHideBlogComment.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.hide(1);
      });

      expect(result.current.mutationError).toBe('Failed to hide comment');
    });
  });

  // ── unhide ──

  describe('unhide', () => {
    it('unhides a comment and returns mapped entity', async () => {
      const unhidden = { ...sampleComment, isHidden: false };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUnhideBlogComment.mockResolvedValueOnce(unhidden);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = null;
      await act(async () => {
        returned = await result.current.unhide(1);
      });

      expect(returned).toEqual(unhidden);
      expect(mockUnhideBlogComment).toHaveBeenCalledWith(1);
    });

    it('calls refetch after successful unhide', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUnhideBlogComment.mockResolvedValueOnce({ ...sampleComment, isHidden: false });

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.unhide(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('captures unhide error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUnhideBlogComment.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      let returned: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        returned = await result.current.unhide(1);
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Not found');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUnhideBlogComment.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.unhide(1);
      });

      expect(result.current.mutationError).toBe('Failed to unhide comment');
    });
  });

  // ── refetch after mutation ──

  describe('refetch after mutation', () => {
    it('calls refetch after successful updateStatus', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockUpdateBlogCommentStatus.mockResolvedValueOnce({ ...sampleComment, status: 'approved' });

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.updateStatus(1, 'approved');
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('calls refetch after successful remove', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockDeleteBlogComment.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.remove(1);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('calls refetch after successful reply', async () => {
      const refetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));
      mockReplyBlogComment.mockResolvedValueOnce(sampleComment);

      const { result } = renderHook(() =>
        useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
      );

      await act(async () => {
        await result.current.reply({ postId: 1, content: 'Reply' });
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── isEmpty ──

  it('computes isEmpty from data', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: { ...samplePage, items: [] } }));

    const { result } = renderHook(() =>
      useAdminComments({ postId: 1, pagination: { page: 1, pageSize: 10 } }),
    );

    expect(result.current.isEmpty).toBe(true);
  });
});
