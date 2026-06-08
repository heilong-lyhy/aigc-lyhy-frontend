// src/features/blog/infrastructure/posts-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

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
  fetchBlogPublishedPosts,
  mapBlogPost,
  updateBlogPost,
} from './posts-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogPostObjectType 响应 ──

const samplePostDTO = {
  id: 1,
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'Excerpt',
  coverImage: null,
  status: 'PUBLISHED' as const,
  categoryId: 10,
  categoryName: '技术',
  isPinned: false,
  viewCount: 10,
  likeCount: 5,
  commentCount: 2,
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ── 模拟后端 BlogPostDetailObjectType 响应 ──

const sampleDetailDTO = {
  ...samplePostDTO,
  content: '# Hello',
  renderedContent: '<h1>Hello</h1>',
  tags: [
    { id: 1, name: 'TypeScript', slug: 'typescript', postCount: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  ],
};

// ── 模拟后端 BlogPostsListResponse ──

const sampleListResponse = {
  list: [samplePostDTO],
  current: 1,
  pageSize: 10,
  total: 1,
};

describe('posts-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── mapBlogPost：DTO → Entity 映射 ───

  describe('mapBlogPost', () => {
    it('应正确映射后端 DTO 到前端实体', () => {
      const result = mapBlogPost(samplePostDTO);

      expect(result.id).toBe('1'); // number → string
      expect(result.title).toBe('Test Post');
      expect(result.slug).toBe('test-post');
      expect(result.excerpt).toBe('Excerpt');
      expect(result.coverImage).toBeNull();
      expect(result.status).toBe('published'); // PUBLISHED → published
      expect(result.categoryId).toBe(10);
      expect(result.categoryName).toBe('技术');
      expect(result.isPinned).toBe(false);
      expect(result.viewCount).toBe(10);
      expect(result.likeCount).toBe(5);
      expect(result.commentCount).toBe(2);
    });

    it('应映射 DRAFT 状态', () => {
      const result = mapBlogPost({ ...samplePostDTO, status: 'DRAFT' });
      expect(result.status).toBe('draft');
    });

    it('应映射 ARCHIVED 状态', () => {
      const result = mapBlogPost({ ...samplePostDTO, status: 'ARCHIVED' });
      expect(result.status).toBe('archived');
    });

    it('categoryId 为 null 时应保留 null', () => {
      const result = mapBlogPost({ ...samplePostDTO, categoryId: null, categoryName: null });
      expect(result.categoryId).toBeNull();
      expect(result.categoryName).toBeNull();
    });
  });

  // ─── fetchBlogPublishedPosts：公开查询已发布文章 ───

  describe('fetchBlogPublishedPosts', () => {
    it('应调用 blogPublishedPosts 查询并映射分页结果', async () => {
      mockExecute.mockResolvedValueOnce({ blogPublishedPosts: sampleListResponse });

      const result = await fetchBlogPublishedPosts({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('published');
      expect(result.total).toBe(1);
      expect(result.current).toBe(1);
      expect(result.pageSize).toBe(10);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.page).toBe(1);
      expect(variables.limit).toBe(10);
      expect(options?.authMode).toBe('none');
    });
  });

  // ─── fetchBlogPosts：管理端查询 ───

  describe('fetchBlogPosts', () => {
    it('应调用 blogPosts 查询（管理端）', async () => {
      mockExecute.mockResolvedValueOnce({ blogPosts: sampleListResponse });

      const result = await fetchBlogPosts({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('required');
    });

    it('应传递筛选参数', async () => {
      mockExecute.mockResolvedValueOnce({ blogPosts: { list: [], current: 1, pageSize: 10, total: 0 } });

      await fetchBlogPosts({ page: 1, pageSize: 10 }, { status: 'draft', categoryId: 5, title: '关键词' });

      const variables = mockExecute.mock.calls[0][1];
      expect(variables.status).toBe('DRAFT');
      expect(variables.categoryId).toBe(5);
      expect(variables.title).toBe('关键词');
    });
  });

  // ─── fetchBlogPostById ───

  describe('fetchBlogPostById', () => {
    it('应返回 BlogPostDetail（含 content/tags）', async () => {
      mockExecute.mockResolvedValueOnce({ blogPost: sampleDetailDTO });

      const result = await fetchBlogPostById(1);

      expect(result).not.toBeNull();
      expect(result!.content).toBe('# Hello');
      expect(result!.renderedContent).toBe('<h1>Hello</h1>');
      expect(result!.tags).toHaveLength(1);
      expect(result!.tags[0].name).toBe('TypeScript');
    });

    it('文章不存在时应返回 null', async () => {
      mockExecute.mockResolvedValueOnce({ blogPost: null });

      const result = await fetchBlogPostById(999);

      expect(result).toBeNull();
    });
  });

  // ─── fetchBlogPostBySlug ───

  describe('fetchBlogPostBySlug', () => {
    it('应通过 slug 查询文章详情', async () => {
      mockExecute.mockResolvedValueOnce({ blogPostBySlug: sampleDetailDTO });

      const result = await fetchBlogPostBySlug('test-post');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('test-post');
    });
  });

  // ─── createBlogPost ───

  describe('createBlogPost', () => {
    it('应创建文章并返回详情', async () => {
      mockExecute.mockResolvedValueOnce({ createBlogPost: sampleDetailDTO });

      const result = await createBlogPost({
        title: 'New Post',
        slug: 'new-post',
        content: 'Content',
      });

      expect(result.content).toBe('# Hello');

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('required');
    });
  });

  // ─── updateBlogPost ───

  describe('updateBlogPost', () => {
    it('应更新文章（input 包含 id）', async () => {
      mockExecute.mockResolvedValueOnce({ updateBlogPost: { ...sampleDetailDTO, title: 'Updated' } });

      const result = await updateBlogPost({ id: 1, title: 'Updated' });

      expect(result.title).toBe('Updated');

      const [, variables] = mockExecute.mock.calls[0];
      expect(variables.input.id).toBe(1);
    });
  });

  // ─── deleteBlogPost ───

  describe('deleteBlogPost', () => {
    it('应删除文章', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogPost: true });

      const result = await deleteBlogPost(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });
  });
});
