// src/features/blog/infrastructure/comments-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogComment,
  deleteBlogComment,
  fetchBlogComments,
  mapBlogComment,
  updateBlogCommentStatus,
} from './comments-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleDTO = {
  id: 'c1',
  postId: 'p1',
  authorName: 'Alice',
  authorEmail: 'alice@test.com',
  authorAvatar: null,
  content: 'Nice post!',
  status: 'APPROVED' as const,
  parentId: null,
  replyToId: null,
  nestingLevel: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('comments-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── mapBlogComment (mapper unit test) ──

  describe('mapBlogComment', () => {
    it('maps DTO to domain entity with lowercase status', () => {
      const result = mapBlogComment(sampleDTO);

      expect(result.status).toBe('approved');
      expect(result.id).toBe('c1');
      expect(result.authorAvatar).toBeNull();
    });

    it('maps PENDING status correctly', () => {
      const result = mapBlogComment({ ...sampleDTO, status: 'PENDING' });
      expect(result.status).toBe('pending');
    });

    it('maps REJECTED status correctly', () => {
      const result = mapBlogComment({ ...sampleDTO, status: 'REJECTED' });
      expect(result.status).toBe('rejected');
    });
  });

  // ── fetchBlogComments ──

  describe('fetchBlogComments', () => {
    it('fetches and maps comment list', async () => {
      mockExecute.mockResolvedValueOnce({
        blogComments: {
          items: [sampleDTO],
          total: 1,
          offset: 0,
          limit: 20,
          hasMore: false,
        },
      });

      const result = await fetchBlogComments('p1', { offset: 0, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('approved');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.postId).toBe('p1');
      expect(variables.offset).toBe(0);
      expect(variables.limit).toBe(20);
      expect(options?.authMode).toBe('none');
    });

    it('passes uppercase status filter', async () => {
      mockExecute.mockResolvedValueOnce({
        blogComments: { items: [], total: 0, offset: 0, limit: 20, hasMore: false },
      });

      await fetchBlogComments('p1', { offset: 0, limit: 20 }, { status: 'approved' });

      expect(mockExecute.mock.calls[0][1].status).toBe('APPROVED');
    });

    it('omits status when no filter provided', async () => {
      mockExecute.mockResolvedValueOnce({
        blogComments: { items: [], total: 0, offset: 0, limit: 20, hasMore: false },
      });

      await fetchBlogComments('p1', { offset: 0, limit: 20 });

      expect(mockExecute.mock.calls[0][1].status).toBeUndefined();
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        fetchBlogComments('p1', { offset: 0, limit: 20 }),
      ).rejects.toThrow('Network failure');
    });
  });

  // ── createBlogComment ──

  describe('createBlogComment', () => {
    it('creates a comment and returns mapped entity', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogComment: { ...sampleDTO, status: 'PENDING' },
      });

      const result = await createBlogComment({
        postId: 'p1',
        authorName: 'Alice',
        authorEmail: 'alice@test.com',
        content: 'Nice post!',
      });

      expect(result.status).toBe('pending');
      expect(result.id).toBe('c1');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.postId).toBe('p1');
      expect(options?.authMode).toBe('none');
    });

    it('passes parentId and replyToId when provided', async () => {
      mockExecute.mockResolvedValueOnce({ createBlogComment: sampleDTO });

      await createBlogComment({
        postId: 'p1',
        authorName: 'Bob',
        authorEmail: 'bob@test.com',
        content: 'Reply',
        parentId: 'c1',
        replyToId: 'c1',
      });

      expect(mockExecute.mock.calls[0][1].input.parentId).toBe('c1');
      expect(mockExecute.mock.calls[0][1].input.replyToId).toBe('c1');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Validation error'));

      await expect(
        createBlogComment({
          postId: 'p1',
          authorName: 'Alice',
          authorEmail: 'alice@test.com',
          content: 'Test',
        }),
      ).rejects.toThrow('Validation error');
    });
  });

  // ── updateBlogCommentStatus ──

  describe('updateBlogCommentStatus', () => {
    it('updates status with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogCommentStatus: { ...sampleDTO, status: 'APPROVED' },
      });

      const result = await updateBlogCommentStatus('c1', 'approved');

      expect(result.status).toBe('approved');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('c1');
      expect(variables.status).toBe('APPROVED');
      expect(options?.authMode).toBe('required');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(updateBlogCommentStatus('c1', 'approved')).rejects.toThrow('Unauthorized');
    });
  });

  // ── deleteBlogComment ──

  describe('deleteBlogComment', () => {
    it('deletes a comment with auth required', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogComment: true });

      const result = await deleteBlogComment('c1');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('c1');
      expect(options?.authMode).toBe('required');
    });

    it('returns false when deletion fails on server', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogComment: false });

      const result = await deleteBlogComment('c1');

      expect(result).toBe(false);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(deleteBlogComment('c1')).rejects.toThrow('Forbidden');
    });
  });
});
