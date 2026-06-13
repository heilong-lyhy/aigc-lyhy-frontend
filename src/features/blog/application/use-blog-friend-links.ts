// src/features/blog/application/use-blog-friend-links.ts

import { useCallback } from 'react';

import type { BlogFriendLink } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogFriendLinks } from '../infrastructure';

type UseBlogFriendLinksOptions = {
  readonly autoLoad?: boolean;
};

type UseBlogFriendLinksResult = {
  readonly data: readonly BlogFriendLink[];
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

const EMPTY_LINKS: readonly BlogFriendLink[] = [];

export function useBlogFriendLinks(
  options: UseBlogFriendLinksOptions = {},
): UseBlogFriendLinksResult {
  const { autoLoad = true } = options;

  const fetcher = useCallback(async (): Promise<readonly BlogFriendLink[]> => {
    return await fetchBlogFriendLinks();
  }, []);

  const { data, isLoading, error, refetch } = useAsyncQuery<readonly BlogFriendLink[]>({
    fetcher,
    autoLoad,
  });

  const links = data ?? EMPTY_LINKS;

  return {
    data: links,
    isLoading,
    isEmpty: links.length === 0 && !isLoading && !error,
    error,
    refetch,
  };
}
