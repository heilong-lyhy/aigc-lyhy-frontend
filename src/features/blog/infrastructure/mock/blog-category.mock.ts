// src/features/blog/infrastructure/mock/blog-category.mock.ts

import type { BlogCategory } from '@/entities/blog';

export const mockBlogCategories: readonly BlogCategory[] = [
  {
    id: 'cat-tech',
    name: '技术',
    slug: 'tech',
    description: '技术文章与编程实践',
    parentId: null,
    sortOrder: 1,
    postCount: 3,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-life',
    name: '生活',
    slug: 'life',
    description: '生活感悟与随笔',
    parentId: null,
    sortOrder: 2,
    postCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-reading',
    name: '读书',
    slug: 'reading',
    description: '读书笔记与书评',
    parentId: null,
    sortOrder: 3,
    postCount: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];
