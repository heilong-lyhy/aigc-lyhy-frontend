// src/features/blog/hooks/use-blog-categories.ts

import { useCallback } from 'react';

import type { BlogCategory } from '@/entities/blog';

import { fetchBlogCategories } from '../infrastructure/categories-api';
import { useAsyncQuery } from '../lib/use-async-query';

type UseBlogCategoriesOptions = {
  readonly autoLoad?: boolean;
  /** API 失败时使用 mock 数据兜底（仅 dev 环境建议开启） */
  readonly useMockFallback?: boolean;
};

type UseBlogCategoriesResult = {
  readonly data: readonly BlogCategory[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

const EMPTY_CATEGORIES: readonly BlogCategory[] = [];

export function useBlogCategories(options: UseBlogCategoriesOptions = {}): UseBlogCategoriesResult {
  const { autoLoad = true, useMockFallback = false } = options;

  const fetcher = useCallback(async (): Promise<readonly BlogCategory[]> => {
    try {
      return await fetchBlogCategories();
    } catch (err) {
      if (useMockFallback) {
        const { mockBlogCategories } = await import('../infrastructure/mock');
        return mockBlogCategories;
      }
      throw err;
    }
  }, [useMockFallback]);

  const { data, isLoading, error, refetch } = useAsyncQuery<readonly BlogCategory[]>({
    fetcher,
    autoLoad,
  });

  const categories = data ?? EMPTY_CATEGORIES;

  return {
    data: categories,
    isLoading,
    isEmpty: categories.length === 0 && !isLoading && !error,
    error,
    refetch,
  };
}
