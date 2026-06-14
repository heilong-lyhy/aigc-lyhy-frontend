// src/pages/blog-archive/index.tsx

import { useCallback, useMemo } from 'react';
import { Collapse, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';

import { BlogSidebar } from '@/widgets/blog-shell';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  useBlogCategories,
  useBlogPosts,
  useBlogTags,
} from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, groupByYearMonth } from '@/entities/blog';

import { PageHeader } from '@/shared/ui';

const PAGE_TITLE = '归档';
const PAGE_DESCRIPTION = '按日期归档浏览文章';
const LABEL_NO_ARCHIVES = '暂无归档文章';
const LABEL_YEAR_SUFFIX = ' 年';
const LABEL_MONTH_SUFFIX = ' 月';
const LABEL_PINNED = '置顶';
const DEFAULT_PAGINATION: PaginationInput = { page: 1, pageSize: 100 };

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
  });

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories();

  const { data: tags, isLoading: isLoadingTags } = useBlogTags();

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
            <EmptyState description={LABEL_NO_ARCHIVES} />
          )}

          {!isLoading && !error && groups.length > 0 && (
            <Collapse
              defaultActiveKey={groups.map((g) => g.year)}
              items={groups.map((group) => ({
                key: group.year,
                label: `${group.year}${LABEL_YEAR_SUFFIX}`,
                children: (
                  <div className="flex flex-col gap-4">
                    {group.months.map((monthGroup) => (
                      <div key={monthGroup.month}>
                        <div className="mb-2">
                          <Text strong>{monthGroup.month}{LABEL_MONTH_SUFFIX}</Text>
                        </div>
                        <ul className="list-none space-y-2 pl-0">
                          {monthGroup.posts.map((post) => (
                            <li key={post.id}>
                              <button
                                className={`flex w-full items-start gap-3 rounded p-2 text-left transition-colors hover:bg-bg-container ${post.isPinned ? 'border-l-4 border-primary pl-3' : 'pl-4'}`}
                                type="button"
                                onClick={() => handlePostClick(post.slug)}
                              >
                                <span className="shrink-0 text-sm">
                                  <Text type="secondary">
                                    {formatAbsoluteDate(post.publishedAt ?? post.createdAt)}
                                  </Text>
                                </span>
                                <span className={`text-sm ${post.isPinned ? 'font-bold' : 'font-medium'}`}>{post.title}</span>
                                {post.isPinned && <Tag color="blue">{LABEL_PINNED}</Tag>}
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
