// src/features/blog/ui/blog-sidebar.tsx

import { Avatar, Card, Typography } from 'antd';

import type { BlogCategory, BlogProfile, BlogTag } from '@/entities/blog';

import { CategorySidebar } from './category-sidebar';
import { TagCloud } from './tag-cloud';

type BlogSidebarProps = {
  readonly profile?: BlogProfile | null;
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly selectedCategoryId?: string;
  readonly selectedTagId?: string;
  readonly onCategorySelect?: (categoryId: string | undefined) => void;
  readonly onTagSelect?: (tagId: string | undefined) => void;
};

const { Text, Title } = Typography;
const SIDEBAR_TITLE = '博客导航';
const CATEGORIES_LABEL = '分类';
const TAGS_LABEL = '标签';

export function BlogSidebar({
  profile,
  categories,
  tags,
  selectedCategoryId,
  selectedTagId,
  onCategorySelect,
  onTagSelect,
}: BlogSidebarProps) {
  return (
    <aside className="flex flex-col gap-4" aria-label={SIDEBAR_TITLE}>
      {profile && (
        <Card>
          <div className="flex flex-col items-center gap-3">
            <Avatar size={64} src={profile.avatarUrl}>
              {profile.nickname.charAt(0) || 'U'}
            </Avatar>
            <div className="blog-typography-no-margin">
              <Title level={5}>
                {profile.nickname}
              </Title>
            </div>
            <Text type="secondary">{profile.bio}</Text>
          </div>
        </Card>
      )}

      <Card title={CATEGORIES_LABEL}>
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={onCategorySelect}
        />
      </Card>

      <Card title={TAGS_LABEL}>
        <TagCloud selectedTagId={selectedTagId} tags={tags} onSelect={onTagSelect} />
      </Card>
    </aside>
  );
}
