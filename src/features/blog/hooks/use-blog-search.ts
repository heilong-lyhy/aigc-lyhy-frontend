// src/features/blog/hooks/use-blog-search.ts

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';

import { blogStorage } from '../infrastructure/blog-storage';
import { fetchBlogPosts } from '../infrastructure/posts-api';

type UseBlogSearchOptions = {
  readonly pagination: PaginationInput;
  readonly debounceMs?: number;
};

type UseBlogSearchFilters = {
  readonly keyword: string;
  readonly status?: BlogPostStatus;
  readonly categoryId?: string;
  readonly tagId?: string;
};

type UseBlogSearchResult = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly filters: UseBlogSearchFilters;
  readonly searchHistory: readonly string[];
  readonly setFilters: (filters: Partial<UseBlogSearchFilters>) => void;
  readonly clearFilters: () => void;
  readonly refetch: () => Promise<void>;
};

type State = {
  data: PaginatedResult<BlogPost> | null;
  isLoading: boolean;
  error: string | null;
  filters: UseBlogSearchFilters;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: PaginatedResult<BlogPost> }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_FILTERS'; payload: UseBlogSearchFilters }
  | { type: 'CLEAR_FILTERS' };

const DEFAULT_FILTERS: UseBlogSearchFilters = {
  keyword: '',
};

const initialState: State = {
  data: null,
  isLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, data: action.payload, isLoading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'CLEAR_FILTERS':
      return { ...state, data: null, error: null, filters: DEFAULT_FILTERS };
  }
}

export function useBlogSearch(options: UseBlogSearchOptions): UseBlogSearchResult {
  const { pagination, debounceMs = 300 } = options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchHistory, setSearchHistory] = useState<readonly string[]>(
    () => blogStorage.getSearchHistory(),
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 使用 ref 追踪最新 filters，供防抖回调使用
  const filtersRef = useRef<UseBlogSearchFilters>(state.filters);

  const fetchData = useCallback(
    async (currentFilters: UseBlogSearchFilters) => {
      dispatch({ type: 'FETCH_START' });
      try {
        const result = await fetchBlogPosts(pagination, {
          keyword: currentFilters.keyword || undefined,
          status: currentFilters.status,
          categoryId: currentFilters.categoryId,
          tagId: currentFilters.tagId,
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: result });
        if (currentFilters.keyword) {
          blogStorage.addSearchHistory(currentFilters.keyword);
          setSearchHistory(blogStorage.getSearchHistory());
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        dispatch({ type: 'FETCH_ERROR', payload: message });
      }
    },
    [pagination],
  );

  const setFilters = useCallback(
    (partial: Partial<UseBlogSearchFilters>) => {
      const prev = filtersRef.current;
      const next = { ...prev, ...partial };
      filtersRef.current = next;
      dispatch({ type: 'SET_FILTERS', payload: next });

      if (partial.keyword !== undefined && partial.keyword !== prev.keyword) {
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          void fetchData(next);
        }, debounceMs);
      } else {
        void fetchData(next);
      }
    },
    [debounceMs, fetchData],
  );

  const clearFilters = useCallback(() => {
    filtersRef.current = DEFAULT_FILTERS;
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const refetch = useCallback(async () => {
    await fetchData(filtersRef.current);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isEmpty: state.data !== null && state.data.items.length === 0 && !state.isLoading && !state.error,
    error: state.error,
    filters: state.filters,
    searchHistory,
    setFilters,
    clearFilters,
    refetch,
  };
}
