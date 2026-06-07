// src/pages/blog-home/index.tsx

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  BlogSidebar,
  PostList,
  useBlogCategories,
  useBlogPosts,
  useBlogProfile,
  useBlogTags,
} from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';

import { PageHeader } from '@/shared/ui';

const PAGE_TITLE = '博客';
const PAGE_DESCRIPTION = '技术文章与生活随笔';
const DEFAULT_PAGINATION: PaginationInput = { offset: 0, limit: 6 };
const USE_MOCK_FALLBACK = false;

export function BlogHomePage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationInput>(DEFAULT_PAGINATION);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
    refetch: refetchPosts,
  } = useBlogPosts({
    pagination,
    status: 'published',
    categoryId: selectedCategoryId,
    tagId: selectedTagId,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: tags, isLoading: isLoadingTags } = useBlogTags({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: profile, isLoading: isLoadingProfile } = useBlogProfile({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const handlePaginationChange = useCallback((newPagination: PaginationInput) => {
    setPagination(newPagination);
  }, []);

  const handleCategorySelect = useCallback((categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
    setPagination(DEFAULT_PAGINATION);
  }, []);

  const handleTagSelect = useCallback((tagId: string | undefined) => {
    setSelectedTagId(tagId);
    setPagination(DEFAULT_PAGINATION);
  }, []);

  const handlePostClick = useCallback(
    (slug: string) => {
      navigate(`/blog/${slug}`);
    },
    [navigate],
  );

  const isSidebarLoading = isLoadingCategories || isLoadingTags || isLoadingProfile;

  const displayPosts = postsData?.items ?? [];
  const displayTotal = postsData?.total ?? 0;
  const displayHasMore = postsData?.hasMore ?? false;

  return (
    <div className="page-stack">
      <PageHeader description={PAGE_DESCRIPTION} title={PAGE_TITLE} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <main>
          <PostList
            categories={categories}
            error={postsError}
            hasMore={displayHasMore}
            isLoading={isLoadingPosts}
            pagination={pagination}
            posts={displayPosts}
            tags={tags}
            total={displayTotal}
            onPaginationChange={handlePaginationChange}
            onPostClick={handlePostClick}
            onRetry={refetchPosts}
          />
        </main>

        {!isSidebarLoading && (
          <BlogSidebar
            categories={categories}
            profile={profile}
            selectedCategoryId={selectedCategoryId}
            selectedTagId={selectedTagId}
            tags={tags}
            onCategorySelect={handleCategorySelect}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>
    </div>
  );
}
