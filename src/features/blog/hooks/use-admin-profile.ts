// src/features/blog/hooks/use-admin-profile.ts

import { useCallback, useReducer } from 'react';

import type { BlogProfile, BlogSocialLink } from '@/entities/blog';

import { fetchBlogProfile, updateBlogProfile } from '../infrastructure/profile-api';
import { useAsyncQuery } from '../lib/use-async-query';

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
        avatar: string | null;
        bio: string;
        socialLinks: readonly BlogSocialLink[];
      }>
    >,
  ) => Promise<BlogProfile | null>;
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

export function useAdminProfile(): UseAdminProfileResult {
  const fetcher = useCallback(async (): Promise<BlogProfile> => {
    return await fetchBlogProfile();
  }, []);

  const { data, isLoading, error, refetch } = useAsyncQuery<BlogProfile>({
    fetcher,
    autoLoad: false,
  });

  const [mutationState, dispatchMutation] = useReducer(mutationErrorReducer, {
    mutationError: null,
  });

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const update = useCallback(
    async (
      input: Readonly<
        Partial<{
          nickname: string;
          avatar: string | null;
          bio: string;
          socialLinks: readonly BlogSocialLink[];
        }>
      >,
    ): Promise<BlogProfile | null> => {
      dispatchMutation({ type: 'CLEAR_MUTATION_ERROR' });
      try {
        return await updateBlogProfile(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        dispatchMutation({ type: 'MUTATION_ERROR', payload: message });
        return null;
      }
    },
    [],
  );

  return {
    data,
    isLoading,
    error,
    mutationError: mutationState.mutationError,
    load,
    update,
  };
}
