// src/features/blog/infrastructure/friend-links-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogFriendLink,
  deleteBlogFriendLink,
  fetchBlogFriendLinks,
  updateBlogFriendLink,
} from './friend-links-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogFriendLinkDTO 响应 ──

const sampleFriendLinkDTO = {
  id: 1,
  name: 'Example Blog',
  url: 'https://example.com',
  description: 'A friendly blog',
  logoUrl: 'https://example.com/logo.png',
  sortOrder: 0,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('friend-links-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchBlogFriendLinks ───

  describe('fetchBlogFriendLinks', () => {
    it('应调用 blogFriendLinks 查询并映射结果', async () => {
      mockExecute.mockResolvedValueOnce({
        blogFriendLinks: [sampleFriendLinkDTO],
      });

      const result = await fetchBlogFriendLinks();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Example Blog',
        url: 'https://example.com',
        description: 'A friendly blog',
        logoUrl: 'https://example.com/logo.png',
        sortOrder: 0,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('应返回空数组当后端无数据', async () => {
      mockExecute.mockResolvedValueOnce({ blogFriendLinks: [] });

      const result = await fetchBlogFriendLinks();

      expect(result).toHaveLength(0);
    });

    it('应映射 null 可选字段', async () => {
      const dtoWithNulls = {
        ...sampleFriendLinkDTO,
        description: null,
        logoUrl: null,
      };
      mockExecute.mockResolvedValueOnce({ blogFriendLinks: [dtoWithNulls] });

      const result = await fetchBlogFriendLinks();

      expect(result[0].description).toBeNull();
      expect(result[0].logoUrl).toBeNull();
    });
  });

  // ─── createBlogFriendLink ───

  describe('createBlogFriendLink', () => {
    it('应创建友链并返回映射结果', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogFriendLink: sampleFriendLinkDTO,
      });

      const result = await createBlogFriendLink({
        name: 'Example Blog',
        url: 'https://example.com',
      });

      expect(result.id).toBe('1');
      expect(result.name).toBe('Example Blog');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.name).toBe('Example Blog');
      expect(variables.input.url).toBe('https://example.com');
      expect(options?.authMode).toBe('required');
    });
  });

  // ─── updateBlogFriendLink ───

  describe('updateBlogFriendLink', () => {
    it('应更新友链并返回映射结果', async () => {
      const updatedDTO = { ...sampleFriendLinkDTO, name: 'Updated Blog' };
      mockExecute.mockResolvedValueOnce({ updateBlogFriendLink: updatedDTO });

      const result = await updateBlogFriendLink({
        id: 1,
        name: 'Updated Blog',
      });

      expect(result.name).toBe('Updated Blog');

      const [, variables] = mockExecute.mock.calls[0];
      expect(variables.input.id).toBe(1);
      expect(variables.input.name).toBe('Updated Blog');
    });
  });

  // ─── deleteBlogFriendLink ───

  describe('deleteBlogFriendLink', () => {
    it('应删除友链并返回 true', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogFriendLink: true });

      const result = await deleteBlogFriendLink(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });

    it('删除失败时应返回 false', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogFriendLink: false });

      const result = await deleteBlogFriendLink(999);

      expect(result).toBe(false);
    });
  });
});
