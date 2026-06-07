// src/entities/blog/group-by-date.spec.ts

import { describe, expect, it } from 'vitest';

import { formatAbsoluteDate, groupByYearMonth } from './group-by-date';
import type { BlogPost } from './types';

function makePost(overrides: Partial<BlogPost> & { id: string }): BlogPost {
  return {
    title: 'Test',
    slug: 'test',
    excerpt: '',
    content: '',
    coverImage: null,
    categoryId: 'cat-1',
    tags: [],
    authorId: 'author-1',
    status: 'published',
    isPinned: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    publishedAt: null,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('groupByYearMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupByYearMonth([])).toEqual([]);
  });

  it('groups posts by year and month', () => {
    const posts = [
      makePost({ id: '1', publishedAt: '2024-01-15T00:00:00Z' }),
      makePost({ id: '2', publishedAt: '2024-01-20T00:00:00Z' }),
      makePost({ id: '3', publishedAt: '2024-03-10T00:00:00Z' }),
    ];

    const groups = groupByYearMonth(posts);

    expect(groups).toHaveLength(1);
    expect(groups[0].year).toBe('2024');
    expect(groups[0].months).toHaveLength(2);
    expect(groups[0].months[0].month).toBe('03');
    expect(groups[0].months[0].posts).toHaveLength(1);
    expect(groups[0].months[1].month).toBe('01');
    expect(groups[0].months[1].posts).toHaveLength(2);
  });

  it('sorts years descending and months descending within each year', () => {
    const posts = [
      makePost({ id: '1', publishedAt: '2023-06-01T00:00:00Z' }),
      makePost({ id: '2', publishedAt: '2024-01-01T00:00:00Z' }),
      makePost({ id: '3', publishedAt: '2024-06-01T00:00:00Z' }),
      makePost({ id: '4', publishedAt: '2023-01-01T00:00:00Z' }),
    ];

    const groups = groupByYearMonth(posts);

    expect(groups.map((g) => g.year)).toEqual(['2024', '2023']);
    expect(groups[0].months.map((m) => m.month)).toEqual(['06', '01']);
    expect(groups[1].months.map((m) => m.month)).toEqual(['06', '01']);
  });

  it('falls back to createdAt when publishedAt is null', () => {
    const posts = [
      makePost({ id: '1', publishedAt: null, createdAt: '2024-09-01T00:00:00Z' }),
    ];

    const groups = groupByYearMonth(posts);

    expect(groups).toHaveLength(1);
    expect(groups[0].year).toBe('2024');
    expect(groups[0].months[0].month).toBe('09');
  });
});

describe('formatAbsoluteDate', () => {
  it('formats ISO date string to yyyy/MM/dd', () => {
    expect(formatAbsoluteDate('2024-01-05T10:30:00Z')).toBe('2024/01/05');
  });

  it('pads month and day with leading zeros', () => {
    expect(formatAbsoluteDate('2023-12-25T00:00:00Z')).toBe('2023/12/25');
  });
});
