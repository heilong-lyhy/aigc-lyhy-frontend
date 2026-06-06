// src/features/blog/infrastructure/categories-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogCategory,
  deleteBlogCategory,
  fetchBlogCategories,
  updateBlogCategory,
} from './categories-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleDTO = {
  id: 'cat-1',
  name: '技术',
  slug: 'tech',
  description: '技术文章',
  parentId: null,
  children: [] as readonly unknown[],
  sortOrder: 1,
  postCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
};

const childDTO = {
  id: 'cat-2',
  name: '前端',
  slug: 'frontend',
  description: '前端开发',
  parentId: 'cat-1',
  children: [] as readonly unknown[],
  sortOrder: 1,
  postCount: 3,
  createdAt: '2024-01-02T00:00:00Z',
};

describe('categories-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogCategories', () => {
    it('fetches and maps flat category list', async () => {
      mockExecute.mockResolvedValueOnce({
        blogCategories: [sampleDTO],
      });

      const result = await fetchBlogCategories();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cat-1');
      expect(result[0].name).toBe('技术');
      expect(result[0].parentId).toBeNull();
      expect(result[0].children).toEqual([]);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('maps nested children recursively', async () => {
      mockExecute.mockResolvedValueOnce({
        blogCategories: [{ ...sampleDTO, children: [childDTO] }],
      });

      const result = await fetchBlogCategories();

      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('cat-2');
      expect(result[0].children[0].parentId).toBe('cat-1');
    });

    it('converts undefined parentId to null', async () => {
      mockExecute.mockResolvedValueOnce({
        blogCategories: [{ ...sampleDTO, parentId: undefined }],
      });

      const result = await fetchBlogCategories();

      expect(result[0].parentId).toBeNull();
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Network failure'));

      await expect(fetchBlogCategories()).rejects.toThrow('Network failure');
    });
  });

  describe('createBlogCategory', () => {
    it('creates a category with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogCategory: sampleDTO,
      });

      const result = await createBlogCategory({
        name: '技术',
        slug: 'tech',
        description: '技术文章',
      });

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('技术');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.name).toBe('技术');
      expect(options?.authMode).toBe('required');
    });

    it('passes parentId and sortOrder when provided', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogCategory: childDTO,
      });

      await createBlogCategory({
        name: '前端',
        slug: 'frontend',
        description: '前端开发',
        parentId: 'cat-1',
        sortOrder: 2,
      });

      expect(mockExecute.mock.calls[0][1].input.parentId).toBe('cat-1');
      expect(mockExecute.mock.calls[0][1].input.sortOrder).toBe(2);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Slug already exists'));

      await expect(
        createBlogCategory({ name: '技术', slug: 'tech', description: '' }),
      ).rejects.toThrow('Slug already exists');
    });
  });

  describe('updateBlogCategory', () => {
    it('updates a category with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogCategory: { ...sampleDTO, name: '技术2' },
      });

      const result = await updateBlogCategory('cat-1', { name: '技术2' });

      expect(result.name).toBe('技术2');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('cat-1');
      expect(variables.input.name).toBe('技术2');
      expect(options?.authMode).toBe('required');
    });

    it('passes parentId null for root move', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogCategory: { ...childDTO, parentId: null },
      });

      await updateBlogCategory('cat-2', { parentId: null });

      expect(mockExecute.mock.calls[0][1].input.parentId).toBeNull();
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Not found'));

      await expect(
        updateBlogCategory('missing', { name: 'x' }),
      ).rejects.toThrow('Not found');
    });
  });

  describe('deleteBlogCategory', () => {
    it('deletes a category with auth required', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogCategory: true });

      const result = await deleteBlogCategory('cat-1');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('cat-1');
      expect(options?.authMode).toBe('required');
    });

    it('returns false when deletion fails on server', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogCategory: false });

      const result = await deleteBlogCategory('cat-1');

      expect(result).toBe(false);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Has children'));

      await expect(deleteBlogCategory('cat-1')).rejects.toThrow('Has children');
    });
  });
});
