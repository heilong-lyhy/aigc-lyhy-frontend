// src/features/blog/hooks/use-admin-comments.ts

import { useCallback } from 'react';

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  deleteBlogComment,
  fetchBlogComments,
  updateBlogCommentStatus,
} from '../infrastructure/comments-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseAdminCommentsOptions = {
  readonly postId?: number;
  readonly pagination: PaginationInput;
  readonly status?: BlogCommentStatus;
  readonly autoLoad?: boolean;
};

type UseAdminCommentsResult = {
  readonly data: PaginatedResult<BlogComment> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly updateStatus: (id: number, status: BlogCommentStatus) => Promise<BlogComment | null>;
  readonly remove: (id: number) => Promise<boolean>;
  readonly batchUpdateStatus: (
    ids: readonly number[],
    status: BlogCommentStatus,
  ) => Promise<readonly BlogComment[]>;
  readonly batchRemove: (ids: readonly number[]) => Promise<readonly boolean[]>;
};

export function useAdminComments(options: UseAdminCommentsOptions): UseAdminCommentsResult {
  const { postId, pagination, status, autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogComment>> => {
    return await fetchBlogComments(pagination, { postId, status });
  }, [postId, pagination, status]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogComment>>({
    fetcher,
    autoLoad,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const updateStatus = useCallback(
    async (id: number, newStatus: BlogCommentStatus): Promise<BlogComment | null> => {
      clearMutationError();
      try {
        return await updateBlogCommentStatus({ id, status: newStatus });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update comment status';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  const remove = useCallback(async (id: number): Promise<boolean> => {
    clearMutationError();
    try {
      return await deleteBlogComment(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      setMutationError(message);
      return false;
    }
  }, [clearMutationError, setMutationError]);

  const batchUpdateStatus = useCallback(
    async (
      ids: readonly number[],
      newStatus: BlogCommentStatus,
    ): Promise<readonly BlogComment[]> => {
      clearMutationError();
      try {
        return await Promise.all(ids.map((id) => updateBlogCommentStatus({ id, status: newStatus })));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to batch update comment status';
        setMutationError(message);
        return [];
      }
    },
    [clearMutationError, setMutationError],
  );

  const batchRemove = useCallback(async (ids: readonly number[]): Promise<readonly boolean[]> => {
    clearMutationError();
    try {
      return await Promise.all(ids.map((id) => deleteBlogComment(id)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to batch delete comments';
      setMutationError(message);
      return [];
    }
  }, [clearMutationError, setMutationError]);

  return {
    data,
    isLoading,
    isEmpty: isEmptyPage(data, isLoading, error),
    error,
    mutationError,
    refetch,
    updateStatus,
    remove,
    batchUpdateStatus,
    batchRemove,
  };
}
