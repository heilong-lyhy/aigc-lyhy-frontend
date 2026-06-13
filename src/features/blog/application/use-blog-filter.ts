// src/features/blog/application/use-blog-filter.ts
// 博客首页筛选状态管理：决策何时同步 URL，调用 infrastructure 层的 URL 适配器

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { applyFilterParams, type BlogFilterParams,parseFilterParams } from '../infrastructure';

type UseBlogFilterResult = {
  readonly filters: BlogFilterParams;
  /** 选中分类 ID（字符串版，供展示层直接消费） */
  readonly selectedCategoryIdStr: string | undefined;
  /** 选中标签 ID（字符串版，供展示层直接消费） */
  readonly selectedTagIdStr: string | undefined;
  readonly setCategory: (categoryId: number | undefined) => void;
  readonly setTag: (tagId: number | undefined) => void;
};

export function useBlogFilter(): UseBlogFilterResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseFilterParams(searchParams);

  const selectedCategoryIdStr = useMemo(
    () => filters.categoryId != null ? String(filters.categoryId) : undefined,
    [filters.categoryId],
  );

  const selectedTagIdStr = useMemo(
    () => filters.tagId != null ? String(filters.tagId) : undefined,
    [filters.tagId],
  );

  const setCategory = useCallback(
    (categoryId: number | undefined) => {
      setSearchParams(
        (prev) => applyFilterParams(prev, { categoryId: categoryId ?? null }),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setTag = useCallback(
    (tagId: number | undefined) => {
      setSearchParams(
        (prev) => applyFilterParams(prev, { tagId: tagId ?? null }),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { filters, selectedCategoryIdStr, selectedTagIdStr, setCategory, setTag };
}
