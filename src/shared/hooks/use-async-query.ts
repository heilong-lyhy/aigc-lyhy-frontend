// src/shared/hooks/use-async-query.ts

import { useCallback, useEffect, useReducer } from 'react';

type AsyncQueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

type AsyncQueryAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; payload: string };

const createInitialState = <T>(): AsyncQueryState<T> => ({
  data: null,
  isLoading: false,
  error: null,
});

function createReducer<T>() {
  return function reducer(state: AsyncQueryState<T>, action: AsyncQueryAction<T>): AsyncQueryState<T> {
    switch (action.type) {
      case 'FETCH_START':
        return { ...state, isLoading: true, error: null };
      case 'FETCH_SUCCESS':
        return { data: action.payload, isLoading: false, error: null };
      case 'FETCH_ERROR':
        return { ...state, isLoading: false, error: action.payload };
      default:
        return state;
    }
  };
}

type UseAsyncQueryOptions<T> = {
  /** 异步数据获取函数 */
  readonly fetcher: () => Promise<T>;
  /** 是否在挂载时自动加载，默认 true */
  readonly autoLoad?: boolean;
};

type UseAsyncQueryResult<T> = {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

/**
 * 通用异步查询 hook，封装 data / isLoading / error 三态管理。
 * 适用于单次查询场景（fetch and forget），不适用于需要精细状态机的场景。
 */
export function useAsyncQuery<T>(options: UseAsyncQueryOptions<T>): UseAsyncQueryResult<T> {
  const { fetcher, autoLoad = true } = options;

  const [state, dispatch] = useReducer(createReducer<T>(), createInitialState<T>());

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const result = await fetcher();
      dispatch({ type: 'FETCH_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      dispatch({ type: 'FETCH_ERROR', payload: message });
    }
  }, [fetcher]);

  useEffect(() => {
    if (autoLoad) {
      void fetchData();
    }
  }, [autoLoad, fetchData]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
  };
}
