// src/features/blog/hooks/use-like.ts

import { useCallback, useEffect, useReducer } from 'react';

import type { BlogLike, BlogLikeTargetType } from '@/entities/blog';

import { checkBlogLiked, toggleBlogLike } from '../infrastructure/likes-api';
import { useMutationError } from '../lib/use-mutation-error';

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
};

type Action =
  | { type: 'CHECK_START' }
  | { type: 'CHECK_SUCCESS'; payload: boolean }
  | { type: 'TOGGLE_START' }
  | { type: 'TOGGLE_SUCCESS'; payload: { liked: boolean; like: BlogLike | null } }
  | { type: 'FETCH_ERROR'; payload: string };

const initialState: State = {
  liked: false,
  like: null,
  isLoading: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CHECK_START':
      return { ...state, isLoading: true, error: null };
    case 'CHECK_SUCCESS':
      return { ...state, liked: action.payload, isLoading: false };
    case 'TOGGLE_START':
      return { ...state, isLoading: true };
    case 'TOGGLE_SUCCESS':
      return {
        liked: action.payload.liked,
        like: action.payload.like,
        isLoading: false,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export function useLike(options: UseLikeOptions): UseLikeResult {
  const { targetType, targetId, fingerprint, autoCheck = true } = options;
  const enabled = targetId !== '';

  const [state, dispatch] = useReducer(reducer, initialState);
  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const checkStatus = useCallback(async () => {
    if (!enabled) return;
    dispatch({ type: 'CHECK_START' });
    try {
      const result = await checkBlogLiked(targetType, targetId);
      dispatch({ type: 'CHECK_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check like status';
      dispatch({ type: 'FETCH_ERROR', payload: message });
    }
  }, [enabled, targetType, targetId]);

  useEffect(() => {
    if (autoCheck && enabled) {
      void checkStatus();
    }
  }, [autoCheck, enabled, checkStatus]);

  const toggle = useCallback(async () => {
    if (!enabled) return;
    clearMutationError();
    dispatch({ type: 'TOGGLE_START' });
    try {
      const result = await toggleBlogLike({ targetType, targetId, fingerprint });
      dispatch({ type: 'TOGGLE_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle like';
      setMutationError(message);
    }
  }, [enabled, targetType, targetId, fingerprint, clearMutationError, setMutationError]);

  return {
    liked: state.liked,
    like: state.like,
    isLoading: state.isLoading,
    error: state.error,
    mutationError,
    toggle,
    checkStatus,
  };
}
