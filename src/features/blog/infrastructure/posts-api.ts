// src/features/blog/infrastructure/posts-api.ts

import type {
  BlogPost,
  BlogPostDetail,
  BlogPostStatus,
  BlogTag,
  PaginatedResult,
  PaginationInput,
  PostNavigationItem,
} from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

export type PostStatusDTO = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';

/** 后端 BlogPostObjectType（列表项） */
export interface BlogPostDTO {
  readonly id: number;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string | null;
  readonly coverImage: string | null;
  readonly status: PostStatusDTO;
  readonly categoryId: number | null;
  readonly categoryName: string | null;
  readonly tagIds: readonly number[];
  readonly isPinned: boolean;
  readonly viewCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 后端 BlogPostDetailObjectType（详情，多 content/renderedContent/tags） */
export interface BlogPostDetailDTO extends BlogPostDTO {
  readonly content: string;
  readonly renderedContent: string | null;
  readonly tags: readonly BlogTagDTO[];
  readonly prevPost?: PostNavigationItemDTO | null;
  readonly nextPost?: PostNavigationItemDTO | null;
}

interface BlogTagDTO {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PostNavigationItemDTO {
  readonly id: number;
  readonly title: string;
  readonly slug: string;
}

/** 后端 BlogPostsListResponse */
interface BlogPostListDTO {
  readonly list: readonly BlogPostDTO[];
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

const postStatusMap: Readonly<Record<PostStatusDTO, BlogPostStatus>> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
};

function mapPostStatus(raw: PostStatusDTO): BlogPostStatus {
  return postStatusMap[raw];
}

function mapTag(raw: BlogTagDTO): BlogTag {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    postCount: raw.postCount,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapBlogPost(raw: BlogPostDTO): BlogPost {
  return {
    id: String(raw.id),
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? null,
    coverImage: raw.coverImage ?? null,
    status: mapPostStatus(raw.status),
    categoryId: raw.categoryId,
    categoryName: raw.categoryName ?? null,
    tagIds: (raw.tagIds ?? []).map(String),
    isPinned: raw.isPinned,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    commentCount: raw.commentCount,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapNavigationItem(raw: PostNavigationItemDTO): PostNavigationItem {
  return { id: String(raw.id), title: raw.title, slug: raw.slug };
}

function mapBlogPostDetail(raw: BlogPostDetailDTO): BlogPostDetail {
  return {
    ...mapBlogPost(raw),
    content: raw.content,
    renderedContent: raw.renderedContent ?? null,
    tags: raw.tags.map(mapTag),
    prevPost: raw.prevPost ? mapNavigationItem(raw.prevPost) : undefined,
    nextPost: raw.nextPost ? mapNavigationItem(raw.nextPost) : undefined,
  };
}

function mapBlogPostList(raw: BlogPostListDTO): PaginatedResult<BlogPost> {
  return {
    items: raw.list.map(mapBlogPost),
    total: raw.total,
    current: raw.current,
    pageSize: raw.pageSize,
  };
}

// ── GraphQL Documents ──

const POST_LIST_FRAGMENT = `
  fragment PostListFields on BlogPost {
    id title slug excerpt coverImage status categoryId categoryName tagIds
    isPinned viewCount likeCount commentCount publishedAt createdAt updatedAt
  }
`;

const POST_DETAIL_FRAGMENT = `
  fragment PostDetailFields on BlogPostDetail {
    id title slug excerpt content renderedContent coverImage status categoryId categoryName tagIds
    isPinned viewCount likeCount commentCount publishedAt createdAt updatedAt
    tags { id name slug postCount createdAt updatedAt }
    prevPost { id title slug }
    nextPost { id title slug }
  }
`;

/** 公开：查询已发布文章列表（支持分类/标签/关键词筛选） */
const FETCH_PUBLISHED_POSTS_QUERY = `
  query FetchBlogPublishedPosts($page: Int!, $limit: Int!, $sortBy: String, $sortOrder: SortDirection, $categoryId: Int, $tagId: Int, $title: String) {
    blogPublishedPosts(page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder, categoryId: $categoryId, tagId: $tagId, title: $title) {
      list { ...PostListFields }
      current pageSize total
    }
  }
  ${POST_LIST_FRAGMENT}
`;

/** 管理端：查询文章列表（支持筛选） */
const FETCH_POSTS_QUERY = `
  query FetchBlogPosts($page: Int!, $limit: Int!, $sortBy: String, $sortOrder: SortDirection, $status: BlogPostStatus, $categoryId: Int, $title: String) {
    blogPosts(page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder, status: $status, categoryId: $categoryId, title: $title) {
      list { ...PostListFields }
      current pageSize total
    }
  }
  ${POST_LIST_FRAGMENT}
`;

/** 公开：按 ID 查询文章详情 */
const FETCH_POST_BY_ID_QUERY = `
  query FetchBlogPostById($id: Int!) {
    blogPost(id: $id) { ...PostDetailFields }
  }
  ${POST_DETAIL_FRAGMENT}
`;

/** 公开：按 slug 查询文章详情 */
const FETCH_POST_BY_SLUG_QUERY = `
  query FetchBlogPostBySlug($slug: String!) {
    blogPostBySlug(slug: $slug) { ...PostDetailFields }
  }
  ${POST_DETAIL_FRAGMENT}
`;

const CREATE_POST_MUTATION = `
  mutation CreateBlogPost($input: CreateBlogPostInput!) {
    createBlogPost(input: $input) { ...PostDetailFields }
  }
  ${POST_DETAIL_FRAGMENT}
`;

const UPDATE_POST_MUTATION = `
  mutation UpdateBlogPost($input: UpdateBlogPostInput!) {
    updateBlogPost(input: $input) { ...PostDetailFields }
  }
  ${POST_DETAIL_FRAGMENT}
`;

const DELETE_POST_MUTATION = `
  mutation DeleteBlogPost($id: Int!) {
    deleteBlogPost(id: $id)
  }
`;

// ── API 函数 ──

/** 公开：查询已发布文章列表（支持分类/标签/关键词筛选） */
export async function fetchBlogPublishedPosts(
  pagination: PaginationInput,
  options?: {
    readonly sortBy?: string;
    readonly sortOrder?: string;
    readonly categoryId?: number;
    readonly tagId?: number;
    readonly title?: string;
  },
): Promise<PaginatedResult<BlogPost>> {
  const data = await executeGraphQL<{ blogPublishedPosts: BlogPostListDTO }, Record<string, unknown>>(
    FETCH_PUBLISHED_POSTS_QUERY,
    {
      page: pagination.page,
      limit: pagination.pageSize,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      categoryId: options?.categoryId,
      tagId: options?.tagId,
      title: options?.title,
    },
    { authMode: 'none' },
  );

  return mapBlogPostList(data.blogPublishedPosts);
}

/** 管理端：查询文章列表（支持筛选） */
export async function fetchBlogPosts(
  pagination: PaginationInput,
  filters?: {
    readonly status?: BlogPostStatus;
    readonly categoryId?: number;
    readonly title?: string;
  },
): Promise<PaginatedResult<BlogPost>> {
  const data = await executeGraphQL<{ blogPosts: BlogPostListDTO }, Record<string, unknown>>(
    FETCH_POSTS_QUERY,
    {
      page: pagination.page,
      limit: pagination.pageSize,
      status: filters?.status?.toUpperCase(),
      categoryId: filters?.categoryId,
      title: filters?.title,
    },
    { authMode: 'required' },
  );

  return mapBlogPostList(data.blogPosts);
}

/** 公开：按 ID 查询文章详情 */
export async function fetchBlogPostById(id: number): Promise<BlogPostDetail | null> {
  const data = await executeGraphQL<{ blogPost: BlogPostDetailDTO | null }, { id: number }>(
    FETCH_POST_BY_ID_QUERY,
    { id },
    { authMode: 'none' },
  );

  return data.blogPost ? mapBlogPostDetail(data.blogPost) : null;
}

/** 公开：按 slug 查询文章详情 */
export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const data = await executeGraphQL<{ blogPostBySlug: BlogPostDetailDTO | null }, { slug: string }>(
    FETCH_POST_BY_SLUG_QUERY,
    { slug },
    { authMode: 'none' },
  );

  return data.blogPostBySlug ? mapBlogPostDetail(data.blogPostBySlug) : null;
}

/** 管理端：创建文章 */
export async function createBlogPost(
  input: Readonly<{
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    renderedContent?: string;
    coverImage?: string | null;
    status?: BlogPostStatus;
    categoryId?: number;
    tagIds?: readonly number[];
    isPinned?: boolean;
    publishedAt?: string;
  }>,
): Promise<BlogPostDetail> {
  const data = await executeGraphQL<{ createBlogPost: BlogPostDetailDTO }, Record<string, unknown>>(
    CREATE_POST_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogPostDetail(data.createBlogPost);
}

/** 管理端：更新文章 */
export async function updateBlogPost(
  input: Readonly<{
    id: number;
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    renderedContent?: string;
    coverImage?: string | null;
    status?: BlogPostStatus;
    categoryId?: number;
    tagIds?: readonly number[];
    isPinned?: boolean;
    publishedAt?: string;
  }>,
): Promise<BlogPostDetail> {
  const data = await executeGraphQL<{ updateBlogPost: BlogPostDetailDTO }, Record<string, unknown>>(
    UPDATE_POST_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogPostDetail(data.updateBlogPost);
}

/** 管理端：删除文章（软删除，移入回收站） */
export async function deleteBlogPost(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogPost: boolean }, { id: number }>(
    DELETE_POST_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogPost;
}

// ── 回收站 ──

const RESTORE_POST_MUTATION = `
  mutation RestoreBlogPost($id: Int!) {
    restoreBlogPost(id: $id) { ...PostDetailFields }
  }
  ${POST_DETAIL_FRAGMENT}
`;

const PERMANENT_DELETE_POST_MUTATION = `
  mutation PermanentDeleteBlogPost($id: Int!) {
    permanentDeleteBlogPost(id: $id)
  }
`;

/** 管理端：恢复已删除文章 */
export async function restoreBlogPost(id: number): Promise<BlogPostDetail> {
  const data = await executeGraphQL<{ restoreBlogPost: BlogPostDetailDTO }, { id: number }>(
    RESTORE_POST_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return mapBlogPostDetail(data.restoreBlogPost);
}

/** 管理端：永久删除文章（不可恢复） */
export async function permanentDeleteBlogPost(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ permanentDeleteBlogPost: boolean }, { id: number }>(
    PERMANENT_DELETE_POST_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.permanentDeleteBlogPost;
}
