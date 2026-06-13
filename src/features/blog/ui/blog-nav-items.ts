// src/features/blog/ui/blog-nav-items.ts

/** 博客子导航项，供 BlogLayout 顶栏和 BlogSidebar 快捷链接复用 */
export type BlogNavItem = {
  readonly label: string;
  readonly path: string;
};

const LABEL_POSTS = '文章';
const LABEL_ARCHIVE = '归档';
const LABEL_SEARCH = '搜索';
const LABEL_FRIENDS = '友链';
const LABEL_ABOUT = '关于';

export const BLOG_NAV_ITEMS: readonly BlogNavItem[] = [
  { label: LABEL_POSTS, path: '/blog' },
  { label: LABEL_ARCHIVE, path: '/blog/archive' },
  { label: LABEL_SEARCH, path: '/blog/search' },
  { label: LABEL_FRIENDS, path: '/blog/friends' },
  { label: LABEL_ABOUT, path: '/blog/about' },
];
