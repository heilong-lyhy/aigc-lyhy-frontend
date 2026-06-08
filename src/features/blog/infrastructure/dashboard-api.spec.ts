// src/features/blog/infrastructure/dashboard-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { fetchBlogDashboard } from './dashboard-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogDashboardStatsObjectType 响应 ──

const sampleDashboardDTO = {
  totalPosts: 100,
  publishedPosts: 80,
  draftPosts: 20,
  totalCategories: 10,
  totalTags: 30,
  totalComments: 500,
  pendingComments: 15,
  totalLikes: 2000,
  totalViews: 50000,
};

describe('dashboard-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogDashboard', () => {
    it('应调用 blogDashboardStats 查询并映射结果', async () => {
      mockExecute.mockResolvedValueOnce({ blogDashboardStats: sampleDashboardDTO });

      const result = await fetchBlogDashboard();

      expect(result.totalPosts).toBe(100);
      expect(result.publishedPosts).toBe(80);
      expect(result.draftPosts).toBe(20);
      expect(result.totalCategories).toBe(10);
      expect(result.totalTags).toBe(30);
      expect(result.totalComments).toBe(500);
      expect(result.pendingComments).toBe(15);
      expect(result.totalLikes).toBe(2000);
      expect(result.totalViews).toBe(50000);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('required');
    });
  });
});
