// src/features/blog/infrastructure/tags-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { createBlogTag, deleteBlogTag, fetchBlogTags } from './tags-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleDTO = {
  id: 'tag-1',
  name: 'React',
  slug: 'react',
  postCount: 10,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('tags-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogTags', () => {
    it('fetches and maps tag list', async () => {
      mockExecute.mockResolvedValueOnce({
        blogTags: [sampleDTO],
      });

      const result = await fetchBlogTags();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tag-1');
      expect(result[0].name).toBe('React');
      expect(result[0].postCount).toBe(10);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('returns empty array when no tags', async () => {
      mockExecute.mockResolvedValueOnce({ blogTags: [] });

      const result = await fetchBlogTags();

      expect(result).toHaveLength(0);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Network failure'));

      await expect(fetchBlogTags()).rejects.toThrow('Network failure');
    });
  });

  describe('createBlogTag', () => {
    it('creates a tag with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogTag: sampleDTO,
      });

      const result = await createBlogTag({ name: 'React', slug: 'react' });

      expect(result.id).toBe('tag-1');
      expect(result.name).toBe('React');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.name).toBe('React');
      expect(variables.input.slug).toBe('react');
      expect(options?.authMode).toBe('required');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Slug already exists'));

      await expect(
        createBlogTag({ name: 'React', slug: 'react' }),
      ).rejects.toThrow('Slug already exists');
    });
  });

  describe('deleteBlogTag', () => {
    it('deletes a tag with auth required', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogTag: true });

      const result = await deleteBlogTag('tag-1');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('tag-1');
      expect(options?.authMode).toBe('required');
    });

    it('returns false when deletion fails on server', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogTag: false });

      const result = await deleteBlogTag('tag-1');

      expect(result).toBe(false);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Has posts'));

      await expect(deleteBlogTag('tag-1')).rejects.toThrow('Has posts');
    });
  });
});
