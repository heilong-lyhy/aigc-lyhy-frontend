// src/features/blog/infrastructure/profile-api.ts

import type { BlogProfile } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogProfileDTO {
  readonly id: number;
  readonly nickname: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly socialLinks: Record<string, string> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

export function mapBlogProfile(raw: BlogProfileDTO): BlogProfile {
  return {
    id: String(raw.id),
    nickname: raw.nickname,
    bio: raw.bio ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    socialLinks: raw.socialLinks ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const FETCH_PROFILE_QUERY = `
  query FetchBlogProfile {
    blogProfile { id nickname bio avatarUrl socialLinks createdAt updatedAt }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateBlogProfile($input: UpdateBlogProfileInput!) {
    updateBlogProfile(input: $input) { id nickname bio avatarUrl socialLinks createdAt updatedAt }
  }
`;

// ── API 函数 ──

/** 公开：查询博主信息 */
export async function fetchBlogProfile(): Promise<BlogProfile | null> {
  const data = await executeGraphQL<{ blogProfile: BlogProfileDTO | null }, Record<string, unknown>>(
    FETCH_PROFILE_QUERY,
    {},
    { authMode: 'none' },
  );

  return data.blogProfile ? mapBlogProfile(data.blogProfile) : null;
}

/** 管理端：更新博主信息 */
export async function updateBlogProfile(
  input: Readonly<
    Partial<{
      nickname: string;
      bio: string;
      avatarUrl: string | null;
      socialLinks: Record<string, string> | null;
    }>
  >,
): Promise<BlogProfile> {
  const data = await executeGraphQL<{ updateBlogProfile: BlogProfileDTO }, Record<string, unknown>>(
    UPDATE_PROFILE_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogProfile(data.updateBlogProfile);
}
