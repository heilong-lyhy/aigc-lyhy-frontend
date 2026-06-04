// src/features/blog/ui/search-bar.tsx

import { Input, Tag } from 'antd';

import type { BlogCategory, BlogTag } from '@/entities/blog';

import { CategorySidebar } from './category-sidebar';
import { TagCloud } from './tag-cloud';

type SearchBarProps = {
  readonly keyword: string;
  readonly selectedCategoryId?: string;
  readonly selectedTagId?: string;
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly searchHistory: readonly string[];
  readonly onKeywordChange: (keyword: string) => void;
  readonly onCategorySelect?: (categoryId: string | undefined) => void;
  readonly onTagSelect?: (tagId: string | undefined) => void;
  readonly onHistoryClick?: (keyword: string) => void;
  readonly onClearHistory?: () => void;
};

const SEARCH_PLACEHOLDER = '搜索文章...';
const HISTORY_LABEL = '搜索历史';
const CLEAR_HISTORY_LABEL = '清空';

export function SearchBar({
  keyword,
  selectedCategoryId,
  selectedTagId,
  categories,
  tags,
  searchHistory,
  onKeywordChange,
  onCategorySelect,
  onTagSelect,
  onHistoryClick,
  onClearHistory,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input.Search
        allowClear
        enterButton
        placeholder={SEARCH_PLACEHOLDER}
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        onSearch={(value) => onKeywordChange(value)}
      />

      {searchHistory.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">{HISTORY_LABEL}</span>
          {searchHistory.slice(0, 8).map((item) => (
            <div key={item} className="inline-block cursor-pointer">
              <Tag onClick={() => onHistoryClick?.(item)}>
                {item}
              </Tag>
            </div>
          ))}
          <div className="inline-block cursor-pointer">
            <Tag
              color="red"
              onClick={() => onClearHistory?.()}
            >
              {CLEAR_HISTORY_LABEL}
            </Tag>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={onCategorySelect}
        />
        <TagCloud
          selectedTagId={selectedTagId}
          tags={tags}
          onSelect={onTagSelect}
        />
      </div>
    </div>
  );
}
