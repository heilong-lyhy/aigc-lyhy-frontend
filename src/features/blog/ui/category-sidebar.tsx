// src/features/blog/ui/category-sidebar.tsx

import { Menu } from 'antd';

import type { BlogCategory } from '@/entities/blog';

type CategorySidebarProps = {
  readonly categories: readonly BlogCategory[];
  readonly selectedCategoryId?: string;
  readonly onSelect?: (categoryId: string | undefined) => void;
};

const ALL_CATEGORIES_KEY = '__all__';
const ALL_LABEL = '全部分类';

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelect,
}: CategorySidebarProps) {
  const selectedKey = selectedCategoryId ?? ALL_CATEGORIES_KEY;

  function handleSelect(key: string) {
    onSelect?.(key === ALL_CATEGORIES_KEY ? undefined : key);
  }

  const items = [
    { key: ALL_CATEGORIES_KEY, label: ALL_LABEL },
    ...categories.map((cat) => ({
      key: cat.id,
      label: `${cat.name} (${cat.postCount})`,
    })),
  ];

  return (
    <nav aria-label="category-navigation">
      <Menu
        items={items}
        mode="inline"
        selectedKeys={[selectedKey]}
        onSelect={({ key }) => handleSelect(key)}
      />
    </nav>
  );
}
