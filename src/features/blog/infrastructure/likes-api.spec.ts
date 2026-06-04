// src/features/blog/infrastructure/likes-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { checkBlogLiked, toggleBlogLike } from './likes-api';

const mockExecute = vi.mocked(executeGraphQL);

describe('likes-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── toggleBlogLike ──

  describe('toggleBlogLike', () => {
    it('maps domain input to uppercase targetType and returns mapped result', async () => {
      mockExecute.mockResolvedValueOnce({
        toggleBlogLike: {
          liked: true,
          like: {
            id: 'l1',
            targetType: 'POST',
            targetId: 'p1',
            userId: 'u1',
            fingerprint: null,
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      const result = await toggleBlogLike({ targetType: 'post', targetId: 'p1' });

      expect(result.liked).toBe(true);
      expect(result.like).toEqual({
        id: 'l1',
        targetType: 'post',
        targetId: 'p1',
        userId: 'u1',
        fingerprint: null,
        createdAt: '2024-01-01T00:00:00Z',
      });

      // Verify executeGraphQL was called with uppercase targetType
      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.targetType).toBe('POST');
      expect(variables.input.targetId).toBe('p1');
      expect(options?.authMode).toBe('none');
    });

    it('returns null like when DTO like is null', async () => {
      mockExecute.mockResolvedValueOnce({
        toggleBlogLike: { liked: false, like: null },
      });

      const result = await toggleBlogLike({ targetType: 'comment', targetId: 'c1' });

      expect(result.liked).toBe(false);
      expect(result.like).toBeNull();
    });

    it('passes fingerprint when provided', async () => {
      mockExecute.mockResolvedValueOnce({
        toggleBlogLike: { liked: true, like: null },
      });

      await toggleBlogLike({ targetType: 'post', targetId: 'p1', fingerprint: 'fp123' });

      expect(mockExecute.mock.calls[0][1].input.fingerprint).toBe('fp123');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        toggleBlogLike({ targetType: 'post', targetId: 'p1' }),
      ).rejects.toThrow('Network failure');
    });
  });

  // ── checkBlogLiked ──

  describe('checkBlogLiked', () => {
    it('returns liked status from API', async () => {
      mockExecute.mockResolvedValueOnce({
        blogLikeStatus: { liked: true },
      });

      const result = await checkBlogLiked('post', 'p1');

      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.targetType).toBe('POST');
      expect(variables.targetId).toBe('p1');
      expect(options?.authMode).toBe('none');
    });

    it('returns false when not liked', async () => {
      mockExecute.mockResolvedValueOnce({
        blogLikeStatus: { liked: false },
      });

      const result = await checkBlogLiked('comment', 'c1');

      expect(result).toBe(false);
      expect(mockExecute.mock.calls[0][1].targetType).toBe('COMMENT');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Server error'));

      await expect(checkBlogLiked('post', 'p1')).rejects.toThrow('Server error');
    });
  });
});
