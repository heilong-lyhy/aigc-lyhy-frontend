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
const DEFAULT_PAGINATION: PaginationInput = { page: 1, pageSize: 6 };

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
  });

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories();

  const { data: tags, isLoading: isLoadingTags } = useBlogTags();

  const { data: profile, isLoading: isLoadingProfile } = useBlogProfile({
    autoLoad: true,
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

  return (
    <div className="page-stack">
      <PageHeader description={PAGE_DESCRIPTION} title={PAGE_TITLE} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <main>
          <PostList
            categories={categories}
            error={postsError}
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
