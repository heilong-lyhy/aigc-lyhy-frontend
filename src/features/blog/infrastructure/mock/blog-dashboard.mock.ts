// src/features/blog/infrastructure/mock/blog-dashboard.mock.ts

import type { BlogDashboard } from '@/entities/blog';

import { mockBlogComments } from './blog-comment.mock';
import { mockBlogPosts } from './blog-post.mock';

export const mockBlogDashboard: BlogDashboard = {
  totalPosts: mockBlogPosts.length,
  totalComments: mockBlogComments.length,
  totalLikes: mockBlogPosts.reduce((sum, p) => sum + p.likeCount, 0),
  totalViews: mockBlogPosts.reduce((sum, p) => sum + p.viewCount, 0),
  recentPosts: mockBlogPosts.filter((p) => p.status === 'published').slice(0, 3),
  recentComments: mockBlogComments.filter((c) => c.status === 'approved').slice(0, 3),
};
