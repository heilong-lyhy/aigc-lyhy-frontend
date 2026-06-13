// src/features/blog/infrastructure/friend-links-api.ts

import type { BlogFriendLink } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogFriendLinkDTO {
  readonly id: number;
  readonly name: string;
  readonly url: string;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogFriendLink(raw: BlogFriendLinkDTO): BlogFriendLink {
  return {
    id: String(raw.id),
    name: raw.name,
    url: raw.url,
    description: raw.description,
    logoUrl: raw.logoUrl,
    sortOrder: raw.sortOrder,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const FETCH_FRIEND_LINKS_QUERY = `
  query FetchBlogFriendLinks {
    blogFriendLinks { id name url description logoUrl sortOrder isActive createdAt updatedAt }
  }
`;

const CREATE_FRIEND_LINK_MUTATION = `
  mutation CreateBlogFriendLink($input: CreateBlogFriendLinkInput!) {
    createBlogFriendLink(input: $input) { id name url description logoUrl sortOrder isActive createdAt updatedAt }
  }
`;

const UPDATE_FRIEND_LINK_MUTATION = `
  mutation UpdateBlogFriendLink($input: UpdateBlogFriendLinkInput!) {
    updateBlogFriendLink(input: $input) { id name url description logoUrl sortOrder isActive createdAt updatedAt }
  }
`;

const DELETE_FRIEND_LINK_MUTATION = `
  mutation DeleteBlogFriendLink($id: Int!) {
    deleteBlogFriendLink(id: $id)
  }
`;

// ── API 函数 ──

/** 公开：查询所有友链 */
export async function fetchBlogFriendLinks(): Promise<readonly BlogFriendLink[]> {
  const data = await executeGraphQL<
    { blogFriendLinks: readonly BlogFriendLinkDTO[] },
    Record<string, unknown>
  >(FETCH_FRIEND_LINKS_QUERY, {}, { authMode: 'none' });

  return data.blogFriendLinks.map(mapBlogFriendLink);
}

/** 管理端：创建友链 */
export async function createBlogFriendLink(
  input: Readonly<{
    name: string;
    url: string;
    description?: string;
    logoUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }>,
): Promise<BlogFriendLink> {
  const data = await executeGraphQL<
    { createBlogFriendLink: BlogFriendLinkDTO },
    Record<string, unknown>
  >(CREATE_FRIEND_LINK_MUTATION, { input }, { authMode: 'required' });

  return mapBlogFriendLink(data.createBlogFriendLink);
}

/** 管理端：更新友链 */
export async function updateBlogFriendLink(
  input: Readonly<{
    id: number;
    name?: string;
    url?: string;
    description?: string;
    logoUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }>,
): Promise<BlogFriendLink> {
  const data = await executeGraphQL<
    { updateBlogFriendLink: BlogFriendLinkDTO },
    Record<string, unknown>
  >(UPDATE_FRIEND_LINK_MUTATION, { input }, { authMode: 'required' });

  return mapBlogFriendLink(data.updateBlogFriendLink);
}

/** 管理端：删除友链 */
export async function deleteBlogFriendLink(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogFriendLink: boolean }, { id: number }>(
    DELETE_FRIEND_LINK_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogFriendLink;
}
