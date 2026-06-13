// src/features/blog/application/use-admin-categories.ts

import { useCallback } from 'react';

import type { BlogCategory } from '@/entities/blog';

import { useAsyncQuery, useMutationError } from '@/shared/hooks';

import {
  createBlogCategory,
  deleteBlogCategory,
  fetchBlogCategoryTree,
  updateBlogCategory,
} from '../infrastructure/categories-api';

type UseAdminCategoriesOptions = {
  readonly autoLoad?: boolean;
};

type UseAdminCategoriesResult = {
  readonly data: readonly BlogCategory[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly create: (
    input: Readonly<{ name: string; slug: string; parentId?: number; sortOrder?: number }>,
  ) => Promise<BlogCategory | null>;
  readonly update: (
    input: Readonly<{ id: number; name?: string; slug?: string; parentId?: number | null; sortOrder?: number }>,
  ) => Promise<BlogCategory | null>;
  readonly remove: (id: number) => Promise<boolean>;
};

const EMPTY_CATEGORIES: readonly BlogCategory[] = [];

export function useAdminCategories(
  options: UseAdminCategoriesOptions = {},
): UseAdminCategoriesResult {
  const { autoLoad = true } = options;

  // 管理端使用分类树接口，以支持树形展示
  const fetcher = useCallback(async (): Promise<readonly BlogCategory[]> => {
    return await fetchBlogCategoryTree();
  }, []);

  const { data, isLoading, error, refetch } = useAsyncQuery<readonly BlogCategory[]>({
    fetcher,
    autoLoad,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const categories = data ?? EMPTY_CATEGORIES;

  const create = useCallback(
    async (
      input: Readonly<{ name: string; slug: string; parentId?: number; sortOrder?: number }>,
    ): Promise<BlogCategory | null> => {
      clearMutationError();
      try {
        const result = await createBlogCategory(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create category';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const update = useCallback(
    async (
      input: Readonly<{
        id: number;
        name?: string;
        slug?: string;
        parentId?: number | null;
        sortOrder?: number;
      }>,
    ): Promise<BlogCategory | null> => {
      clearMutationError();
      try {
        const result = await updateBlogCategory(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update category';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const remove = useCallback(
    async (id: number): Promise<boolean> => {
      clearMutationError();
      try {
        const result = await deleteBlogCategory(id);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete category';
        setMutationError(message);
        return false;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  return {
    data: categories,
    isLoading,
    isEmpty: categories.length === 0 && !isLoading && !error,
    error,
    mutationError,
    refetch,
    create,
    update,
    remove,
  };
}
