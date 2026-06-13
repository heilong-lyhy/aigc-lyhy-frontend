// src/pages/blog-post/index.tsx

import { useCallback, useState } from 'react';
import { useParams } from 'react-router';

import { useAuth } from '@/features/auth';
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
  PostNavigation,
  ReplyForm,
  useBlogCategories,
  useBlogComments,
  useBlogPostDetail,
  useBlogTags,
  useLike,
} from '@/features/blog';
import { Error404 } from '@/features/error-feedback';

import type { BlogComment, PaginationInput } from '@/entities/blog';

const COMMENTS_PAGINATION: PaginationInput = { page: 1, pageSize: 20 };

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [tocItems, setTocItems] = useState<readonly TocItem[]>([]);
  const [replyTarget, setReplyTarget] = useState<BlogComment | null>(null);

  const {
    data: post,
    isLoading,
    error: postError,
    refetch,
  } = useBlogPostDetail(slug ?? null);

  const { data: categories } = useBlogCategories();
  const { data: tags } = useBlogTags();

  const likeHook = useLike({
    postId: post?.id ? Number(post.id) : 0,
    userIdentifier: 'anonymous',
    autoCheck: !!post?.id,
  });

  const { data: commentsData, refetch: refetchComments } = useBlogComments({
    postId: post?.id ? Number(post.id) : 0,
    pagination: COMMENTS_PAGINATION,
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

            <PostNavigation nextPost={post.nextPost} prevPost={post.prevPost} />

            <CommentList comments={comments} onReply={handleReply} />

            {replyTarget && (
              <ReplyForm
                isAuthenticated={isAuthenticated}
                onCancel={handleReplyCancel}
                onSuccess={handleReplySuccess}
                parentComment={replyTarget}
                postId={post.id}
              />
            )}

            <CommentForm isAuthenticated={isAuthenticated} onSuccess={handleCommentSuccess} postId={post.id} />
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
