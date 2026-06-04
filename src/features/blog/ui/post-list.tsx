// src/features/blog/ui/post-list.tsx

import type { BlogCategory, BlogPost, BlogTag, PaginationInput } from '@/entities/blog';

import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';
import { Pagination } from './pagination';
import { PostCard } from './post-card';

type PostListProps = {
  readonly posts: readonly BlogPost[];
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly pagination: PaginationInput;
  readonly total: number;
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onPostClick?: (slug: string) => void;
  readonly onRetry?: () => void;
};

export function PostList({
  posts,
  categories,
  tags,
  pagination,
  total,
  hasMore,
  isLoading,
  error,
  onPaginationChange,
  onPostClick,
  onRetry,
}: PostListProps) {
  if (isLoading && posts.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card-grid" role="list" aria-label="article-list">
        {posts.map((post) => (
          <PostCard
            categories={categories}
            key={post.id}
            post={post}
            tags={tags}
            onClick={onPostClick}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <Pagination
          hasMore={hasMore}
          pagination={pagination}
          total={total}
          onChange={onPaginationChange}
        />
      </div>
    </div>
  );
}
