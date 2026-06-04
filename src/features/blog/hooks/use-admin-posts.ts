// src/features/blog/hooks/use-admin-posts.ts

import { useCallback, useReducer } from 'react';

import type { BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';

import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPosts,
  updateBlogPost,
} from '../infrastructure/posts-api';
import { useAsyncQuery } from '../lib/use-async-query';

type UseAdminPostsOptions = {
  readonly pagination: PaginationInput;
  readonly status?: BlogPostStatus;
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

type UseAdminPostsResult = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly create: (
    input: Readonly<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImage?: string | null;
      categoryId: string;
      tags: readonly string[];
      status: BlogPostStatus;
    }>,
  ) => Promise<BlogPost | null>;
  readonly update: (
    id: string,
    input: Readonly<
      Partial<{
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage: string | null;
        categoryId: string;
        tags: readonly string[];
        status: BlogPostStatus;
        isPinned: boolean;
      }>
    >,
  ) => Promise<BlogPost | null>;
  readonly remove: (id: string) => Promise<boolean>;
};

export function useAdminPosts(options: UseAdminPostsOptions): UseAdminPostsResult {
  const { pagination, status, autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogPost>> => {
    return await fetchBlogPosts(pagination, { status });
  }, [pagination, status]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogPost>>({
    fetcher,
    autoLoad,
  });

  const [mutationState, dispatchMutation] = useReducer(mutationErrorReducer, {
    mutationError: null,
  });

  const create = useCallback(
    async (
      input: Readonly<{
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage?: string | null;
        categoryId: string;
        tags: readonly string[];
        status: BlogPostStatus;
      }>,
    ): Promise<BlogPost | null> => {
      dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
      try {
        return await createBlogPost(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create post';
        dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
        return null;
      }
    },
    [],
  );

  const update = useCallback(
    async (
      id: string,
      input: Readonly<
        Partial<{
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          coverImage: string | null;
          categoryId: string;
          tags: readonly string[];
          status: BlogPostStatus;
          isPinned: boolean;
        }>
      >,
    ): Promise<BlogPost | null> => {
      dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
      try {
        return await updateBlogPost(id, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update post';
        dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
        return null;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
    try {
      return await deleteBlogPost(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
      return false;
    }
  }, []);

  return {
    data,
    isLoading,
    isEmpty: data !== null && data.items.length === 0 && !isLoading && !error,
    error,
    mutationError: mutationState.mutationError,
    refetch,
    create,
    update,
    remove,
  };
}
