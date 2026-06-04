// src/features/blog/hooks/use-admin-comments.ts

import { useCallback, useReducer } from 'react';

import type {
  BlogComment,
  BlogCommentStatus,
  PaginatedResult,
  PaginationInput,
} from '@/entities/blog';

import {
  deleteBlogComment,
  fetchBlogComments,
  updateBlogCommentStatus,
} from '../infrastructure/comments-api';
import { useAsyncQuery } from '../lib/use-async-query';

type UseAdminCommentsOptions = {
  readonly postId?: string;
  readonly pagination: PaginationInput;
  readonly status?: BlogCommentStatus;
  readonly autoLoad?: boolean;
};

type MutationErrorState = {
  mutationError: string | null;
};

type MutationErrorAction =
  | { type: 'CLEAR_MUTATION_ERROR' }
  | { type: 'MUTATION_ERROR'; payload: string };

const mutationErrorReducer = (
  _state: MutationErrorState,
  action: MutationErrorAction,
): MutationErrorState => {
  switch (action.type) {
    case 'CLEAR_MUTATION_ERROR':
      return { mutationError: null };
    case 'MUTATION_ERROR':
      return { mutationError: action.payload };
  }
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

  const [mutationState, dispatchMutation] = useReducer(mutationErrorReducer, {
    mutationError: null,
  });

  const updateStatus = useCallback(
    async (id: string, newStatus: BlogCommentStatus): Promise<BlogComment | null> => {
      dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
      try {
        return await updateBlogCommentStatus(id, newStatus);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update comment status';
        dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
        return null;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
    try {
      return await deleteBlogComment(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
      return false;
    }
  }, []);

  const batchUpdateStatus = useCallback(
    async (
      ids: readonly string[],
      newStatus: BlogCommentStatus,
    ): Promise<readonly BlogComment[]> => {
      dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
      try {
        const results = await Promise.all(ids.map((id) => updateBlogCommentStatus(id, newStatus)));
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to batch update comment status';
        dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
        return [];
      }
    },
    [],
  );

  const batchRemove = useCallback(async (ids: readonly string[]): Promise<readonly boolean[]> => {
    dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
    try {
      return Promise.all(ids.map((id) => deleteBlogComment(id)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to batch delete comments';
      dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
      return [];
    }
  }, []);

  return {
    data,
    isLoading,
    isEmpty: data !== null && data.items.length === 0 && !isLoading && !error,
    error,
    mutationError: mutationState.mutationError,
    refetch,
    updateStatus,
    remove,
    batchUpdateStatus,
    batchRemove,
  };
}
