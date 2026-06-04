// src/features/blog/infrastructure/mock/blog-profile.mock.ts

import type { BlogProfile } from '@/entities/blog';

export const mockBlogProfile: BlogProfile = {
  id: 'profile-1',
  nickname: '博主',
  avatar: 'https://picsum.photos/seed/avatar/200/200',
  bio: '全栈开发者，热爱前端技术与开源社区。偶尔写写技术文章，分享学习心得。',
  socialLinks: [
    { platform: 'github', url: 'https://github.com/example', icon: null },
    { platform: 'twitter', url: 'https://twitter.com/example', icon: null },
    { platform: 'email', url: 'mailto:admin@example.com', icon: null },
  ],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-12-01T00:00:00.000Z',
};
