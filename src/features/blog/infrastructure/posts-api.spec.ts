// src/features/blog/infrastructure/posts-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPostById,
  fetchBlogPostBySlug,
  fetchBlogPosts,
  mapBlogPost,
  updateBlogPost,
} from './posts-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleDTO = {
  id: 'p1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Excerpt',
  content: '# Hello',
  coverImage: null,
  categoryId: 'cat-1',
  tags: ['tag-1'],
  authorId: 'author-1',
  status: 'PUBLISHED' as const,
  isPinned: false,
  viewCount: 10,
  likeCount: 5,
  commentCount: 2,
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('posts-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mapBlogPost', () => {
    it('maps DTO to domain entity with lowercase status', () => {
      const result = mapBlogPost(sampleDTO);

      expect(result.status).toBe('published');
      expect(result.id).toBe('p1');
      expect(result.tags).toEqual(['tag-1']);
    });

    it('maps DRAFT status correctly', () => {
      const result = mapBlogPost({ ...sampleDTO, status: 'DRAFT' });
      expect(result.status).toBe('draft');
    });

    it('maps ARCHIVED status correctly', () => {
      const result = mapBlogPost({ ...sampleDTO, status: 'ARCHIVED' });
      expect(result.status).toBe('archived');
    });

    it('converts undefined coverImage to null', () => {
      const result = mapBlogPost({ ...sampleDTO, coverImage: undefined as unknown as null });
      expect(result.coverImage).toBeNull();
    });

    it('converts undefined publishedAt to null', () => {
      const result = mapBlogPost({ ...sampleDTO, publishedAt: undefined as unknown as null });
      expect(result.publishedAt).toBeNull();
    });
  });

  describe('fetchBlogPosts', () => {
    it('fetches and maps paginated post list', async () => {
      mockExecute.mockResolvedValueOnce({
        blogPosts: {
          items: [sampleDTO],
          total: 1,
          offset: 0,
          limit: 10,
          hasMore: false,
        },
      });

      const result = await fetchBlogPosts({ offset: 0, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('published');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('passes uppercase status filter', async () => {
      mockExecute.mockResolvedValueOnce({
        blogPosts: { items: [], total: 0, offset: 0, limit: 10, hasMore: false },
      });

      await fetchBlogPosts({ offset: 0, limit: 10 }, { status: 'draft' });

      expect(mockExecute.mock.calls[0][1].status).toBe('DRAFT');
    });

    it('passes keyword, categoryId, tagId filters', async () => {
      mockExecute.mockResolvedValueOnce({
        blogPosts: { items: [], total: 0, offset: 0, limit: 10, hasMore: false },
      });

      await fetchBlogPosts(
        { offset: 0, limit: 10 },
        { keyword: 'react', categoryId: 'cat-1', tagId: 'tag-1' },
      );

      const variables = mockExecute.mock.calls[0][1];
      expect(variables.keyword).toBe('react');
      expect(variables.categoryId).toBe('cat-1');
      expect(variables.tagId).toBe('tag-1');
    });

    it('omits empty keyword', async () => {
      mockExecute.mockResolvedValueOnce({
        blogPosts: { items: [], total: 0, offset: 0, limit: 10, hasMore: false },
      });

      await fetchBlogPosts({ offset: 0, limit: 10 }, { keyword: '' });

      expect(mockExecute.mock.calls[0][1].keyword).toBeUndefined();
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Server error'));

      await expect(
        fetchBlogPosts({ offset: 0, limit: 10 }),
      ).rejects.toThrow('Server error');
    });
  });

  describe('fetchBlogPostById', () => {
    it('fetches post by id with auth required', async () => {
      mockExecute.mockResolvedValueOnce({ blogPost: sampleDTO });

      const result = await fetchBlogPostById('p1');

      expect(result.id).toBe('p1');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('p1');
      expect(options?.authMode).toBe('required');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Not found'));

      await expect(fetchBlogPostById('missing')).rejects.toThrow('Not found');
    });
  });

  describe('fetchBlogPostBySlug', () => {
    it('fetches post by slug without auth', async () => {
      mockExecute.mockResolvedValueOnce({ blogPostBySlug: sampleDTO });

      const result = await fetchBlogPostBySlug('test-post');

      expect(result.slug).toBe('test-post');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.slug).toBe('test-post');
      expect(options?.authMode).toBe('none');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Not found'));

      await expect(fetchBlogPostBySlug('missing')).rejects.toThrow('Not found');
    });
  });

  describe('createBlogPost', () => {
    it('creates a post with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        createBlogPost: { ...sampleDTO, status: 'DRAFT' },
      });

      const result = await createBlogPost({
        title: 'New Post',
        slug: 'new-post',
        excerpt: '',
        content: '',
        categoryId: 'cat-1',
        tags: [],
        status: 'draft',
      });

      expect(result.status).toBe('draft');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.title).toBe('New Post');
      expect(options?.authMode).toBe('required');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Validation error'));

      await expect(
        createBlogPost({
          title: '',
          slug: '',
          excerpt: '',
          content: '',
          categoryId: '',
          tags: [],
          status: 'draft',
        }),
      ).rejects.toThrow('Validation error');
    });
  });

  describe('updateBlogPost', () => {
    it('updates a post with auth required', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogPost: { ...sampleDTO, title: 'Updated' },
      });

      const result = await updateBlogPost('p1', { title: 'Updated' });

      expect(result.title).toBe('Updated');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('p1');
      expect(variables.input.title).toBe('Updated');
      expect(options?.authMode).toBe('required');
    });

    it('passes status as lowercase in input', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogPost: { ...sampleDTO, status: 'PUBLISHED' },
      });

      await updateBlogPost('p1', { status: 'published' });

      expect(mockExecute.mock.calls[0][1].input.status).toBe('published');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        updateBlogPost('p1', { title: 'x' }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteBlogPost', () => {
    it('deletes a post with auth required', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogPost: true });

      const result = await deleteBlogPost('p1');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('p1');
      expect(options?.authMode).toBe('required');
    });

    it('returns false when deletion fails on server', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogPost: false });

      const result = await deleteBlogPost('p1');

      expect(result).toBe(false);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(deleteBlogPost('p1')).rejects.toThrow('Forbidden');
    });
  });
});
