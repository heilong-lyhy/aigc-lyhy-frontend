// src/features/blog/ui/post-navigation.tsx

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router';

import type { PostNavigationItem } from '@/entities/blog';

type PostNavigationProps = {
  readonly prevPost?: PostNavigationItem;
  readonly nextPost?: PostNavigationItem;
};

const LABEL_PREV = '上一篇';
const LABEL_NEXT = '下一篇';
const BLOG_POST_PATH = '/blog';

export function PostNavigation({ prevPost, nextPost }: PostNavigationProps) {
  if (!prevPost && !nextPost) {
    return null;
  }

  return (
    <nav className="grid gap-4 sm:grid-cols-2">
      {prevPost ? (
        <Link
          className="flex items-center gap-2 rounded-block border border-border p-4 transition-colors hover:bg-fill-secondary"
          to={`${BLOG_POST_PATH}/${prevPost.slug}`}
        >
          <LeftOutlined />
          <div className="min-w-0 flex-1">
            <div className="text-text-secondary text-xs">{LABEL_PREV}</div>
            <div className="truncate">{prevPost.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {nextPost ? (
        <Link
          className="flex items-center justify-end gap-2 rounded-block border border-border p-4 text-right transition-colors hover:bg-fill-secondary"
          to={`${BLOG_POST_PATH}/${nextPost.slug}`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-text-secondary text-xs">{LABEL_NEXT}</div>
            <div className="truncate">{nextPost.title}</div>
          </div>
          <RightOutlined />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
