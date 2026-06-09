// src/features/blog/infrastructure/tags-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { createBlogTag, deleteBlogTag, fetchBlogTags, updateBlogTag } from './tags-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogTagObjectType 响应 ──

const sampleTagDTO = {
  id: 1,
  name: 'TypeScript',
  slug: 'typescript',
  postCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('tags-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogTags', () => {
    it('应调用 blogTags 查询并映射结果', async () => {
      mockExecute.mockResolvedValueOnce({ blogTags: [sampleTagDTO] });

      const result = await fetchBlogTags();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // number → string
      expect(result[0].name).toBe('TypeScript');
      expect(result[0].slug).toBe('typescript');
      expect(result[0].postCount).toBe(5);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });
  });

  describe('createBlogTag', () => {
    it('应使用独立参数（非 input 对象）创建标签', async () => {
      mockExecute.mockResolvedValueOnce({ createBlogTag: sampleTagDTO });

      const result = await createBlogTag({ name: 'TypeScript', slug: 'typescript' });

      expect(result.name).toBe('TypeScript');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.name).toBe('TypeScript');
      expect(variables.slug).toBe('typescript');
      expect(options?.authMode).toBe('required');
    });
  });

  describe('deleteBlogTag', () => {
    it('应删除标签', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogTag: true });

      const result = await deleteBlogTag(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });
  });

  describe('updateBlogTag', () => {
    it('应使用独立参数更新标签并映射结果', async () => {
      const updatedDTO = { ...sampleTagDTO, name: 'TypeScript 5', slug: 'typescript-5' };
      mockExecute.mockResolvedValueOnce({ updateBlogTag: updatedDTO });

      const result = await updateBlogTag({ id: 1, name: 'TypeScript 5', slug: 'typescript-5' });

      expect(result.id).toBe('1');
      expect(result.name).toBe('TypeScript 5');
      expect(result.slug).toBe('typescript-5');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(variables.name).toBe('TypeScript 5');
      expect(variables.slug).toBe('typescript-5');
      expect(options?.authMode).toBe('required');
    });
  });
});
