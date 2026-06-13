// src/features/blog/application/use-admin-friend-links.ts

import { useCallback } from 'react';

import type { BlogFriendLink } from '@/entities/blog';

import { useMutationError } from '@/shared/hooks';

import {
  createBlogFriendLink,
  deleteBlogFriendLink,
  updateBlogFriendLink,
} from '../infrastructure';

import { useBlogFriendLinks } from './use-blog-friend-links';

type CreateFriendLinkInput = Readonly<{
  name: string;
  url: string;
  description?: string;
  logoUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}>;

type UpdateFriendLinkInput = Readonly<{
  id: number;
  name?: string;
  url?: string;
  description?: string;
  logoUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}>;

type UseAdminFriendLinksOptions = {
  readonly autoLoad?: boolean;
};

type UseAdminFriendLinksResult = {
  readonly data: readonly BlogFriendLink[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly refetch: () => Promise<void>;
  readonly create: (input: CreateFriendLinkInput) => Promise<BlogFriendLink | null>;
  readonly update: (input: UpdateFriendLinkInput) => Promise<BlogFriendLink | null>;
  readonly remove: (id: number) => Promise<boolean>;
};

export function useAdminFriendLinks(
  options: UseAdminFriendLinksOptions = {},
): UseAdminFriendLinksResult {
  const { autoLoad = true } = options;

  const { data, isLoading, isEmpty, error, refetch } = useBlogFriendLinks({ autoLoad });

  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const create = useCallback(
    async (input: CreateFriendLinkInput): Promise<BlogFriendLink | null> => {
      clearMutationError();
      try {
        const result = await createBlogFriendLink(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create friend link';
        setMutationError(message);
        return null;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  const update = useCallback(
    async (input: UpdateFriendLinkInput): Promise<BlogFriendLink | null> => {
      clearMutationError();
      try {
        const result = await updateBlogFriendLink(input);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update friend link';
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
        const result = await deleteBlogFriendLink(id);
        await refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete friend link';
        setMutationError(message);
        return false;
      }
    },
    [clearMutationError, setMutationError, refetch],
  );

  return {
    data,
    isLoading,
    isEmpty,
    error,
    mutationError,
    refetch,
    create,
    update,
    remove,
  };
}
