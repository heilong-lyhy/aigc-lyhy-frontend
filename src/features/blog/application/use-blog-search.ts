// src/features/blog/application/use-blog-search.ts

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { BlogPost, PaginatedResult, PaginationInput } from '@/entities/blog';

import { blogStorage } from '../infrastructure/blog-storage';
import { fetchBlogPublishedPosts } from '../infrastructure/posts-api';

type UseBlogSearchOptions = {
  readonly pagination: PaginationInput;
  readonly debounceMs?: number;
};

type UseBlogSearchFilters = {
  readonly keyword: string;
  readonly sortBy?: string;
  readonly sortOrder?: string;
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
  readonly resetSearchSession: () => void;
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
    default:
      return state;
  }
}

function clearDebounceTimer(timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (timerRef.current !== null) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export function useBlogSearch(options: UseBlogSearchOptions): UseBlogSearchResult {
  const { pagination, debounceMs = 300 } = options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchHistory, setSearchHistory] = useState<readonly string[]>(
    () => blogStorage.getSearchHistory(),
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const filtersRef = useRef<UseBlogSearchFilters>(state.filters);

  const fetchData = useCallback(
    async (currentFilters: UseBlogSearchFilters) => {
      dispatch({ type: 'FETCH_START' });
      try {
        const result = await fetchBlogPublishedPosts(pagination, {
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder,
          title: currentFilters.keyword || undefined,
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
        clearDebounceTimer(debounceTimerRef);
        debounceTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            void fetchData(next);
          }
        }, debounceMs);
      } else {
        void fetchData(next);
      }
    },
    [debounceMs, fetchData],
  );

  const clearFilters = useCallback(() => {
    clearDebounceTimer(debounceTimerRef);
    filtersRef.current = DEFAULT_FILTERS;
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const resetSearchSession = useCallback(() => {
    clearDebounceTimer(debounceTimerRef);
    blogStorage.clearSearchHistory();
    setSearchHistory([]);
    filtersRef.current = DEFAULT_FILTERS;
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const refetch = useCallback(async () => {
    await fetchData(filtersRef.current);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearDebounceTimer(debounceTimerRef);
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
    resetSearchSession,
    refetch,
  };
}
