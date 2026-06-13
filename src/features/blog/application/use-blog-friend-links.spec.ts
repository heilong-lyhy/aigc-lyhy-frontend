// @vitest-environment happy-dom
// src/features/blog/application/use-blog-friend-links.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogFriendLink } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/friend-links-api', () => ({
  fetchBlogFriendLinks: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogFriendLinks } from './use-blog-friend-links';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

const sampleLink: BlogFriendLink = {
  id: '1',
  name: 'Example Blog',
  url: 'https://example.com',
  description: 'A friendly blog',
  logoUrl: null,
  sortOrder: 0,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogFriendLink[] | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogFriendLinks', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogFriendLinks());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogFriendLinks({ autoLoad: false }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [sampleLink] }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.data).toEqual([sampleLink]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('data 为 null 时应返回空数组', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.data).toEqual([]);
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null, isLoading: true }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.isEmpty).toBe(false);
  });

  it('isEmpty 应在错误时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null, error: 'Error' }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.isEmpty).toBe(false);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() => useBlogFriendLinks());

    expect(result.current.refetch).toBe(refetch);
  });
});
