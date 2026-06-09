// @vitest-environment happy-dom
// src/features/blog/application/use-blog-filter.spec.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// mock react-router 的 useSearchParams
const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

import { useBlogFilter } from './use-blog-filter';

describe('useBlogFilter', () => {
  afterEach(() => {
    mockSearchParams.delete('category');
    mockSearchParams.delete('tag');
    mockSetSearchParams.mockReset();
  });

  it('应从空 URL 读取默认值', () => {
    const { result } = renderHook(() => useBlogFilter());

    expect(result.current.filters.categoryId).toBeUndefined();
    expect(result.current.filters.tagId).toBeUndefined();
    expect(result.current.selectedCategoryIdStr).toBeUndefined();
    expect(result.current.selectedTagIdStr).toBeUndefined();
  });

  it('应从 URL 读取已有的筛选参数', () => {
    mockSearchParams.set('category', '5');
    mockSearchParams.set('tag', '3');

    const { result } = renderHook(() => useBlogFilter());

    expect(result.current.filters.categoryId).toBe(5);
    expect(result.current.filters.tagId).toBe(3);
    expect(result.current.selectedCategoryIdStr).toBe('5');
    expect(result.current.selectedTagIdStr).toBe('3');
  });

  it('setCategory 应更新 URL 参数', () => {
    const { result } = renderHook(() => useBlogFilter());

    act(() => {
      result.current.setCategory(10);
    });

    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const updater = mockSetSearchParams.mock.calls[0][0];
    const next = updater(new URLSearchParams());
    expect(next.get('category')).toBe('10');
  });

  it('setCategory(undefined) 应移除 URL 参数', () => {
    const { result } = renderHook(() => useBlogFilter());

    act(() => {
      result.current.setCategory(undefined);
    });

    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const updater = mockSetSearchParams.mock.calls[0][0];
    const prev = new URLSearchParams();
    prev.set('category', '5');
    const next = updater(prev);
    expect(next.get('category')).toBeNull();
  });

  it('setTag 应更新 URL 参数', () => {
    const { result } = renderHook(() => useBlogFilter());

    act(() => {
      result.current.setTag(7);
    });

    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const updater = mockSetSearchParams.mock.calls[0][0];
    const next = updater(new URLSearchParams());
    expect(next.get('tag')).toBe('7');
  });

  it('setTag(undefined) 应移除 URL 参数', () => {
    const { result } = renderHook(() => useBlogFilter());

    act(() => {
      result.current.setTag(undefined);
    });

    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const updater = mockSetSearchParams.mock.calls[0][0];
    const prev = new URLSearchParams();
    prev.set('tag', '3');
    const next = updater(prev);
    expect(next.get('tag')).toBeNull();
  });

  it('categoryId 和 tagId 互不干扰', () => {
    const { result } = renderHook(() => useBlogFilter());

    act(() => {
      result.current.setCategory(5);
    });

    act(() => {
      result.current.setTag(3);
    });

    expect(mockSetSearchParams).toHaveBeenCalledTimes(2);

    // setCategory 不应影响 tag
    const categoryUpdater = mockSetSearchParams.mock.calls[0][0];
    const prev1 = new URLSearchParams();
    prev1.set('tag', '99');
    const next1 = categoryUpdater(prev1);
    expect(next1.get('category')).toBe('5');
    expect(next1.get('tag')).toBe('99'); // 保持不变

    // setTag 不应影响 category
    const tagUpdater = mockSetSearchParams.mock.calls[1][0];
    const prev2 = new URLSearchParams();
    prev2.set('category', '10');
    const next2 = tagUpdater(prev2);
    expect(next2.get('category')).toBe('10'); // 保持不变
    expect(next2.get('tag')).toBe('3');
  });

  it('应忽略无效的 URL 参数值', () => {
    mockSearchParams.set('category', 'abc');
    mockSearchParams.set('tag', '-1');

    const { result } = renderHook(() => useBlogFilter());

    expect(result.current.filters.categoryId).toBeUndefined();
    expect(result.current.filters.tagId).toBeUndefined();
  });
});
