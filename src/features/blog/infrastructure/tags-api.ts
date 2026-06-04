// src/features/blog/infrastructure/tags-api.ts

import type { BlogTag } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogTagDTO {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
  readonly createdAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogTag(raw: BlogTagDTO): BlogTag {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    postCount: raw.postCount,
    createdAt: raw.createdAt,
  };
}

// ── GraphQL Documents ──

const FETCH_TAGS_QUERY = `
  query FetchBlogTags {
    blogTags { id name slug postCount createdAt }
  }
`;

const CREATE_TAG_MUTATION = `
  mutation CreateBlogTag($input: CreateBlogTagInput!) {
    createBlogTag(input: $input) { id name slug postCount createdAt }
  }
`;

const DELETE_TAG_MUTATION = `
  mutation DeleteBlogTag($id: ID!) {
    deleteBlogTag(id: $id)
  }
`;

// ── API 函数 ──

export async function fetchBlogTags(): Promise<readonly BlogTag[]> {
  const data = await executeGraphQL<{ blogTags: readonly BlogTagDTO[] }, Record<string, unknown>>(
    FETCH_TAGS_QUERY,
    {},
    { authMode: 'none' },
  );

  return data.blogTags.map(mapBlogTag);
}

export async function createBlogTag(
  input: Readonly<{ name: string; slug: string }>,
): Promise<BlogTag> {
  const data = await executeGraphQL<{ createBlogTag: BlogTagDTO }, Record<string, unknown>>(
    CREATE_TAG_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogTag(data.createBlogTag);
}

export async function deleteBlogTag(id: string): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogTag: boolean }, { id: string }>(
    DELETE_TAG_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogTag;
}
