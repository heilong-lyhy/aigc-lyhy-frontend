// @vitest-environment happy-dom
// src/features/blog/application/use-blog-categories.spec.ts

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BlogCategory } from '@/entities/blog';

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
}));

vi.mock('../infrastructure/categories-api', () => ({
  fetchBlogCategories: vi.fn(),
}));

vi.mock('../infrastructure/mock', () => ({
  mockBlogCategories: [
    {
      id: 'cat-tech',
      name: '技术',
      slug: 'tech',
      description: '技术文章',
      parentId: null,
      sortOrder: 1,
      postCount: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ] as unknown as readonly BlogCategory[],
}));

import { useAsyncQuery } from '@/shared/hooks';

import { useBlogCategories } from './use-blog-categories';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null as readonly BlogCategory[] | null,
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBlogCategories', () => {
  it('应默认自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogCategories());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(true);
  });

  it('应支持禁用自动加载', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useBlogCategories({ autoLoad: false }));

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('应返回正确的数据状态', () => {
    const categories: readonly BlogCategory[] = [
      {
        id: '1',
        name: 'Tech',
        slug: 'tech',
        description: null,
        parentId: null,
        sortOrder: 1,
        postCount: 5,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: categories }));

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.data).toEqual(categories);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('isEmpty 应在数据为空且非加载/错误时为 true', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: [] }));

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.isEmpty).toBe(true);
  });

  it('isEmpty 应在加载中时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, isLoading: true }),
    );

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.isEmpty).toBe(false);
  });

  it('isEmpty 应在错误时为 false', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: null, error: 'Network error' }),
    );

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.isEmpty).toBe(false);
  });

  it('data 为 null 时应返回空数组', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ data: null }));

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.data).toEqual([]);
  });

  it('应暴露 refetch 方法', () => {
    const refetch = vi.fn();
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch }));

    const { result } = renderHook(() => useBlogCategories());

    expect(result.current.refetch).toBe(refetch);
  });

  describe('fetcher 逻辑', () => {
    it('API 成功时应返回数据', async () => {
      const apiCategories: readonly BlogCategory[] = [
        {
          id: '1',
          name: 'Tech',
          slug: 'tech',
          description: null,
          parentId: null,
          children: [],
          sortOrder: 1,
          postCount: 5,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogCategories());

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      // fetcher 内部调用 fetchBlogCategories，这里通过 mock 模拟
      const { fetchBlogCategories } = await import('../infrastructure/categories-api');
      vi.mocked(fetchBlogCategories).mockResolvedValueOnce(apiCategories);

      const result = await fetcher();
      expect(result).toEqual(apiCategories);
    });

    it('API 失败且 useMockFallback=false 时应抛出错误', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogCategories({ useMockFallback: false }));

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      const { fetchBlogCategories } = await import('../infrastructure/categories-api');
      vi.mocked(fetchBlogCategories).mockRejectedValueOnce(new Error('API down'));

      await expect(fetcher()).rejects.toThrow('API down');
    });

    it('API 失败且 useMockFallback=true 时应返回 mock 数据', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useBlogCategories({ useMockFallback: true }));

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];

      const { fetchBlogCategories } = await import('../infrastructure/categories-api');
      vi.mocked(fetchBlogCategories).mockRejectedValueOnce(new Error('API down'));

      const result = await fetcher();
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'cat-tech', name: '技术' }),
        ]),
      );
    });
  });
});
