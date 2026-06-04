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

const { Text } = Typography;

export function PostCard({ post, categories, tags, onClick }: PostCardProps) {
  const postTags = tags?.filter((t) => post.tags.includes(t.id));
  const category = categories?.find((c) => c.id === post.categoryId);

  return (
    <Card
      cover={
        post.coverImage ? (
          <img
            alt={post.title}
            src={post.coverImage}
            style={{ aspectRatio: '2 / 1', objectFit: 'cover' }}
          />
        ) : undefined
      }
      hoverable
      role="article"
      onClick={onClick ? () => onClick(post.slug) : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
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
              <span>{post.viewCount} 阅读</span>
            </div>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            {post.isPinned && <Tag color="blue">置顶</Tag>}
            <span>{post.title}</span>
          </div>
        }
      />
    </Card>
  );
}
