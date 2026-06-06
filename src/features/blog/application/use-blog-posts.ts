// src/features/blog/hooks/use-blog-posts.ts

import { useCallback } from 'react';

import type { BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogPosts } from '../infrastructure/posts-api';

type UseBlogPostsOptions = {
  readonly pagination: PaginationInput;
  readonly status?: BlogPostStatus;
  readonly categoryId?: string;
  readonly tagId?: string;
  readonly autoLoad?: boolean;
  /** API 失败时使用 mock 数据兜底（仅 dev 环境建议开启） */
  readonly useMockFallback?: boolean;
};

type UseBlogPostsResult = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogPosts(options: UseBlogPostsOptions): UseBlogPostsResult {
  const { pagination, status, categoryId, tagId, autoLoad = true, useMockFallback = false } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogPost>> => {
    try {
      return await fetchBlogPosts(pagination, {
        status,
        categoryId,
        tagId,
      });
    } catch (err) {
      if (useMockFallback) {
        const { mockBlogPosts } = await import('../infrastructure/mock');
        const filtered = status ? mockBlogPosts.filter((p) => p.status === status) : mockBlogPosts;
        return {
          items: filtered,
          total: filtered.length,
          offset: pagination.offset,
          limit: pagination.limit,
          hasMore: false,
        };
      }
      throw err;
    }
  }, [pagination, status, categoryId, tagId, useMockFallback]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogPost>>({
    fetcher,
    autoLoad,
  });

  return {
    data,
    isLoading,
    isEmpty: isEmptyPage(data, isLoading, error),
    error,
    refetch,
  };
}
