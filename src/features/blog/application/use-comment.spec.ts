// @vitest-environment happy-dom
// src/features/blog/application/use-comment.spec.ts

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/comments-api', () => ({
  createBlogComment: vi.fn(),
  deleteBlogComment: vi.fn(),
}));

import type { BlogComment } from '@/entities/blog';

import { createBlogComment, deleteBlogComment } from '../infrastructure/comments-api';

import { useComment } from './use-comment';

const mockCreateBlogComment = vi.mocked(createBlogComment);
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('useComment', () => {
  it('initializes with idle state', () => {
    const { result } = renderHook(() => useComment());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── submitComment ──

  describe('submitComment', () => {
    it('submits a comment and returns mapped entity', async () => {
      mockCreateBlogComment.mockResolvedValueOnce(sampleComment);

      const { result } = renderHook(() => useComment());

      let submitted: BlogComment | null = null;
      await act(async () => {
        submitted = await result.current.submitComment({
          postId: 'p1',
          authorName: 'User',
          authorEmail: 'user@test.com',
          content: 'Nice post',
        });
      });

      expect(submitted).toEqual(sampleComment);
      expect(mockCreateBlogComment).toHaveBeenCalledWith({
        postId: 'p1',
        authorName: 'User',
        authorEmail: 'user@test.com',
        content: 'Nice post',
      });
    });

    it('sets isSubmitting during submission and resets after success', async () => {
      let resolveSubmit!: (value: BlogComment) => void;
      mockCreateBlogComment.mockReturnValueOnce(
        new Promise((resolve) => { resolveSubmit = resolve; }),
      );

      const { result } = renderHook(() => useComment());

      act(() => {
        void result.current.submitComment({
          postId: 'p1',
          authorName: 'User',
          authorEmail: 'user@test.com',
          content: 'test',
        });
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => {
        resolveSubmit(sampleComment);
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('captures submission error and returns null', async () => {
      mockCreateBlogComment.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useComment());

      let submitted: BlogComment | null = undefined as unknown as BlogComment | null;
      await act(async () => {
        submitted = await result.current.submitComment({
          postId: 'p1',
          authorName: 'User',
          authorEmail: 'user@test.com',
          content: 'test',
        });
      });

      expect(submitted).toBeNull();
      expect(result.current.error).toBe('Server error');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('captures non-Error rejection with default message', async () => {
      mockCreateBlogComment.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.submitComment({
          postId: 'p1',
          authorName: 'User',
          authorEmail: 'user@test.com',
          content: 'test',
        });
      });

      expect(result.current.error).toBe('Failed to submit comment');
    });
  });

  // ── removeComment ──

  describe('removeComment', () => {
    it('deletes a comment and returns true', async () => {
      mockDeleteBlogComment.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useComment());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.removeComment('c1');
      });

      expect(deleted).toBe(true);
      expect(mockDeleteBlogComment).toHaveBeenCalledWith('c1');
    });

    it('returns false when server deletion fails', async () => {
      mockDeleteBlogComment.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useComment());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.removeComment('c1');
      });

      expect(deleted).toBe(false);
    });

    it('captures delete error and returns false', async () => {
      mockDeleteBlogComment.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useComment());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.removeComment('c1');
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe('Forbidden');
      expect(result.current.isDeleting).toBe(false);
    });

    it('captures non-Error delete rejection with default message', async () => {
      mockDeleteBlogComment.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useComment());

      await act(async () => {
        await result.current.removeComment('c1');
      });

      expect(result.current.error).toBe('Failed to delete comment');
    });
  });
});
