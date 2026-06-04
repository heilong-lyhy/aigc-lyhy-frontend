// src/features/blog/ui/post-detail-header.tsx

import { Tag, Typography } from 'antd';

import type { BlogCategory, BlogPost, BlogTag } from '@/entities/blog';
import { formatRelativeDate } from '@/entities/blog';

type PostDetailHeaderProps = {
  readonly post: BlogPost;
  readonly categories?: readonly BlogCategory[];
  readonly tags?: readonly BlogTag[];
};

const { Title, Text } = Typography;

const LABEL_VIEWS = '阅读';
const LABEL_LIKES = '赞';
const LABEL_COMMENTS = '评论';
const LABEL_PINNED = '置顶';

export function PostDetailHeader({ post, categories, tags }: PostDetailHeaderProps) {
  const category = categories?.find((c) => c.id === post.categoryId);
  const postTags = tags?.filter((t) => post.tags.includes(t.id));

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {post.isPinned && <Tag color="blue">{LABEL_PINNED}</Tag>}
        <Title level={2} style={{ margin: 0 }}>
          {post.title}
        </Title>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-text-tertiary">
        {category && <Tag>{category.name}</Tag>}
        {postTags?.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-text-tertiary">
        {post.publishedAt && (
          <time dateTime={post.publishedAt}>{formatRelativeDate(post.publishedAt)}</time>
        )}
        <span>
          {post.viewCount} {LABEL_VIEWS}
        </span>
        <span>
          {post.likeCount} {LABEL_LIKES}
        </span>
        <span>
          {post.commentCount} {LABEL_COMMENTS}
        </span>
      </div>

      {post.excerpt && (
        <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.7 }}>
          {post.excerpt}
        </Text>
      )}
    </header>
  );
}
