// src/entities/blog/group-by-date.ts

import type { BlogPost } from './types';

export type YearMonthGroup = {
  readonly year: string;
  readonly months: readonly {
    readonly month: string;
    readonly posts: readonly BlogPost[];
  }[];
};

/** 将文章列表按年月分组，按年倒序、月倒序排列 */
export const groupByYearMonth = (posts: readonly BlogPost[]): readonly YearMonthGroup[] => {
  const map = new Map<string, Map<string, BlogPost[]>>();

  for (const post of posts) {
    const dateStr = post.publishedAt ?? post.createdAt;
    const date = new Date(dateStr);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');

    if (!map.has(year)) {
      map.set(year, new Map());
    }
    const yearMap = map.get(year)!;
    if (!yearMap.has(month)) {
      yearMap.set(month, []);
    }
    yearMap.get(month)!.push(post);
  }

  const groups: YearMonthGroup[] = [];
  for (const [year, monthMap] of [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const months = [...monthMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, monthPosts]) => ({ month, posts: monthPosts }));
    groups.push({ year, months });
  }

  return groups;
};

/** 将 ISO 日期字符串格式化为绝对日期（如 2024/01/15） */
export const formatAbsoluteDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};
