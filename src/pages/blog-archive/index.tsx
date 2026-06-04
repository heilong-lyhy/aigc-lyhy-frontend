// src/pages/blog-archive/index.tsx

import { useCallback, useMemo } from 'react';
import { Collapse, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import {
  BlogSidebar,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  useBlogCategories,
  useBlogPosts,
  useBlogTags,
} from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, groupByYearMonth } from '@/entities/blog';

import { PageHeader } from '@/shared/ui/page-header';

const PAGE_TITLE = '归档';
const PAGE_DESCRIPTION = '按日期归档浏览文章';
const DEFAULT_PAGINATION: PaginationInput = { offset: 0, limit: 100 };
const USE_MOCK_FALLBACK = true;

const { Text } = Typography;

export function BlogArchivePage() {
  const navigate = useNavigate();

  const {
    data: postsData,
    isLoading,
    error,
    refetch,
  } = useBlogPosts({
    pagination: DEFAULT_PAGINATION,
    status: 'published',
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: tags, isLoading: isLoadingTags } = useBlogTags({
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const handlePostClick = useCallback(
    (slug: string) => {
      navigate(`/blog/${slug}`);
    },
    [navigate],
  );

  const groups = useMemo(() => groupByYearMonth(postsData?.items ?? []), [postsData]);

  const isSidebarLoading = isLoadingCategories || isLoadingTags;

  return (
    <div className="page-stack">
      <PageHeader description={PAGE_DESCRIPTION} title={PAGE_TITLE} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <main>
          {isLoading && <LoadingSkeleton />}

          {error && <ErrorState error={error} onRetry={refetch} />}

          {!isLoading && !error && groups.length === 0 && (
            <EmptyState description="暂无归档文章" />
          )}

          {!isLoading && !error && groups.length > 0 && (
            <Collapse
              defaultActiveKey={groups.map((g) => g.year)}
              items={groups.map((group) => ({
                key: group.year,
                label: `${group.year} 年`,
                children: (
                  <div className="flex flex-col gap-4">
                    {group.months.map((monthGroup) => (
                      <div key={monthGroup.month}>
                        <div className="mb-2">
                          <Text strong>{monthGroup.month} 月</Text>
                        </div>
                        <ul className="list-none space-y-2 pl-0">
                          {monthGroup.posts.map((post) => (
                            <li key={post.id}>
                              <button
                                className="flex w-full items-start gap-3 rounded p-2 text-left transition-colors hover:bg-bg-container"
                                type="button"
                                onClick={() => handlePostClick(post.slug)}
                              >
                                <span className="shrink-0 text-sm">
                                  <Text type="secondary">
                                    {formatAbsoluteDate(post.publishedAt ?? post.createdAt)}
                                  </Text>
                                </span>
                                <span className="text-sm font-medium">{post.title}</span>
                                {post.isPinned && <Tag color="blue">置顶</Tag>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ),
              }))}
            />
          )}
        </main>

        {!isSidebarLoading && (
          <BlogSidebar categories={categories} tags={tags} />
        )}
      </div>
    </div>
  );
}
