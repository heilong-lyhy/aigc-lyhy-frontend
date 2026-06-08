// src/features/blog/infrastructure/likes-api.spec.ts
// 契约测试：验证前端与后端点赞接口对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { checkBlogPostLiked, toggleBlogPostLike } from './likes-api';

const mockExecute = vi.mocked(executeGraphQL);

describe('likes-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleBlogPostLike', () => {
    it('应调用 toggleBlogPostLike mutation', async () => {
      mockExecute.mockResolvedValueOnce({ toggleBlogPostLike: true });

      const result = await toggleBlogPostLike(1, 'user-abc');

      expect(result.liked).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.postId).toBe(1);
      expect(variables.userIdentifier).toBe('user-abc');
      expect(options?.authMode).toBe('none');
    });

    it('取消点赞应返回 liked: false', async () => {
      mockExecute.mockResolvedValueOnce({ toggleBlogPostLike: false });

      const result = await toggleBlogPostLike(1, 'user-abc');

      expect(result.liked).toBe(false);
    });
  });

  describe('checkBlogPostLiked', () => {
    it('应调用 hasLikedBlogPost 查询', async () => {
      mockExecute.mockResolvedValueOnce({ hasLikedBlogPost: true });

      const result = await checkBlogPostLiked(1, 'user-abc');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.postId).toBe(1);
      expect(variables.userIdentifier).toBe('user-abc');
      expect(options?.authMode).toBe('none');
    });

    it('未点赞时应返回 false', async () => {
      mockExecute.mockResolvedValueOnce({ hasLikedBlogPost: false });

      const result = await checkBlogPostLiked(1, 'user-abc');

      expect(result).toBe(false);
    });
  });
});
