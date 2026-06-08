// src/features/blog/application/use-admin-posts.ts

import { useCallback, useMemo } from 'react';

import type { BlogPost, BlogPostDetail, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { isEmptyPage } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPostById,
  fetchBlogPosts,
  updateBlogPost,
} from '../infrastructure/posts-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseAdminPostsOptions = {
  readonly pagination: PaginationInput;
  readonly status?: BlogPostStatus;
  readonly autoLoad?: boolean;
};

type UseAdminPostsResult = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly loadById: (id: number) => Promise<BlogPostDetail | null>;
  readonly create: (
    input: Readonly<{
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      coverImage?: string | null;
      categoryId?: number;
      tags?: readonly string[];
      status?: BlogPostStatus;
    }>,
  ) => Promise<BlogPostDetail | null>;
  readonly update: (
    input: Readonly<
      Partial<{
        id: number;
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage: string | null;
        categoryId: number;
        tags: readonly string[];
        status: BlogPostStatus;
        isPinned: boolean;
      }> & { id: number }
    >,
  ) => Promise<BlogPostDetail | null>;
  readonly remove: (id: number) => Promise<boolean>;
};

export function useAdminPosts(options: UseAdminPostsOptions): UseAdminPostsResult {
  const { status, autoLoad = true } = options;

  /* eslint-disable react-hooks/exhaustive-deps -- 字段级 deps 防止调用方传字面量对象导致引用不稳定 */
  const pagination = useMemo(
    () => options.pagination,
    [options.pagination?.page, options.pagination?.pageSize],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const fetcher = useCallback(async (): Promise<PaginatedResult<BlogPost>> => {
    return await fetchBlogPosts(pagination, { status });
  }, [pagination, status]);

  const { data, isLoading, error, refetch } = useAsyncQuery<PaginatedResult<BlogPost>>({
    fetcher,
    autoLoad,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const create = useCallback(
    async (
      input: Readonly<{
        title: string;
        slug: string;
        content: string;
        excerpt?: string;
        coverImage?: string | null;
        categoryId?: number;
        tags?: readonly string[];
        status?: BlogPostStatus;
      }>,
    ): Promise<BlogPostDetail | null> => {
      clearMutationError();
      try {
        return await createBlogPost(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create post';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  const update = useCallback(
    async (
      input: Readonly<
        Partial<{
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          coverImage: string | null;
          categoryId: number;
          tags: readonly string[];
          status: BlogPostStatus;
          isPinned: boolean;
        }> & { id: number }
      >,
    ): Promise<BlogPostDetail | null> => {
      clearMutationError();
      try {
        return await updateBlogPost(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update post';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  const loadById = useCallback(async (id: number): Promise<BlogPostDetail | null> => {
    clearMutationError();
    try {
      return await fetchBlogPostById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load post';
      setMutationError(message);
      return null;
    }
  }, [clearMutationError, setMutationError]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    clearMutationError();
    try {
      return await deleteBlogPost(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      setMutationError(message);
      return false;
    }
  }, [clearMutationError, setMutationError]);

  return {
    data,
    isLoading,
    isEmpty: isEmptyPage(data, isLoading, error),
    error,
    mutationError,
    refetch,
    loadById,
    create,
    update,
    remove,
  };
}
