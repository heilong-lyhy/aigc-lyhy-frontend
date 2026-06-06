// src/features/blog/infrastructure/categories-api.ts

import type { BlogCategory } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogCategoryDTO {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly parentId: string | null;
  readonly children: readonly BlogCategoryDTO[];
  readonly sortOrder: number;
  readonly postCount: number;
  readonly createdAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogCategory(raw: BlogCategoryDTO): BlogCategory {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    parentId: raw.parentId ?? null,
    children: raw.children.map(mapBlogCategory),
    sortOrder: raw.sortOrder,
    postCount: raw.postCount,
    createdAt: raw.createdAt,
  };
}

// ── GraphQL Documents ──

const BLOG_CATEGORY_FRAGMENT = `
  fragment BlogCategoryFields on BlogCategory {
    id name slug description parentId sortOrder postCount createdAt
    children { id name slug description parentId sortOrder postCount createdAt
      children { id name slug description parentId sortOrder postCount createdAt
        children { id }
      }
    }
  }
`;

const FETCH_CATEGORIES_QUERY = `
  query FetchBlogCategories {
    blogCategories { ...BlogCategoryFields }
  }
  ${BLOG_CATEGORY_FRAGMENT}
`;

const CREATE_CATEGORY_MUTATION = `
  mutation CreateBlogCategory($input: CreateBlogCategoryInput!) {
    createBlogCategory(input: $input) { ...BlogCategoryFields }
  }
  ${BLOG_CATEGORY_FRAGMENT}
`;

const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateBlogCategory($id: ID!, $input: UpdateBlogCategoryInput!) {
    updateBlogCategory(id: $id, input: $input) { ...BlogCategoryFields }
  }
  ${BLOG_CATEGORY_FRAGMENT}
`;

const DELETE_CATEGORY_MUTATION = `
  mutation DeleteBlogCategory($id: ID!) {
    deleteBlogCategory(id: $id)
  }
`;

// ── API 函数 ──

export async function fetchBlogCategories(): Promise<readonly BlogCategory[]> {
  const data = await executeGraphQL<
    { blogCategories: readonly BlogCategoryDTO[] },
    Record<string, unknown>
  >(FETCH_CATEGORIES_QUERY, {}, { authMode: 'none' });

  return data.blogCategories.map(mapBlogCategory);
}

export async function createBlogCategory(
  input: Readonly<{
    name: string;
    slug: string;
    description: string;
    parentId?: string | null;
    sortOrder?: number;
  }>,
): Promise<BlogCategory> {
  const data = await executeGraphQL<
    { createBlogCategory: BlogCategoryDTO },
    Record<string, unknown>
  >(CREATE_CATEGORY_MUTATION, { input }, { authMode: 'required' });

  return mapBlogCategory(data.createBlogCategory);
}

export async function updateBlogCategory(
  id: string,
  input: Readonly<
    Partial<{
      name: string;
      slug: string;
      description: string;
      parentId: string | null;
      sortOrder: number;
    }>
  >,
): Promise<BlogCategory> {
  const data = await executeGraphQL<
    { updateBlogCategory: BlogCategoryDTO },
    Record<string, unknown>
  >(UPDATE_CATEGORY_MUTATION, { id, input }, { authMode: 'required' });

  return mapBlogCategory(data.updateBlogCategory);
}

export async function deleteBlogCategory(id: string): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogCategory: boolean }, { id: string }>(
    DELETE_CATEGORY_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogCategory;
}
