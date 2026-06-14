// src/features/blog/infrastructure/likes-api.ts

import type { BlogLike } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── GraphQL Documents ──

/** 点赞/取消点赞文章（后端返回 liked: boolean） */
const TOGGLE_LIKE_MUTATION = `
  mutation ToggleBlogPostLike($postId: Int!, $userIdentifier: String!) {
    toggleBlogPostLike(postId: $postId, userIdentifier: $userIdentifier)
  }
`;

/** 判断用户是否已对文章点赞 */
const CHECK_LIKED_QUERY = `
  query HasLikedBlogPost($postId: Int!, $userIdentifier: String!) {
    hasLikedBlogPost(postId: $postId, userIdentifier: $userIdentifier)
  }
`;

// ── API 函数 ──

/** 点赞/取消点赞文章（幂等 toggle） */
export async function toggleBlogPostLike(
  postId: number,
  userIdentifier: string,
): Promise<BlogLike> {
  const authMode = userIdentifier.startsWith('user:') ? 'required' : 'none';

  const data = await executeGraphQL<
    { toggleBlogPostLike: boolean },
    { postId: number; userIdentifier: string }
  >(
    TOGGLE_LIKE_MUTATION,
    { postId, userIdentifier },
    { authMode },
  );

  return { liked: data.toggleBlogPostLike };
}

/** 判断用户是否已对文章点赞 */
export async function checkBlogPostLiked(
  postId: number,
  userIdentifier: string,
): Promise<boolean> {
  const authMode = userIdentifier.startsWith('user:') ? 'required' : 'none';

  const data = await executeGraphQL<
    { hasLikedBlogPost: boolean },
    { postId: number; userIdentifier: string }
  >(CHECK_LIKED_QUERY, { postId, userIdentifier }, { authMode });

  return data.hasLikedBlogPost;
}
