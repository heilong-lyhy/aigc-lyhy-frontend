// src/features/blog/infrastructure/tags-api.ts

import type { BlogTag } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogTagDTO {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogTag(raw: BlogTagDTO): BlogTag {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    postCount: raw.postCount,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const FETCH_TAGS_QUERY = `
  query FetchBlogTags {
    blogTags { id name slug postCount createdAt updatedAt }
  }
`;

const CREATE_TAG_MUTATION = `
  mutation CreateBlogTag($name: String!, $slug: String!) {
    createBlogTag(name: $name, slug: $slug) { id name slug postCount createdAt updatedAt }
  }
`;

const DELETE_TAG_MUTATION = `
  mutation DeleteBlogTag($id: Int!) {
    deleteBlogTag(id: $id)
  }
`;

// ── API 函数 ──

/** 公开：查询所有标签 */
export async function fetchBlogTags(): Promise<readonly BlogTag[]> {
  const data = await executeGraphQL<{ blogTags: readonly BlogTagDTO[] }, Record<string, unknown>>(
    FETCH_TAGS_QUERY,
    {},
    { authMode: 'none' },
  );

  return data.blogTags.map(mapBlogTag);
}

/** 管理端：创建标签（后端使用独立参数，非 input 对象） */
export async function createBlogTag(
  input: Readonly<{ name: string; slug: string }>,
): Promise<BlogTag> {
  const data = await executeGraphQL<{ createBlogTag: BlogTagDTO }, Record<string, unknown>>(
    CREATE_TAG_MUTATION,
    { name: input.name, slug: input.slug },
    { authMode: 'required' },
  );

  return mapBlogTag(data.createBlogTag);
}

/** 管理端：删除标签 */
export async function deleteBlogTag(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogTag: boolean }, { id: number }>(
    DELETE_TAG_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogTag;
}
