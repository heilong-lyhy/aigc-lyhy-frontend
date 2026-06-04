// src/features/blog/infrastructure/posts-api.ts

import type { BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

export type PostStatusDTO = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogPostDTO {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly content: string;
  readonly coverImage: string | null;
  readonly categoryId: string;
  readonly tags: readonly string[];
  readonly authorId: string;
  readonly status: PostStatusDTO;
  readonly isPinned: boolean;
  readonly viewCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface BlogPostListDTO {
  readonly items: readonly BlogPostDTO[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

const postStatusMap: Readonly<Record<PostStatusDTO, BlogPostStatus>> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

function mapPostStatus(raw: PostStatusDTO): BlogPostStatus {
  return postStatusMap[raw];
}

export function mapBlogPost(raw: BlogPostDTO): BlogPost {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
    coverImage: raw.coverImage ?? null,
    categoryId: raw.categoryId,
    tags: [...raw.tags],
    authorId: raw.authorId,
    status: mapPostStatus(raw.status),
    isPinned: raw.isPinned,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    commentCount: raw.commentCount,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapBlogPostList(raw: BlogPostListDTO): PaginatedResult<BlogPost> {
  return {
    items: raw.items.map(mapBlogPost),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
    hasMore: raw.hasMore,
  };
}

// ── GraphQL Documents ──

const POST_FRAGMENT = `
  fragment PostFields on BlogPost {
    id title slug excerpt content coverImage categoryId tags authorId
    status isPinned viewCount likeCount commentCount publishedAt createdAt updatedAt
  }
`;

const FETCH_POSTS_QUERY = `
  query FetchBlogPosts($offset: Int!, $limit: Int!, $keyword: String, $status: PostStatusDTO, $categoryId: ID, $tagId: ID) {
    blogPosts(offset: $offset, limit: $limit, keyword: $keyword, status: $status, categoryId: $categoryId, tagId: $tagId) {
      items { ...PostFields }
      total offset limit hasMore
    }
  }
  ${POST_FRAGMENT}
`;

const FETCH_POST_BY_SLUG_QUERY = `
  query FetchBlogPostBySlug($slug: String!) {
    blogPostBySlug(slug: $slug) { ...PostFields }
  }
  ${POST_FRAGMENT}
`;

const CREATE_POST_MUTATION = `
  mutation CreateBlogPost($input: CreateBlogPostInput!) {
    createBlogPost(input: $input) { ...PostFields }
  }
  ${POST_FRAGMENT}
`;

const UPDATE_POST_MUTATION = `
  mutation UpdateBlogPost($id: ID!, $input: UpdateBlogPostInput!) {
    updateBlogPost(id: $id, input: $input) { ...PostFields }
  }
  ${POST_FRAGMENT}
`;

const DELETE_POST_MUTATION = `
  mutation DeleteBlogPost($id: ID!) {
    deleteBlogPost(id: $id)
  }
`;

// ── API 函数 ──

export async function fetchBlogPosts(
  pagination: PaginationInput,
  filters?: {
    readonly keyword?: string;
    readonly status?: BlogPostStatus;
    readonly categoryId?: string;
    readonly tagId?: string;
  },
): Promise<PaginatedResult<BlogPost>> {
  const data = await executeGraphQL<{ blogPosts: BlogPostListDTO }, Record<string, unknown>>(
    FETCH_POSTS_QUERY,
    {
      offset: pagination.offset,
      limit: pagination.limit,
      keyword: filters?.keyword || undefined,
      status: filters?.status?.toUpperCase(),
      categoryId: filters?.categoryId,
      tagId: filters?.tagId,
    },
    { authMode: 'none' },
  );

  return mapBlogPostList(data.blogPosts);
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost> {
  const data = await executeGraphQL<{ blogPostBySlug: BlogPostDTO }, { slug: string }>(
    FETCH_POST_BY_SLUG_QUERY,
    { slug },
    { authMode: 'none' },
  );

  return mapBlogPost(data.blogPostBySlug);
}

export async function createBlogPost(
  input: Readonly<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string | null;
    categoryId: string;
    tags: readonly string[];
    status: BlogPostStatus;
  }>,
): Promise<BlogPost> {
  const data = await executeGraphQL<{ createBlogPost: BlogPostDTO }, Record<string, unknown>>(
    CREATE_POST_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogPost(data.createBlogPost);
}

export async function updateBlogPost(
  id: string,
  input: Readonly<
    Partial<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImage: string | null;
      categoryId: string;
      tags: readonly string[];
      status: BlogPostStatus;
      isPinned: boolean;
    }>
  >,
): Promise<BlogPost> {
  const data = await executeGraphQL<{ updateBlogPost: BlogPostDTO }, Record<string, unknown>>(
    UPDATE_POST_MUTATION,
    { id, input },
    { authMode: 'required' },
  );

  return mapBlogPost(data.updateBlogPost);
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogPost: boolean }, { id: string }>(
    DELETE_POST_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogPost;
}
