// src/features/blog/application/use-admin-profile.ts

import { useCallback } from 'react';

import type { BlogProfile } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogProfile, updateBlogProfile } from '../infrastructure/profile-api';

import { useMutationError } from './use-mutation-error';

type UseAdminProfileResult = {
  readonly data: BlogProfile | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly load: () => Promise<void>;
  readonly update: (
    input: Readonly<
      Partial<{
        nickname: string;
        avatarUrl: string | null;
        bio: string;
        socialLinks: Record<string, string>;
      }>
    >,
  ) => Promise<BlogProfile | null>;
};

export function useAdminProfile(): UseAdminProfileResult {
  const fetcher = useCallback(async (): Promise<BlogProfile> => {
    const result = await fetchBlogProfile();
    return result ?? {
      id: '',
      nickname: '',
      bio: null,
      avatarUrl: null,
      socialLinks: null,
      createdAt: '',
      updatedAt: '',
    };
  }, []);

  const { data, isLoading, error, refetch } = useAsyncQuery<BlogProfile>({
    fetcher,
    autoLoad: false,
  });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const update = useCallback(
    async (
      input: Readonly<
        Partial<{
          nickname: string;
          avatarUrl: string | null;
          bio: string;
          socialLinks: Record<string, string>;
        }>
      >,
    ): Promise<BlogProfile | null> => {
      clearMutationError();
      try {
        return await updateBlogProfile(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  return {
    data,
    isLoading,
    error,
    mutationError,
    load,
    update,
  };
}
