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

export interface BlogCommentDTO {
  readonly id: string;
  readonly postId: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authorAvatar: string | null;
  readonly content: string;
  readonly status: CommentStatusDTO;
  readonly parentId: string | null;
  readonly replyToId: string | null;
  readonly nestingLevel: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface BlogCommentListDTO {
  readonly items: readonly BlogCommentDTO[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
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
    id: raw.id,
    postId: raw.postId,
    authorName: raw.authorName,
    authorEmail: raw.authorEmail,
    authorAvatar: raw.authorAvatar ?? null,
    content: raw.content,
    status: mapCommentStatus(raw.status),
    parentId: raw.parentId ?? null,
    replyToId: raw.replyToId ?? null,
    nestingLevel: raw.nestingLevel,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapBlogCommentList(raw: BlogCommentListDTO): PaginatedResult<BlogComment> {
  return {
    items: raw.items.map(mapBlogComment),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
    hasMore: raw.hasMore,
  };
}

// ── GraphQL Documents ──

const COMMENT_FRAGMENT = `
  fragment CommentFields on BlogComment {
    id postId authorName authorEmail authorAvatar content status
    parentId replyToId nestingLevel createdAt updatedAt
  }
`;

const FETCH_COMMENTS_QUERY = `
  query FetchBlogComments($postId: ID!, $offset: Int!, $limit: Int!, $status: CommentStatusDTO) {
    blogComments(postId: $postId, offset: $offset, limit: $limit, status: $status) {
      items { ...CommentFields }
      total offset limit hasMore
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
  mutation UpdateBlogCommentStatus($id: ID!, $status: CommentStatusDTO!) {
    updateBlogCommentStatus(id: $id, status: $status) { ...CommentFields }
  }
  ${COMMENT_FRAGMENT}
`;

const DELETE_COMMENT_MUTATION = `
  mutation DeleteBlogComment($id: ID!) {
    deleteBlogComment(id: $id)
  }
`;

// ── API 函数 ──

export async function fetchBlogComments(
  postId: string,
  pagination: PaginationInput,
  filters?: { readonly status?: BlogCommentStatus },
): Promise<PaginatedResult<BlogComment>> {
  const data = await executeGraphQL<{ blogComments: BlogCommentListDTO }, Record<string, unknown>>(
    FETCH_COMMENTS_QUERY,
    {
      postId,
      offset: pagination.offset,
      limit: pagination.limit,
      status: filters?.status?.toUpperCase(),
    },
    { authMode: 'none' },
  );

  return mapBlogCommentList(data.blogComments);
}

export async function createBlogComment(
  input: Readonly<{
    postId: string;
    authorName: string;
    authorEmail: string;
    content: string;
    parentId?: string | null;
    replyToId?: string | null;
  }>,
): Promise<BlogComment> {
  const data = await executeGraphQL<{ createBlogComment: BlogCommentDTO }, Record<string, unknown>>(
    CREATE_COMMENT_MUTATION,
    { input },
    { authMode: 'none' },
  );

  return mapBlogComment(data.createBlogComment);
}

export async function updateBlogCommentStatus(
  id: string,
  status: BlogCommentStatus,
): Promise<BlogComment> {
  const data = await executeGraphQL<
    { updateBlogCommentStatus: BlogCommentDTO },
    Record<string, unknown>
  >(UPDATE_COMMENT_STATUS_MUTATION, { id, status: status.toUpperCase() }, { authMode: 'required' });

  return mapBlogComment(data.updateBlogCommentStatus);
}

export async function deleteBlogComment(id: string): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogComment: boolean }, { id: string }>(
    DELETE_COMMENT_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogComment;
}
