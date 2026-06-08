// src/features/blog/application/use-blog-comments.ts

import { useCallback, useMemo } from 'react';

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogCommentsByPost } from '../infrastructure/comments-api';

type UseBlogCommentsOptions = {
  readonly postId: number;
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
  const { postId, autoLoad = true } = options;

  /* eslint-disable react-hooks/exhaustive-deps -- 字段级 deps 防止调用方传字面量对象导致引用不稳定 */
  const pagination = useMemo(
    () => options.pagination,
    [options.pagination?.page, options.pagination?.pageSize],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogComment>> => {
    if (!postId) throw new Error('postId is required');
    return await fetchBlogCommentsByPost(postId, pagination);
  }, [postId, pagination]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogComment>>({
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
