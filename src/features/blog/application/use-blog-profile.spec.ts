// @vitest-environment happy-dom
// src/features/blog/application/use-blog-profile.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogProfile } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/profile-api', () => ({
  fetchBlogProfile: vi.fn(),
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogProfile } from './use-blog-profile';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

const sampleProfile: BlogProfile = {
  id: '1',
  nickname: 'Admin',
  bio: 'Hello world',
  avatarUrl: 'https://example.com/avatar.png',
  socialLinks: { github: 'https://github.com/admin' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as BlogProfile | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogProfile', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogProfile());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogProfile({ autoLoad: false }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: sampleProfile }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.data).toEqual(sampleProfile);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应返回加载状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ isLoading: true }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.isLoading).toBe(true);
  });

  it('应返回错误状态', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ error: 'Network error' }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.error).toBe('Network error');
  });

  it('isEmpty 应在 data 为 null 且非加载/错误时为 true', () => {
    // useBlogProfile 的 isEmpty: data === null && !isLoading && !error
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null, isLoading: true }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.isEmpty).toBe(false);
  });

  it('isEmpty 应在有数据时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: sampleProfile }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.isEmpty).toBe(false);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() => useBlogProfile());

    expect(result.current.refetch).toBe(refetch);
  });

  // ── useMockFallback ──

  describe('useMockFallback', () => {
    it('fetcher 在 useMockFallback=true 时应回退到 mock 数据', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogProfile({ useMockFallback: true }));

      const fetcher = mockUseAsyncQuery.mock.calls[0][0].fetcher;

      const { fetchBlogProfile } = await import('../infrastructure/profile-api');
      vi.mocked(fetchBlogProfile).mockRejectedValueOnce(new Error('API down'));

      const mockModule = await import('../infrastructure/mock');
      const mockProfile: BlogProfile = {
        id: '0',
        nickname: 'Mock',
        bio: null,
        avatarUrl: null,
        socialLinks: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      vi.spyOn(mockModule, 'mockBlogProfile', 'get').mockReturnValue(mockProfile);

      const result = await fetcher();

      expect(result).toEqual(mockProfile);
    });

    it('fetcher 在 useMockFallback=false 时应直接抛出异常', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogProfile({ useMockFallback: false }));

      const fetcher = mockUseAsyncQuery.mock.calls[0][0].fetcher;

      const { fetchBlogProfile } = await import('../infrastructure/profile-api');
      vi.mocked(fetchBlogProfile).mockRejectedValueOnce(new Error('API down'));

      await expect(fetcher()).rejects.toThrow('API down');
    });
  });
});
