// src/features/blog/application/use-admin-tags.ts

import { useCallback } from 'react';

import type { BlogTag } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { createBlogTag, deleteBlogTag, fetchBlogTags, updateBlogTag } from '../infrastructure/tags-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseAdminTagsOptions = {
  readonly autoLoad?: boolean;
};

type UseAdminTagsResult = {
  readonly data: readonly BlogTag[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly create: (input: Readonly<{ name: string; slug: string }>) => Promise<BlogTag | null>;
  readonly update: (input: Readonly<{ id: number; name: string; slug: string }>) => Promise<BlogTag | null>;
  readonly remove: (id: number) => Promise<boolean>;
};

const EMPTY_TAGS: readonly BlogTag[] = [];

export function useAdminTags(options: UseAdminTagsOptions = {}): UseAdminTagsResult {
  const { autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<readonly BlogTag[]> => {
    return await fetchBlogTags();
  }, []);

  const { data, isLoading, error, refetch } = useAsyncQuery<readonly BlogTag[]>({
    fetcher,
    autoLoad,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const tags = data ?? EMPTY_TAGS;

  const create = useCallback(
    async (input: Readonly<{ name: string; slug: string }>): Promise<BlogTag | null> => {
      clearMutationError();
      try {
        const result = await createBlogTag(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tag';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const update = useCallback(
    async (input: Readonly<{ id: number; name: string; slug: string }>): Promise<BlogTag | null> => {
      clearMutationError();
      try {
        const result = await updateBlogTag(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tag';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const remove = useCallback(async (id: number): Promise<boolean> => {
    clearMutationError();
    try {
      const result = await deleteBlogTag(id);
      await refetch();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag';
      setMutationError(message);
      return false;
    }
  }, [clearMutationError, setMutationError, refetch]);

  return {
    data: tags,
    isLoading,
    isEmpty: tags.length === 0 && !isLoading && !error,
    error,
    mutationError,
    refetch,
    create,
    update,
    remove,
  };
}
