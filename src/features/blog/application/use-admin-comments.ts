// src/features/blog/application/use-admin-comments.ts

import { useCallback, useMemo } from 'react';

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
  hideBlogComment,
  replyBlogComment,
  unhideBlogComment,
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
  readonly reply: (commentId: number, content: string) => Promise<BlogComment | null>;
  readonly hide: (id: number) => Promise<BlogComment | null>;
  readonly unhide: (id: number) => Promise<BlogComment | null>;
  readonly batchUpdateStatus: (
    ids: readonly number[],
    status: BlogCommentStatus,
  ) => Promise<readonly BlogComment[]>;
  readonly batchRemove: (ids: readonly number[]) => Promise<readonly boolean[]>;
};

export function useAdminComments(options: UseAdminCommentsOptions): UseAdminCommentsResult {
  const { postId, status, autoLoad = true } = options;

  /* eslint-disable react-hooks/exhaustive-deps -- 字段级 deps 防止调用方传字面量对象导致引用不稳定 */
  const pagination = useMemo(
    () => options.pagination,
    [options.pagination?.page, options.pagination?.pageSize],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

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
        const result = await updateBlogCommentStatus({ id, status: newStatus });
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update comment status';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const remove = useCallback(
    async (id: number): Promise<boolean> => {
      clearMutationError();
      try {
        const result = await deleteBlogComment(id);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete comment';
        setMutationError(message);
        return false;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const reply = useCallback(
    async (commentId: number, content: string): Promise<BlogComment | null> => {
      clearMutationError();
      try {
        const result = await replyBlogComment({ commentId, content });
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reply comment';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const hide = useCallback(
    async (id: number): Promise<BlogComment | null> => {
      clearMutationError();
      try {
        const result = await hideBlogComment(id);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to hide comment';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const unhide = useCallback(
    async (id: number): Promise<BlogComment | null> => {
      clearMutationError();
      try {
        const result = await unhideBlogComment(id);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unhide comment';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const batchUpdateStatus = useCallback(
    async (
      ids: readonly number[],
      newStatus: BlogCommentStatus,
    ): Promise<readonly BlogComment[]> => {
      clearMutationError();
      try {
        const results = await Promise.all(
          ids.map((id) => updateBlogCommentStatus({ id, status: newStatus })),
        );
        await refetch();
        return results;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to batch update comment status';
        setMutationError(message);
        return [];
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const batchRemove = useCallback(
    async (ids: readonly number[]): Promise<readonly boolean[]> => {
      clearMutationError();
      try {
        const results = await Promise.all(ids.map((id) => deleteBlogComment(id)));
        await refetch();
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to batch delete comments';
        setMutationError(message);
        return [];
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  return {
    data,
    isLoading,
    isEmpty: isEmptyPage(data, isLoading, error),
    error,
    mutationError,
    refetch,
    updateStatus,
    remove,
    reply,
    hide,
    unhide,
    batchUpdateStatus,
    batchRemove,
  };
}
