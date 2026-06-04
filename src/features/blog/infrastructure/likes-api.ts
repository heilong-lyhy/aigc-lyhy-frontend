// src/features/blog/infrastructure/likes-api.ts

import type { BlogLike, BlogLikeTargetType } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

type LikeTargetTypeDTO = 'POST' | 'COMMENT';

interface BlogLikeDTO {
  readonly id: string;
  readonly targetType: LikeTargetTypeDTO;
  readonly targetId: string;
  readonly userId: string | null;
  readonly fingerprint: string | null;
  readonly createdAt: string;
}

interface ToggleLikeResultDTO {
  readonly liked: boolean;
  readonly like: BlogLikeDTO | null;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

const likeTargetTypeMap: Readonly<Record<LikeTargetTypeDTO, BlogLikeTargetType>> = {
  POST: 'post',
  COMMENT: 'comment',
};

function mapLikeTargetType(raw: LikeTargetTypeDTO): BlogLikeTargetType {
  return likeTargetTypeMap[raw];
}

function mapBlogLike(raw: BlogLikeDTO): BlogLike {
  return {
    id: raw.id,
    targetType: mapLikeTargetType(raw.targetType),
    targetId: raw.targetId,
    userId: raw.userId ?? null,
    fingerprint: raw.fingerprint ?? null,
    createdAt: raw.createdAt,
  };
}

// ── GraphQL Documents ──

const TOGGLE_LIKE_MUTATION = `
  mutation ToggleBlogLike($input: ToggleBlogLikeInput!) {
    toggleBlogLike(input: $input) {
      liked
      like { id targetType targetId userId fingerprint createdAt }
    }
  }
`;

const CHECK_LIKED_QUERY = `
  query CheckBlogLiked($targetType: LikeTargetTypeDTO!, $targetId: ID!) {
    blogLikeStatus(targetType: $targetType, targetId: $targetId) { liked }
  }
`;

// ── API 函数 ──

export async function toggleBlogLike(
  input: Readonly<{
    targetType: BlogLikeTargetType;
    targetId: string;
    fingerprint?: string;
  }>,
): Promise<{ liked: boolean; like: BlogLike | null }> {
  const data = await executeGraphQL<
    { toggleBlogLike: ToggleLikeResultDTO },
    Record<string, unknown>
  >(
    TOGGLE_LIKE_MUTATION,
    {
      input: {
        targetType: input.targetType.toUpperCase(),
        targetId: input.targetId,
        fingerprint: input.fingerprint,
      },
    },
    { authMode: 'none' },
  );

  return {
    liked: data.toggleBlogLike.liked,
    like: data.toggleBlogLike.like ? mapBlogLike(data.toggleBlogLike.like) : null,
  };
}

export async function checkBlogLiked(
  targetType: BlogLikeTargetType,
  targetId: string,
): Promise<boolean> {
  const data = await executeGraphQL<
    { blogLikeStatus: { liked: boolean } },
    Record<string, unknown>
  >(CHECK_LIKED_QUERY, { targetType: targetType.toUpperCase(), targetId }, { authMode: 'none' });

  return data.blogLikeStatus.liked;
}
