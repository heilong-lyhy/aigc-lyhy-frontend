// src/features/blog/infrastructure/categories-api.ts

import type { BlogCategory } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogCategoryDTO {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly parentId: number | null;
  readonly sortOrder: number;
  readonly postCount: number;
  readonly children?: readonly BlogCategoryDTO[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogCategory(raw: BlogCategoryDTO): BlogCategory {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? null,
    parentId: raw.parentId,
    sortOrder: raw.sortOrder,
    postCount: raw.postCount,
    children: raw.children ? raw.children.map(mapBlogCategory) : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const CATEGORY_FRAGMENT = `
  fragment CategoryFields on BlogCategory {
    id name slug description parentId sortOrder postCount createdAt updatedAt
    children { id name slug description parentId sortOrder postCount createdAt updatedAt
      children { id name slug description parentId sortOrder postCount createdAt updatedAt }
    }
  }
`;

const FETCH_CATEGORIES_QUERY = `
  query FetchBlogCategories {
    blogCategories { ...CategoryFields }
  }
  ${CATEGORY_FRAGMENT}
`;

const FETCH_CATEGORY_TREE_QUERY = `
  query FetchBlogCategoryTree {
    blogCategoryTree { ...CategoryFields }
  }
  ${CATEGORY_FRAGMENT}
`;

const CREATE_CATEGORY_MUTATION = `
  mutation CreateBlogCategory($input: CreateBlogCategoryInput!) {
    createBlogCategory(input: $input) { ...CategoryFields }
  }
  ${CATEGORY_FRAGMENT}
`;

const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateBlogCategory($input: UpdateBlogCategoryInput!) {
    updateBlogCategory(input: $input) { ...CategoryFields }
  }
  ${CATEGORY_FRAGMENT}
`;

const DELETE_CATEGORY_MUTATION = `
  mutation DeleteBlogCategory($id: Int!) {
    deleteBlogCategory(id: $id)
  }
`;

// ── API 函数 ──

/** 公开：查询所有分类（平铺列表） */
export async function fetchBlogCategories(): Promise<readonly BlogCategory[]> {
  const data = await executeGraphQL<
    { blogCategories: readonly BlogCategoryDTO[] },
    Record<string, unknown>
  >(FETCH_CATEGORIES_QUERY, {}, { authMode: 'none' });

  return data.blogCategories.map(mapBlogCategory);
}

/** 公开：查询分类树 */
export async function fetchBlogCategoryTree(): Promise<readonly BlogCategory[]> {
  const data = await executeGraphQL<
    { blogCategoryTree: readonly BlogCategoryDTO[] },
    Record<string, unknown>
  >(FETCH_CATEGORY_TREE_QUERY, {}, { authMode: 'none' });

  return data.blogCategoryTree.map(mapBlogCategory);
}

/** 管理端：创建分类 */
export async function createBlogCategory(
  input: Readonly<{
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
    sortOrder?: number;
  }>,
): Promise<BlogCategory> {
  const data = await executeGraphQL<
    { createBlogCategory: BlogCategoryDTO },
    Record<string, unknown>
  >(CREATE_CATEGORY_MUTATION, { input }, { authMode: 'required' });

  return mapBlogCategory(data.createBlogCategory);
}

/** 管理端：更新分类 */
export async function updateBlogCategory(
  input: Readonly<{
    id: number;
    name?: string;
    slug?: string;
    description?: string;
    parentId?: number;
    sortOrder?: number;
  }>,
): Promise<BlogCategory> {
  const data = await executeGraphQL<
    { updateBlogCategory: BlogCategoryDTO },
    Record<string, unknown>
  >(UPDATE_CATEGORY_MUTATION, { input }, { authMode: 'required' });

  return mapBlogCategory(data.updateBlogCategory);
}

/** 管理端：删除分类 */
export async function deleteBlogCategory(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogCategory: boolean }, { id: number }>(
    DELETE_CATEGORY_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogCategory;
}
