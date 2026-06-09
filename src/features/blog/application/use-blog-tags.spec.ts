// @vitest-environment happy-dom
// src/features/blog/application/use-blog-tags.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogTag } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/tags-api', () => ({
  fetchBlogTags: vi.fn(),
}));

vi.mock('../infrastructure/mock', () => ({
  mockBlogTags: [
    {
      id: 'tag-react',
      name: 'React',
      slug: 'react',
      postCount: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ] as unknown as readonly BlogTag[],
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogTags } from './use-blog-tags';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogTag[] | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogTags', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogTags());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogTags({ autoLoad: false }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    const tags: readonly BlogTag[] = [
      {
        id: '1',
        name: 'React',
        slug: 'react',
        postCount: 5,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: tags }));

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.data).toEqual(tags);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, isLoading: true }),
    );

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.isEmpty).toBe(false);
  });

  it('isEmpty 应在错误时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, error: 'Network error' }),
    );

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.isEmpty).toBe(false);
  });

  it('data 为 null 时应返回空数组', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null }));

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.data).toEqual([]);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() => useBlogTags());

    expect(result.current.refetch).toBe(refetch);
  });

  describe('fetcher 逻辑', () => {
    it('API 成功时应返回数据', async () => {
      const apiTags: readonly BlogTag[] = [
        {
          id: '1',
          name: 'React',
          slug: 'react',
          postCount: 5,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogTags());

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      const { fetchBlogTags } = await import('../infrastructure/tags-api');
      vi.mocked(fetchBlogTags).mockResolvedValueOnce(apiTags);

      const result = await fetcher();
      expect(result).toEqual(apiTags);
    });

    it('API 失败且 useMockFallback=false 时应抛出错误', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogTags({ useMockFallback: false }));

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      const { fetchBlogTags } = await import('../infrastructure/tags-api');
      vi.mocked(fetchBlogTags).mockRejectedValueOnce(new Error('API down'));

      await expect(fetcher()).rejects.toThrow('API down');
    });

    it('API 失败且 useMockFallback=true 时应返回 mock 数据', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogTags({ useMockFallback: true }));

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      const { fetchBlogTags } = await import('../infrastructure/tags-api');
      vi.mocked(fetchBlogTags).mockRejectedValueOnce(new Error('API down'));

      const result = await fetcher();
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'tag-react', name: 'React' }),
        ]),
      );
    });
  });
});
