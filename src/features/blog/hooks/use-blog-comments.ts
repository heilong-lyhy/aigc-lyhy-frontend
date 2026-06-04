// src/features/blog/hooks/use-blog-comments.ts

import { useCallback } from 'react';

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';

import { fetchBlogComments } from '../infrastructure/comments-api';
import { useAsyncQuery } from '../lib/use-async-query';

type UseBlogCommentsOptions = {
  readonly postId: string;
  readonly pagination: PaginationInput;
  readonly status?: BlogCommentStatus;
  readonly autoLoad?: boolean;
};

type UseBlogCommentsResult = {
  readonly data: PaginatedResult<BlogComment> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogComments(options: UseBlogCommentsOptions): UseBlogCommentsResult {
  const { postId, pagination, status, autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogComment>> => {
    if (!postId) throw new Error('postId is required');
    return await fetchBlogComments(postId, pagination, { status });
  }, [postId, pagination, status]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogComment>>({
    fetcher,
    autoLoad,
  });

  return {
    data,
    isLoading,
    isEmpty: data !== null && data.items.length === 0 && !isLoading && !error,
    error,
    refetch,
  };
}
