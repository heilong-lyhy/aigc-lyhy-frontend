// src/features/blog/application/use-blog-profile.ts

import { useCallback } from 'react';

import type { BlogProfile } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogProfile } from '../infrastructure';

type UseBlogProfileOptions = {
  readonly autoLoad?: boolean;
  /** API 失败时使用 mock 数据兜底（仅 dev 环境建议开启） */
  readonly useMockFallback?: boolean;
};

type UseBlogProfileResult = {
  readonly data: BlogProfile | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogProfile(options: UseBlogProfileOptions = {}): UseBlogProfileResult {
  const { autoLoad = true, useMockFallback = false } = options;

  const fetcher = useCallback(async (): Promise<BlogProfile> => {
    try {
      return await fetchBlogProfile();
    } catch (err) {
      if (useMockFallback) {
        const { mockBlogProfile } = await import('../infrastructure/mock');
        return mockBlogProfile;
      }
      throw err;
    }
  }, [useMockFallback]);

  const { data, isLoading, error, refetch } = useAsyncQuery<BlogProfile>({
    fetcher,
    autoLoad,
  });

  return {
    data,
    isLoading,
    isEmpty: data === null && !isLoading && !error,
    error,
    refetch,
  };
}
