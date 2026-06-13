// src/features/blog/ui/blog-sidebar.tsx

import { useCallback } from 'react';
import { Avatar, Card, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router';

import type { BlogCategory, BlogProfile, BlogTag } from '@/entities/blog';

import { BLOG_NAV_ITEMS } from './blog-nav-items';
import { CategorySidebar } from './category-sidebar';
import { TagCloud } from './tag-cloud';

const { Search } = Input;

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
const SEARCH_LABEL = '搜索';
const CATEGORIES_LABEL = '分类';
const TAGS_LABEL = '标签';
const QUICK_LINKS_LABEL = '快捷导航';

/** 侧边栏快捷链接项（排除"文章"，因为首页本身就是文章列表） */
const QUICK_LINK_ITEMS = BLOG_NAV_ITEMS.filter((item) => item.path !== '/blog');

export function BlogSidebar({
  profile,
  categories,
  tags,
  selectedCategoryId,
  selectedTagId,
  onCategorySelect,
  onTagSelect,
}: BlogSidebarProps) {
  const navigate = useNavigate();

  const handleSearch = useCallback((value: string) => {
    const q = value.trim();
    if (q) {
      navigate(`/blog/search?q=${encodeURIComponent(q)}`);
    }
  }, [navigate]);

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

      <Card title={SEARCH_LABEL}>
        <Search
          allowClear
          enterButton
          placeholder={SEARCH_LABEL}
          onSearch={handleSearch}
        />
      </Card>

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

      <Card title={QUICK_LINKS_LABEL}>
        <div className="flex flex-col gap-2">
          {QUICK_LINK_ITEMS.map((item) => (
            <Link className="text-text-secondary hover:text-text-primary" key={item.path} to={item.path}>
              {item.label}
            </Link>
          ))}
        </div>
      </Card>
    </aside>
  );
}
