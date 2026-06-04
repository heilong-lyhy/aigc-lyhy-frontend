// src/features/blog/infrastructure/profile-api.ts

import type { BlogProfile, BlogSocialLink } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogSocialLinkDTO {
  readonly platform: string;
  readonly url: string;
  readonly icon: string | null;
}

interface BlogProfileDTO {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: string | null;
  readonly bio: string;
  readonly socialLinks: readonly BlogSocialLinkDTO[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapSocialLink(raw: BlogSocialLinkDTO): BlogSocialLink {
  return {
    platform: raw.platform,
    url: raw.url,
    icon: raw.icon ?? null,
  };
}

function mapBlogProfile(raw: BlogProfileDTO): BlogProfile {
  return {
    id: raw.id,
    nickname: raw.nickname,
    avatar: raw.avatar ?? null,
    bio: raw.bio,
    socialLinks: raw.socialLinks.map(mapSocialLink),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const FETCH_PROFILE_QUERY = `
  query FetchBlogProfile {
    blogProfile { id nickname avatar bio socialLinks { platform url icon } createdAt updatedAt }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateBlogProfile($input: UpdateBlogProfileInput!) {
    updateBlogProfile(input: $input) { id nickname avatar bio socialLinks { platform url icon } createdAt updatedAt }
  }
`;

// ── API 函数 ──

export async function fetchBlogProfile(): Promise<BlogProfile> {
  const data = await executeGraphQL<{ blogProfile: BlogProfileDTO }, Record<string, unknown>>(
    FETCH_PROFILE_QUERY,
    {},
    { authMode: 'none' },
  );

  return mapBlogProfile(data.blogProfile);
}

export async function updateBlogProfile(
  input: Readonly<
    Partial<{
      nickname: string;
      avatar: string | null;
      bio: string;
      socialLinks: readonly BlogSocialLink[];
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
