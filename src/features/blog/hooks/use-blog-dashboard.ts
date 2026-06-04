// src/features/blog/hooks/use-blog-dashboard.ts

import { useCallback } from 'react';

import type { BlogDashboard } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks/use-async-query';

import { fetchBlogDashboard } from '../infrastructure/dashboard-api';

type UseBlogDashboardOptions = {
  readonly autoLoad?: boolean;
  /** API 失败时使用 mock 数据兜底（仅 dev 环境建议开启） */
  readonly useMockFallback?: boolean;
};

type UseBlogDashboardResult = {
  readonly data: BlogDashboard | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogDashboard(options: UseBlogDashboardOptions = {}): UseBlogDashboardResult {
  const { autoLoad = true, useMockFallback = false } = options;

  const fetcher = useCallback(async (): Promise<BlogDashboard> => {
    try {
      return await fetchBlogDashboard();
    } catch (err) {
      if (useMockFallback) {
        const { mockBlogDashboard } = await import('../infrastructure/mock');
        return mockBlogDashboard;
      }
      throw err;
    }
  }, [useMockFallback]);

  const { data, isLoading, error, refetch } = useAsyncQuery<BlogDashboard>({
    fetcher,
    autoLoad,
  });

  return {
    data,
    isLoading,
    isEmpty: data !== null && !isLoading && !error,
    error,
    refetch,
  };
}
