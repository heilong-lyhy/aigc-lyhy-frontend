// src/features/blog/infrastructure/comments-api.ts

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

export type CommentStatusDTO = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 后端 BlogCommentObjectType */
export interface BlogCommentDTO {
  readonly id: number;
  readonly postId: number;
  readonly parentId: number | null;
  readonly replyToId: number | null;
  readonly authorName: string;
  readonly authorAvatar: string | null;
  readonly content: string;
  readonly status: CommentStatusDTO;
  readonly isAdminReply: boolean;
  readonly nestingLevel: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 后端 BlogCommentsListResponse */
interface BlogCommentListDTO {
  readonly list: readonly BlogCommentDTO[];
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

const commentStatusMap: Readonly<Record<CommentStatusDTO, BlogCommentStatus>> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

function mapCommentStatus(raw: CommentStatusDTO): BlogCommentStatus {
  return commentStatusMap[raw];
}

export function mapBlogComment(raw: BlogCommentDTO): BlogComment {
  return {
    id: String(raw.id),
    postId: raw.postId,
    parentId: raw.parentId,
    replyToId: raw.replyToId,
    authorName: raw.authorName,
    authorAvatar: raw.authorAvatar ?? null,
    content: raw.content,
    status: mapCommentStatus(raw.status),
    isAdminReply: raw.isAdminReply,
    nestingLevel: raw.nestingLevel,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapBlogCommentList(raw: BlogCommentListDTO): PaginatedResult<BlogComment> {
  return {
    items: raw.list.map(mapBlogComment),
    total: raw.total,
    current: raw.current,
    pageSize: raw.pageSize,
  };
}

// ── GraphQL Documents ──

const COMMENT_FRAGMENT = `
  fragment CommentFields on BlogComment {
    id postId parentId replyToId authorName authorAvatar content
    status isAdminReply nestingLevel createdAt updatedAt
  }
`;

/** 公开：查询指定文章的评论列表 */
const FETCH_COMMENTS_BY_POST_QUERY = `
  query FetchBlogCommentsByPost($postId: Int!, $page: Int!, $limit: Int!, $sortBy: String, $sortOrder: SortDirection) {
    blogCommentsByPost(postId: $postId, page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder) {
      list { ...CommentFields }
      current pageSize total
    }
  }
  ${COMMENT_FRAGMENT}
`;

/** 管理端：查询评论列表（支持筛选） */
const FETCH_COMMENTS_QUERY = `
  query FetchBlogComments($page: Int!, $limit: Int!, $sortBy: String, $sortOrder: SortDirection, $postId: Int, $status: BlogCommentStatus) {
    blogComments(page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder, postId: $postId, status: $status) {
      list { ...CommentFields }
      current pageSize total
    }
  }
  ${COMMENT_FRAGMENT}
`;

const CREATE_COMMENT_MUTATION = `
  mutation CreateBlogComment($input: CreateBlogCommentInput!) {
    createBlogComment(input: $input) { ...CommentFields }
  }
  ${COMMENT_FRAGMENT}
`;

const UPDATE_COMMENT_STATUS_MUTATION = `
  mutation UpdateBlogCommentStatus($input: UpdateBlogCommentStatusInput!) {
    updateBlogCommentStatus(input: $input) { ...CommentFields }
  }
  ${COMMENT_FRAGMENT}
`;

const DELETE_COMMENT_MUTATION = `
  mutation DeleteBlogComment($id: Int!) {
    deleteBlogComment(id: $id)
  }
`;

const REPLY_COMMENT_MUTATION = `
  mutation ReplyBlogComment($input: ReplyBlogCommentInput!) {
    replyBlogComment(input: $input) { ...CommentFields }
  }
  ${COMMENT_FRAGMENT}
`;

// ── API 函数 ──

/** 公开：查询指定文章的评论列表 */
export async function fetchBlogCommentsByPost(
  postId: number,
  pagination: PaginationInput,
  options?: {
    readonly sortBy?: string;
    readonly sortOrder?: string;
  },
): Promise<PaginatedResult<BlogComment>> {
  const data = await executeGraphQL<{ blogCommentsByPost: BlogCommentListDTO }, Record<string, unknown>>(
    FETCH_COMMENTS_BY_POST_QUERY,
    {
      postId,
      page: pagination.page,
      limit: pagination.pageSize,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    },
    { authMode: 'none' },
  );

  return mapBlogCommentList(data.blogCommentsByPost);
}

/** 管理端：查询评论列表（支持筛选） */
export async function fetchBlogComments(
  pagination: PaginationInput,
  filters?: {
    readonly postId?: number;
    readonly status?: BlogCommentStatus;
  },
): Promise<PaginatedResult<BlogComment>> {
  const data = await executeGraphQL<{ blogComments: BlogCommentListDTO }, Record<string, unknown>>(
    FETCH_COMMENTS_QUERY,
    {
      page: pagination.page,
      limit: pagination.pageSize,
      postId: filters?.postId,
      status: filters?.status?.toUpperCase(),
    },
    { authMode: 'required' },
  );

  return mapBlogCommentList(data.blogComments);
}

/** 公开：创建评论 */
export async function createBlogComment(
  input: Readonly<{
    postId: number;
    authorName: string;
    authorEmail: string;
    content: string;
    parentId?: number;
    replyToId?: number;
  }>,
): Promise<BlogComment> {
  const data = await executeGraphQL<{ createBlogComment: BlogCommentDTO }, Record<string, unknown>>(
    CREATE_COMMENT_MUTATION,
    { input },
    { authMode: 'none' },
  );

  return mapBlogComment(data.createBlogComment);
}

/** 管理端：更新评论审核状态 */
export async function updateBlogCommentStatus(
  input: Readonly<{ id: number; status: BlogCommentStatus }>,
): Promise<BlogComment> {
  const data = await executeGraphQL<
    { updateBlogCommentStatus: BlogCommentDTO },
    Record<string, unknown>
  >(UPDATE_COMMENT_STATUS_MUTATION, { input: { id: input.id, status: input.status.toUpperCase() } }, { authMode: 'required' });

  return mapBlogComment(data.updateBlogCommentStatus);
}

/** 管理端：删除评论 */
export async function deleteBlogComment(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogComment: boolean }, { id: number }>(
    DELETE_COMMENT_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogComment;
}

/** 管理端：回复评论 */
export async function replyBlogComment(
  input: Readonly<{
    commentId: number;
    content: string;
  }>,
): Promise<BlogComment> {
  const data = await executeGraphQL<{ replyBlogComment: BlogCommentDTO }, Record<string, unknown>>(
    REPLY_COMMENT_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogComment(data.replyBlogComment);
}
