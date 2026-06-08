// src/features/blog/application/use-blog-tags.ts

import { useCallback } from 'react';

import type { BlogTag } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogTags } from '../infrastructure/tags-api';

type UseBlogTagsOptions = {
  readonly autoLoad?: boolean;
  /** API 失败时使用 mock 数据兜底（仅 dev 环境建议开启） */
  readonly useMockFallback?: boolean;
};

type UseBlogTagsResult = {
  readonly data: readonly BlogTag[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

const EMPTY_TAGS: readonly BlogTag[] = [];

export function useBlogTags(options: UseBlogTagsOptions = {}): UseBlogTagsResult {
  const { autoLoad = true, useMockFallback = false } = options;

  const fetcher = useCallback(async (): Promise<readonly BlogTag[]> => {
    try {
      return await fetchBlogTags();
    } catch (err) {
      if (useMockFallback) {
        const { mockBlogTags } = await import('../infrastructure/mock');
        return mockBlogTags;
      }
      throw err;
    }
  }, [useMockFallback]);

  const { data, isLoading, error, refetch } = useAsyncQuery<readonly BlogTag[]>({
    fetcher,
    autoLoad,
  });

  const tags = data ?? EMPTY_TAGS;

  return {
    data: tags,
    isLoading,
    isEmpty: tags.length === 0 && !isLoading && !error,
    error,
    refetch,
  };
}
