// src/features/blog/infrastructure/comments-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogComment,
  deleteBlogComment,
  fetchBlogComments,
  fetchBlogCommentsByPost,
  mapBlogComment,
  updateBlogCommentStatus,
} from './comments-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogCommentObjectType 响应 ──

const sampleCommentDTO = {
  id: 1,
  postId: 10,
  parentId: null,
  replyToId: null,
  authorName: '张三',
  authorAvatar: 'https://example.com/avatar.png',
  content: '好文章！',
  status: 'APPROVED' as const,
  nestingLevel: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const sampleCommentListResponse = {
  list: [sampleCommentDTO],
  current: 1,
  pageSize: 10,
  total: 1,
};

describe('comments-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── mapBlogComment：DTO → Entity 映射 ───

  describe('mapBlogComment', () => {
    it('应正确映射后端 DTO 到前端实体', () => {
      const result = mapBlogComment(sampleCommentDTO);

      expect(result.id).toBe('1'); // number → string
      expect(result.postId).toBe(10);
      expect(result.parentId).toBeNull();
      expect(result.replyToId).toBeNull();
      expect(result.authorName).toBe('张三');
      expect(result.authorAvatar).toBe('https://example.com/avatar.png');
      expect(result.content).toBe('好文章！');
      expect(result.status).toBe('approved'); // APPROVED → approved
      expect(result.nestingLevel).toBe(0);
    });

    it('应映射 PENDING 状态', () => {
      const result = mapBlogComment({ ...sampleCommentDTO, status: 'PENDING' });
      expect(result.status).toBe('pending');
    });

    it('应映射 REJECTED 状态', () => {
      const result = mapBlogComment({ ...sampleCommentDTO, status: 'REJECTED' });
      expect(result.status).toBe('rejected');
    });

    it('authorAvatar 为 null 时应保留 null', () => {
      const result = mapBlogComment({ ...sampleCommentDTO, authorAvatar: null });
      expect(result.authorAvatar).toBeNull();
    });
  });

  // ─── fetchBlogCommentsByPost：公开查询 ───

  describe('fetchBlogCommentsByPost', () => {
    it('应调用 blogCommentsByPost 查询', async () => {
      mockExecute.mockResolvedValueOnce({ blogCommentsByPost: sampleCommentListResponse });

      const result = await fetchBlogCommentsByPost(10, { page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('approved');
      expect(result.total).toBe(1);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.postId).toBe(10);
      expect(variables.page).toBe(1);
      expect(variables.limit).toBe(10);
      expect(options?.authMode).toBe('none');
    });
  });

  // ─── fetchBlogComments：管理端查询 ───

  describe('fetchBlogComments', () => {
    it('应调用 blogPosts 查询（管理端）', async () => {
      mockExecute.mockResolvedValueOnce({ blogComments: sampleCommentListResponse });

      const result = await fetchBlogComments({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('required');
    });

    it('应传递筛选参数（status 大写化）', async () => {
      mockExecute.mockResolvedValueOnce({ blogComments: { list: [], current: 1, pageSize: 10, total: 0 } });

      await fetchBlogComments({ page: 1, pageSize: 10 }, { status: 'pending', postId: 10 });

      const variables = mockExecute.mock.calls[0][1];
      expect(variables.status).toBe('PENDING');
      expect(variables.postId).toBe(10);
    });
  });

  // ─── createBlogComment ───

  describe('createBlogComment', () => {
    it('应创建评论', async () => {
      mockExecute.mockResolvedValueOnce({ createBlogComment: sampleCommentDTO });

      const result = await createBlogComment({
        postId: 10,
        authorName: '张三',
        authorEmail: 'test@example.com',
        content: '好文章！',
      });

      expect(result.content).toBe('好文章！');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.postId).toBe(10);
      expect(options?.authMode).toBe('none');
    });
  });

  // ─── updateBlogCommentStatus ───

  describe('updateBlogCommentStatus', () => {
    it('应更新评论状态（status 大写化）', async () => {
      mockExecute.mockResolvedValueOnce({ updateBlogCommentStatus: { ...sampleCommentDTO, status: 'REJECTED' } });

      const result = await updateBlogCommentStatus({ id: 1, status: 'rejected' });

      expect(result.status).toBe('rejected');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.id).toBe(1);
      expect(variables.input.status).toBe('REJECTED');
      expect(options?.authMode).toBe('required');
    });
  });

  // ─── deleteBlogComment ───

  describe('deleteBlogComment', () => {
    it('应删除评论', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogComment: true });

      const result = await deleteBlogComment(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });
  });
});
