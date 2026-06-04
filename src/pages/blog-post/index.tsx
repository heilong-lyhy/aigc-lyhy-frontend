// src/pages/blog-post/index.tsx

import { useCallback, useState } from 'react';
import { useParams } from 'react-router';

import type { TocItem } from '@/features/blog';
import {
  CommentForm,
  CommentList,
  ErrorState,
  LoadingSkeleton,
  MarkdownRenderer,
  PostDetailFooter,
  PostDetailHeader,
  PostDetailToc,
  PostErrorBoundary,
  ReplyForm,
  useBlogCategories,
  useBlogComments,
  useBlogPostDetail,
  useBlogTags,
  useLike,
} from '@/features/blog';
import { Error404 } from '@/features/error-feedback';

import type { BlogComment, PaginationInput } from '@/entities/blog';

const COMMENTS_PAGINATION: PaginationInput = { offset: 0, limit: 20 };

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tocItems, setTocItems] = useState<readonly TocItem[]>([]);
  const [replyTarget, setReplyTarget] = useState<BlogComment | null>(null);

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

  const { data: commentsData, refetch: refetchComments } = useBlogComments({
    postId: post?.id ?? '',
    pagination: COMMENTS_PAGINATION,
    status: 'approved',
    autoLoad: !!post?.id,
  });

  const handleTocReady = useCallback((items: readonly TocItem[]) => {
    setTocItems(items);
  }, []);

  const handleCommentSuccess = useCallback(() => {
    void refetchComments();
  }, [refetchComments]);

  const handleReply = useCallback((comment: BlogComment) => {
    setReplyTarget(comment);
  }, []);

  const handleReplyCancel = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleReplySuccess = useCallback(() => {
    setReplyTarget(null);
    void refetchComments();
  }, [refetchComments]);

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

            <CommentList comments={comments} onReply={handleReply} />

            {replyTarget && (
              <ReplyForm
                onCancel={handleReplyCancel}
                onSuccess={handleReplySuccess}
                parentComment={replyTarget}
                postId={post.id}
              />
            )}

            <CommentForm onSuccess={handleCommentSuccess} postId={post.id} />
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <PostDetailToc items={tocItems} />
            </div>
          </aside>
        </div>
      </PostErrorBoundary>
    </div>
  );
}
