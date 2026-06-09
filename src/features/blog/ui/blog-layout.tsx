// src/features/blog/ui/blog-layout.tsx

import { Avatar, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

import type { BlogProfile } from '@/entities/blog';

type BlogLayoutProps = {
  readonly profile?: BlogProfile | null;
  readonly children: ReactNode;
};

type BlogNavItem = {
  readonly label: string;
  readonly path: string;
};

const { Text } = Typography;

// Page-level sub-navigation for blog section.
// This is independent from the global navigation truth in src/app/navigation/.
// Keep in sync with blog sub-routes registered in src/app/router/index.tsx.
const LABEL_POSTS = '文章';
const LABEL_ARCHIVE = '归档';
const LABEL_SEARCH = '搜索';
const LABEL_FRIENDS = '友链';
const LABEL_ABOUT = '关于';
const LABEL_BLOG_NAV = '博客导航';

const BLOG_NAV_ITEMS: readonly BlogNavItem[] = [
  { label: LABEL_POSTS, path: '/blog' },
  { label: LABEL_ARCHIVE, path: '/blog/archive' },
  { label: LABEL_SEARCH, path: '/blog/search' },
  { label: LABEL_FRIENDS, path: '/blog/friends' },
  { label: LABEL_ABOUT, path: '/blog/about' },
];

const FOOTER_TEXT = `© ${new Date().getFullYear()} Blog. All rights reserved.`;

export function BlogLayout({ profile, children }: BlogLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-bg-container">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          {profile && (
            <div className="flex items-center gap-3">
              <Avatar size={36} src={profile.avatarUrl}>
                {profile.nickname.charAt(0) || 'U'}
              </Avatar>
              <Text strong>{profile.nickname}</Text>
            </div>
          )}

          <nav aria-label={LABEL_BLOG_NAV} className="flex gap-1">
            {BLOG_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <span
                    className={`inline-block rounded px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-text-inverse'
                        : 'text-text-secondary hover:bg-bg-spotlight hover:text-text'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>

      <footer className="border-t border-border bg-bg-container py-4 text-center">
        <Text type="secondary">{FOOTER_TEXT}</Text>
      </footer>
    </div>
  );
}
