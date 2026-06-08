// src/features/blog/infrastructure/categories-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogCategory,
  deleteBlogCategory,
  fetchBlogCategories,
  fetchBlogCategoryTree,
  updateBlogCategory,
} from './categories-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogCategoryObjectType 响应 ──

const sampleCategoryDTO = {
  id: 1,
  name: '技术',
  slug: 'tech',
  description: '技术文章',
  parentId: null,
  sortOrder: 0,
  postCount: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('categories-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogCategories', () => {
    it('应调用 blogCategories 查询并映射结果', async () => {
      mockExecute.mockResolvedValueOnce({ blogCategories: [sampleCategoryDTO] });

      const result = await fetchBlogCategories();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // number → string
      expect(result[0].name).toBe('技术');
      expect(result[0].slug).toBe('tech');
      expect(result[0].description).toBe('技术文章');
      expect(result[0].parentId).toBeNull();
      expect(result[0].sortOrder).toBe(0);
      expect(result[0].postCount).toBe(10);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });
  });

  describe('fetchBlogCategoryTree', () => {
    it('应调用 blogCategoryTree 查询', async () => {
      const childDTO = { ...sampleCategoryDTO, id: 2, name: '前端', parentId: 1 };
      mockExecute.mockResolvedValueOnce({ blogCategoryTree: [sampleCategoryDTO, childDTO] });

      const result = await fetchBlogCategoryTree();

      expect(result).toHaveLength(2);
      expect(result[1].parentId).toBe(1);
    });
  });

  describe('createBlogCategory', () => {
    it('应使用 input 对象创建分类', async () => {
      mockExecute.mockResolvedValueOnce({ createBlogCategory: sampleCategoryDTO });

      const result = await createBlogCategory({ name: '技术', slug: 'tech' });

      expect(result.name).toBe('技术');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.name).toBe('技术');
      expect(variables.input.slug).toBe('tech');
      expect(options?.authMode).toBe('required');
    });
  });

  describe('updateBlogCategory', () => {
    it('应使用 input 对象（含 id）更新分类', async () => {
      mockExecute.mockResolvedValueOnce({ updateBlogCategory: { ...sampleCategoryDTO, name: '后端' } });

      const result = await updateBlogCategory({ id: 1, name: '后端' });

      expect(result.name).toBe('后端');

      const [, variables] = mockExecute.mock.calls[0];
      expect(variables.input.id).toBe(1);
      expect(variables.input.name).toBe('后端');
    });
  });

  describe('deleteBlogCategory', () => {
    it('应删除分类', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogCategory: true });

      const result = await deleteBlogCategory(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });
  });
});
