// src/features/blog/application/use-blog-posts.ts

import { useCallback } from 'react';

import type { BlogPost, PaginatedResult, PaginationInput } from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogPublishedPosts } from '../infrastructure/posts-api';

type UseBlogPostsOptions = {
  readonly pagination: PaginationInput;
  readonly categoryId?: number;
  readonly tagId?: number;
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
  const { pagination, categoryId, tagId, autoLoad = true } = options;

  // 字段级依赖，避免调用方传入新对象引用导致不必要的重渲染
  const page = pagination.page;
  const pageSize = pagination.pageSize;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogPost>> => {
    return await fetchBlogPublishedPosts({ page, pageSize }, {
      categoryId,
      tagId,
    });
  }, [page, pageSize, categoryId, tagId]);

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
