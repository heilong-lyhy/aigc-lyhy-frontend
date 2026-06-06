// src/features/blog/hooks/use-admin-comments.ts

import { useCallback } from 'react';

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks/use-async-query';

import {
  deleteBlogComment,
  fetchBlogComments,
  updateBlogCommentStatus,
} from '../infrastructure/comments-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseAdminCommentsOptions = {
  readonly postId?: string;
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
  readonly updateStatus: (id: string, status: BlogCommentStatus) => Promise<BlogComment | null>;
  readonly remove: (id: string) => Promise<boolean>;
  readonly batchUpdateStatus: (
    ids: readonly string[],
    status: BlogCommentStatus,
  ) => Promise<readonly BlogComment[]>;
  readonly batchRemove: (ids: readonly string[]) => Promise<readonly boolean[]>;
};

export function useAdminComments(options: UseAdminCommentsOptions): UseAdminCommentsResult {
  const { postId, pagination, status, autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogComment>> => {
    if (!postId) throw new Error('postId is required');
    return await fetchBlogComments(postId, pagination, { status });
  }, [postId, pagination, status]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogComment>>({
    fetcher,
    autoLoad: autoLoad && !!postId,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const updateStatus = useCallback(
    async (id: string, newStatus: BlogCommentStatus): Promise<BlogComment | null> => {
      clearMutationError();
      try {
        return await updateBlogCommentStatus(id, newStatus);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update comment status';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
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
      ids: readonly string[],
      newStatus: BlogCommentStatus,
    ): Promise<readonly BlogComment[]> => {
      clearMutationError();
      try {
        const results = await Promise.all(ids.map((id) => updateBlogCommentStatus(id, newStatus)));
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to batch update comment status';
        setMutationError(message);
        return [];
      }
    },
    [clearMutationError, setMutationError],
  );

  const batchRemove = useCallback(async (ids: readonly string[]): Promise<readonly boolean[]> => {
    clearMutationError();
    try {
      return Promise.all(ids.map((id) => deleteBlogComment(id)));
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
