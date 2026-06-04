// src/features/blog/infrastructure/mock/blog-tag.mock.ts

import type { BlogTag } from '@/entities/blog';

export const mockBlogTags: readonly BlogTag[] = [
  {
    id: 'tag-react',
    name: 'React',
    slug: 'react',
    postCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-frontend',
    name: '前端',
    slug: 'frontend',
    postCount: 3,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-typescript',
    name: 'TypeScript',
    slug: 'typescript',
    postCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-architecture',
    name: '架构',
    slug: 'architecture',
    postCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-graphql',
    name: 'GraphQL',
    slug: 'graphql',
    postCount: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-reading',
    name: '读书笔记',
    slug: 'reading',
    postCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];
