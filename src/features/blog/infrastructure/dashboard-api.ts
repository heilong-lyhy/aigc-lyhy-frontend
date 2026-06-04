// src/features/blog/infrastructure/dashboard-api.ts

import type { BlogDashboard } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

import { type BlogCommentDTO, mapBlogComment } from './comments-api';
import { type BlogPostDTO, mapBlogPost } from './posts-api';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogDashboardDTO {
  readonly totalPosts: number;
  readonly totalComments: number;
  readonly totalLikes: number;
  readonly totalViews: number;
  readonly recentPosts: readonly BlogPostDTO[];
  readonly recentComments: readonly BlogCommentDTO[];
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogDashboard(raw: BlogDashboardDTO): BlogDashboard {
  return {
    totalPosts: raw.totalPosts,
    totalComments: raw.totalComments,
    totalLikes: raw.totalLikes,
    totalViews: raw.totalViews,
    recentPosts: raw.recentPosts.map(mapBlogPost),
    recentComments: raw.recentComments.map(mapBlogComment),
  };
}

// ── GraphQL Documents ──

const FETCH_DASHBOARD_QUERY = `
  query FetchBlogDashboard {
    blogDashboard {
      totalPosts totalComments totalLikes totalViews
      recentPosts {
        id title slug excerpt content coverImage categoryId tags authorId
        status isPinned viewCount likeCount commentCount publishedAt createdAt updatedAt
      }
      recentComments {
        id postId authorName authorEmail authorAvatar content status
        parentId replyToId nestingLevel createdAt updatedAt
      }
    }
  }
`;

// ── API 函数 ──

export async function fetchBlogDashboard(): Promise<BlogDashboard> {
  const data = await executeGraphQL<{ blogDashboard: BlogDashboardDTO }, Record<string, unknown>>(
    FETCH_DASHBOARD_QUERY,
    {},
    { authMode: 'required' },
  );

  return mapBlogDashboard(data.blogDashboard);
}
