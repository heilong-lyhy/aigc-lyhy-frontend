// src/features/blog/hooks/use-blog-post-detail.ts

import { useCallback } from 'react';

import type { BlogPost } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks/use-async-query';

import { fetchBlogPostBySlug } from '../infrastructure/posts-api';

type UseBlogPostDetailResult = {
  readonly data: BlogPost | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useBlogPostDetail(slug: string | null): UseBlogPostDetailResult {
  const fetcher = useCallback(async (): Promise<BlogPost> => {
    if (!slug) throw new Error('Slug is required');
    return await fetchBlogPostBySlug(slug);
  }, [slug]);

  const { data, isLoading, error, refetch } = useAsyncQuery<BlogPost>({
    fetcher,
    autoLoad: slug !== null,
  });

  return {
    data,
    isLoading,
    isEmpty: data === null && !isLoading && !error,
    error,
    refetch,
  };
}
