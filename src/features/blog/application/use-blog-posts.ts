// src/features/blog/application/use-blog-posts.ts

import { useCallback } from 'react';

import type { BlogPost, PaginatedResult, PaginationInput } from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogPublishedPosts } from '../infrastructure/posts-api';

type UseBlogPostsOptions = {
  readonly pagination: PaginationInput;
  readonly autoLoad?: boolean;
};

type UseBlogPostsResult = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogPosts(options: UseBlogPostsOptions): UseBlogPostsResult {
  const { pagination, autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogPost>> => {
    return await fetchBlogPublishedPosts(pagination);
  }, [pagination]);

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
