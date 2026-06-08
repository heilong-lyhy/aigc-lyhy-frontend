// src/features/blog/infrastructure/dashboard-api.ts

import type { BlogDashboard } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogDashboardDTO {
  readonly totalPosts: number;
  readonly publishedPosts: number;
  readonly draftPosts: number;
  readonly totalCategories: number;
  readonly totalTags: number;
  readonly totalComments: number;
  readonly pendingComments: number;
  readonly totalLikes: number;
  readonly totalViews: number;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogDashboard(raw: BlogDashboardDTO): BlogDashboard {
  return {
    totalPosts: raw.totalPosts,
    publishedPosts: raw.publishedPosts,
    draftPosts: raw.draftPosts,
    totalCategories: raw.totalCategories,
    totalTags: raw.totalTags,
    totalComments: raw.totalComments,
    pendingComments: raw.pendingComments,
    totalLikes: raw.totalLikes,
    totalViews: raw.totalViews,
  };
}

// ── GraphQL Documents ──

const FETCH_DASHBOARD_QUERY = `
  query FetchBlogDashboard {
    blogDashboardStats {
      totalPosts publishedPosts draftPosts totalCategories totalTags
      totalComments pendingComments totalLikes totalViews
    }
  }
`;

// ── API 函数 ──

/** 管理端：查询博客仪表盘统计 */
export async function fetchBlogDashboard(): Promise<BlogDashboard> {
  const data = await executeGraphQL<{ blogDashboardStats: BlogDashboardDTO }, Record<string, unknown>>(
    FETCH_DASHBOARD_QUERY,
    {},
    { authMode: 'required' },
  );

  return mapBlogDashboard(data.blogDashboardStats);
}
