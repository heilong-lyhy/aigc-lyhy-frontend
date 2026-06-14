// src/features/blog/ui/post-card.tsx

import { Card, Tag, Typography } from 'antd';

import type { BlogCategory, BlogPost, BlogTag } from '@/entities/blog';
import { formatRelativeDate } from '@/entities/blog';

type PostCardProps = {
  readonly post: BlogPost;
  readonly categories?: readonly BlogCategory[];
  readonly tags?: readonly BlogTag[];
  readonly onClick?: (slug: string) => void;
};

const LABEL_VIEWS = '阅读';
const LABEL_PINNED = '置顶';

const { Text } = Typography;

export function PostCard({ post, categories, tags, onClick }: PostCardProps) {
  const postTags = tags?.filter((t) => post.tagIds.includes(t.id));
  const category = categories?.find((c) => Number(c.id) === post.categoryId);

  const card = (
    <Card
      cover={
        post.coverImage ? (
          <img
            alt={post.title}
            className="aspect-[2/1] object-cover"
            src={post.coverImage}
          />
        ) : undefined
      }
      hoverable
      role="article"
      variant={post.isPinned ? 'borderless' : undefined}
      onClick={onClick ? () => onClick(post.slug) : undefined}
    >
      <Card.Meta
        description={
          <div className="flex flex-col gap-2">
            <Text type="secondary" ellipsis>
              {post.excerpt}
            </Text>
            <div className="flex flex-wrap gap-1">
              {postTags?.map((tag) => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
            </div>
            <div className="flex items-center gap-3 text-text-tertiary">
              {category && <span>{category.name}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatRelativeDate(post.publishedAt)}</time>
              )}
              <span>{post.viewCount} {LABEL_VIEWS}</span>
            </div>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            {post.isPinned && <Tag color="blue">{LABEL_PINNED}</Tag>}
            <span>{post.title}</span>
          </div>
        }
      />
    </Card>
  );

  if (post.isPinned) {
    return <div className="rounded-lg border-2 border-primary">{card}</div>;
  }

  return card;
}
