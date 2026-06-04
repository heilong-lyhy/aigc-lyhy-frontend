// src/pages/blog-post/index.tsx

import { useCallback, useState } from 'react';
import { Typography } from 'antd';
import { useParams } from 'react-router';

import type { TocItem } from '@/features/blog';
import {
  ErrorState,
  LoadingSkeleton,
  MarkdownRenderer,
  PostDetailFooter,
  PostDetailHeader,
  PostDetailToc,
  PostErrorBoundary,
  useBlogCategories,
  useBlogComments,
  useBlogPostDetail,
  useBlogTags,
  useLike,
} from '@/features/blog';
import { Error404 } from '@/features/error-feedback';

import type { PaginationInput } from '@/entities/blog';
import { formatRelativeDate } from '@/entities/blog';

const COMMENTS_PAGINATION: PaginationInput = { offset: 0, limit: 20 };
const LABEL_COMMENTS_TITLE = '评论';
const LABEL_NO_COMMENTS = '暂无评论';

const { Title } = Typography;

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tocItems, setTocItems] = useState<readonly TocItem[]>([]);

  const {
    data: post,
    isLoading,
    error: postError,
    refetch,
  } = useBlogPostDetail(slug ?? null);

  const { data: categories } = useBlogCategories({ useMockFallback: true });
  const { data: tags } = useBlogTags({ useMockFallback: true });

  const likeHook = useLike({
    targetType: 'post',
    targetId: post?.id ?? '',
    autoCheck: !!post?.id,
  });

  const { data: commentsData } = useBlogComments({
    postId: post?.id ?? '',
    pagination: COMMENTS_PAGINATION,
    status: 'approved',
    autoLoad: !!post?.id,
  });

  const handleTocReady = useCallback((items: readonly TocItem[]) => {
    setTocItems(items);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (postError) {
    return <ErrorState error={postError} onRetry={refetch} />;
  }

  if (!post) {
    return <Error404 />;
  }

  const comments = commentsData?.items ?? [];

  return (
    <div className="page-stack">
      <PostErrorBoundary>
        <PostDetailHeader categories={categories} post={post} tags={tags} />

        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          <main className="flex flex-col gap-8">
            <MarkdownRenderer content={post.content} onTocReady={handleTocReady} />

            <PostDetailFooter
              liked={likeHook.liked}
              likeCount={post.likeCount}
              onToggleLike={likeHook.toggle}
            />

            <section aria-label={LABEL_COMMENTS_TITLE}>
              <Title level={3}>{LABEL_COMMENTS_TITLE}</Title>
              {comments.length === 0 ? (
                <p className="text-text-tertiary">{LABEL_NO_COMMENTS}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="surface-panel">
                      <div className="flex items-center gap-2">
                        <strong>{comment.authorName}</strong>
                        <time className="text-text-tertiary" dateTime={comment.createdAt}>
                          {formatRelativeDate(comment.createdAt)}
                        </time>
                      </div>
                      <p style={{ margin: '8px 0 0' }}>{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="hidden lg:block">
            <div style={{ position: 'sticky', top: 80 }}>
              <PostDetailToc items={tocItems} />
            </div>
          </aside>
        </div>
      </PostErrorBoundary>
    </div>
  );
}
