// src/pages/blog-search/index.tsx

import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import {
  BlogSidebar,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PostCard,
  SearchBar,
  useBlogCategories,
  useBlogSearch,
  useBlogTags,
} from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';

import { PageHeader } from '@/shared/ui';

const PAGE_TITLE = '搜索';
const LABEL_NO_RESULTS = '未找到匹配的文章';
const DEFAULT_PAGINATION: PaginationInput = { offset: 0, limit: 6 };
const USE_MOCK_FALLBACK = false;

export function BlogSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialKeyword = searchParams.get('q') ?? '';

  const {
    data: searchData,
    isLoading,
    isEmpty,
    error,
    filters,
    searchHistory,
    setFilters,
    resetSearchSession,
    refetch,
  } = useBlogSearch({ pagination: DEFAULT_PAGINATION });

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: tags, isLoading: isLoadingTags } = useBlogTags({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const handleKeywordChange = useCallback(
    (keyword: string) => {
      setFilters({ keyword });
    },
    [setFilters],
  );

  const handleCategorySelect = useCallback(
    (categoryId: string | undefined) => {
      setFilters({ categoryId });
    },
    [setFilters],
  );

  const handleTagSelect = useCallback(
    (tagId: string | undefined) => {
      setFilters({ tagId });
    },
    [setFilters],
  );

  const handleHistoryClick = useCallback(
    (keyword: string) => {
      setFilters({ keyword });
    },
    [setFilters],
  );

  const handleClearHistory = useCallback(() => {
    resetSearchSession();
  }, [resetSearchSession]);

  const handlePostClick = useCallback(
    (slug: string) => {
      navigate(`/blog/${slug}`);
    },
    [navigate],
  );

  // Sync initial keyword from URL on mount
  useEffect(() => {
    if (initialKeyword && filters.keyword === '') {
      setFilters({ keyword: initialKeyword });
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posts = searchData?.items ?? [];
  const isSidebarLoading = isLoadingCategories || isLoadingTags;

  return (
    <div className="page-stack">
      <PageHeader title={PAGE_TITLE} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <main className="flex flex-col gap-6">
          <SearchBar
            categories={categories}
            keyword={filters.keyword}
            searchHistory={searchHistory}
            selectedCategoryId={filters.categoryId}
            selectedTagId={filters.tagId}
            tags={tags}
            onCategorySelect={handleCategorySelect}
            onClearHistory={handleClearHistory}
            onHistoryClick={handleHistoryClick}
            onKeywordChange={handleKeywordChange}
            onTagSelect={handleTagSelect}
          />

          {isLoading && <LoadingSkeleton />}

          {error && <ErrorState error={error} onRetry={refetch} />}

          {!isLoading && !error && isEmpty && (
            <EmptyState description={LABEL_NO_RESULTS} />
          )}

          {!isLoading && !error && posts.length > 0 && (
            <div className="card-grid" role="list" aria-label="search-results">
              {posts.map((post) => (
                <PostCard
                  categories={categories}
                  key={post.id}
                  post={post}
                  tags={tags}
                  onClick={handlePostClick}
                />
              ))}
            </div>
          )}
        </main>

        {!isSidebarLoading && (
          <BlogSidebar
            categories={categories}
            selectedCategoryId={filters.categoryId}
            selectedTagId={filters.tagId}
            tags={tags}
            onCategorySelect={handleCategorySelect}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>
    </div>
  );
}
