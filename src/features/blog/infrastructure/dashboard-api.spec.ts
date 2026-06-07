// src/features/blog/infrastructure/dashboard-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { fetchBlogDashboard } from './dashboard-api';

const mockExecuteGraphQL = vi.mocked(executeGraphQL);

const sampleDashboardDTO = {
  totalPosts: 10,
  totalComments: 50,
  totalLikes: 200,
  totalViews: 1000,
  recentPosts: [
    {
      id: 'p1',
      title: 'Recent Post',
      slug: 'recent-post',
      excerpt: 'excerpt',
      content: 'content',
      coverImage: null,
      categoryId: 'cat-1',
      tags: [],
      authorId: 'author-1',
      status: 'published',
      isPinned: false,
      viewCount: 100,
      likeCount: 10,
      commentCount: 5,
      publishedAt: '2024-06-01T00:00:00Z',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    },
  ],
  recentComments: [
    {
      id: 'c1',
      postId: 'p1',
      authorName: 'User',
      authorEmail: 'user@test.com',
      authorAvatar: null,
      content: 'Nice post',
      status: 'approved',
      parentId: null,
      replyToId: null,
      nestingLevel: 0,
      createdAt: '2024-06-02T00:00:00Z',
      updatedAt: '2024-06-02T00:00:00Z',
    },
  ],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('fetchBlogDashboard', () => {
  it('fetches and maps dashboard data', async () => {
    mockExecuteGraphQL.mockResolvedValueOnce({ blogDashboard: sampleDashboardDTO });

    const result = await fetchBlogDashboard();

    expect(result.totalPosts).toBe(10);
    expect(result.totalComments).toBe(50);
    expect(result.totalLikes).toBe(200);
    expect(result.totalViews).toBe(1000);
    expect(result.recentPosts).toHaveLength(1);
    expect(result.recentPosts[0].id).toBe('p1');
    expect(result.recentComments).toHaveLength(1);
    expect(result.recentComments[0].id).toBe('c1');
  });

  it('calls executeGraphQL with authMode required', async () => {
    mockExecuteGraphQL.mockResolvedValueOnce({ blogDashboard: sampleDashboardDTO });

    await fetchBlogDashboard();

    const options = mockExecuteGraphQL.mock.calls[0][2];
    expect(options?.authMode).toBe('required');
  });

  it('propagates network errors', async () => {
    mockExecuteGraphQL.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchBlogDashboard()).rejects.toThrow('Network error');
  });

  it('handles empty recentPosts and recentComments', async () => {
    mockExecuteGraphQL.mockResolvedValueOnce({
      blogDashboard: { ...sampleDashboardDTO, recentPosts: [], recentComments: [] },
    });

    const result = await fetchBlogDashboard();

    expect(result.recentPosts).toEqual([]);
    expect(result.recentComments).toEqual([]);
  });
});
