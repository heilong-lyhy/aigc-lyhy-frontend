// src/features/blog/hooks/use-like.ts

import { useCallback, useEffect, useReducer } from 'react';

import type { BlogLike, BlogLikeTargetType } from '@/entities/blog';

import { checkBlogLiked, toggleBlogLike } from '../infrastructure/likes-api';

type UseLikeOptions = {
  readonly targetType: BlogLikeTargetType;
  readonly targetId: string;
  readonly fingerprint?: string;
  /** 是否在挂载时自动检查点赞状态，默认 true */
  readonly autoCheck?: boolean;
};

type UseLikeResult = {
  readonly liked: boolean;
  readonly like: BlogLike | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly toggle: () => Promise<void>;
  readonly checkStatus: () => Promise<void>;
};

type State = {
  liked: boolean;
  like: BlogLike | null;
  isLoading: boolean;
  error: string | null;
  mutationError: string | null;
};

type Action =
  | { type: 'CHECK_START' }
  | { type: 'CHECK_SUCCESS'; payload: boolean }
  | { type: 'TOGGLE_START' }
  | { type: 'TOGGLE_SUCCESS'; payload: { liked: boolean; like: BlogLike | null } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'MUTATION_ERROR'; payload: string };

const initialState: State = {
  liked: false,
  like: null,
  isLoading: false,
  error: null,
  mutationError: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CHECK_START':
      return { ...state, isLoading: true, error: null };
    case 'CHECK_SUCCESS':
      return { ...state, liked: action.payload, isLoading: false };
    case 'TOGGLE_START':
      return { ...state, isLoading: true, mutationError: null };
    case 'TOGGLE_SUCCESS':
      return {
        liked: action.payload.liked,
        like: action.payload.like,
        isLoading: false,
        mutationError: null,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'MUTATION_ERROR':
      return { ...state, isLoading: false, mutationError: action.payload };
  }
}

export function useLike(options: UseLikeOptions): UseLikeResult {
  const { targetType, targetId, fingerprint, autoCheck = true } = options;

  const [state, dispatch] = useReducer(reducer, initialState);

  const checkStatus = useCallback(async () => {
    dispatch({ type: 'CHECK_START' });
    try {
      const result = await checkBlogLiked(targetType, targetId);
      dispatch({ type: 'CHECK_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check like status';
      dispatch({ type: 'FETCH_ERROR', payload: message });
    }
  }, [targetType, targetId]);

  useEffect(() => {
    if (autoCheck) {
      void checkStatus();
    }
  }, [autoCheck, checkStatus]);

  const toggle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_START' });
    try {
      const result = await toggleBlogLike({ targetType, targetId, fingerprint });
      dispatch({ type: 'TOGGLE_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle like';
      dispatch({ type: 'MUTATION_ERROR', payload: message });
    }
  }, [targetType, targetId, fingerprint]);

  return {
    liked: state.liked,
    like: state.like,
    isLoading: state.isLoading,
    error: state.error,
    mutationError: state.mutationError,
    toggle,
    checkStatus,
  };
}
