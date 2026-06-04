// src/features/blog/lib/extract-toc.ts

import GithubSlugger from 'github-slugger';

import type { TocItem } from './types';

/** 从 Markdown 文本中提取标题信息，使用 github-slugger 与 rehype-slug 保持一致的 id 生成 */
export const extractToc = (content: string): TocItem[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const slugger = new GithubSlugger();
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);
    items.push({ id, text, level });
  }

  return items;
};
