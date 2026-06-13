// src/features/blog/application/use-like.ts

import { useCallback, useEffect, useReducer } from 'react';

import type { BlogLike } from '@/entities/blog';

import { useMutationError } from '@/shared/hooks';

import { checkBlogPostLiked, toggleBlogPostLike } from '../infrastructure';

type UseLikeOptions = {
  readonly postId: number;
  readonly userIdentifier: string;
  /** 是否在挂载时自动检查点赞状态，默认 true */
  readonly autoCheck?: boolean;
};

type UseLikeResult = {
  readonly liked: boolean;
  readonly like: BlogLike | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly mutationError: string | null;
  /** 相对于首次检查时的 likeCount 偏移量：+1 表示新增点赞，-1 表示取消点赞，0 表示无变化 */
  readonly likeCountDelta: number;
  readonly toggle: () => Promise<void>;
  readonly checkStatus: () => Promise<void>;
};

type State = {
  liked: boolean;
  like: BlogLike | null;
  isLoading: boolean;
  error: string | null;
  /** 首次检查时的 liked 状态，用于计算 likeCountDelta */
  initialLiked: boolean | null;
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
  initialLiked: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CHECK_START':
      return { ...state, isLoading: true, error: null };
    case 'CHECK_SUCCESS':
      return {
        ...state,
        liked: action.payload,
        isLoading: false,
        initialLiked: state.initialLiked ?? action.payload,
      };
    case 'TOGGLE_START':
      return { ...state, isLoading: true };
    case 'TOGGLE_SUCCESS':
      return {
        liked: action.payload.liked,
        like: action.payload.like,
        isLoading: false,
        error: null,
        initialLiked: state.initialLiked ?? !action.payload.liked,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export function useLike(options: UseLikeOptions): UseLikeResult {
  const { postId, userIdentifier, autoCheck = true } = options;
  const enabled = postId > 0;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { mutationError, clearMutationError, setMutationError } = useMutationError();

  const checkStatus = useCallback(async () => {
    if (!enabled) return;
    dispatch({ type: 'CHECK_START' });
    try {
      const result = await checkBlogPostLiked(postId, userIdentifier);
      dispatch({ type: 'CHECK_SUCCESS', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check like status';
      dispatch({ type: 'FETCH_ERROR', payload: message });
    }
  }, [enabled, postId, userIdentifier]);

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
      const result = await toggleBlogPostLike(postId, userIdentifier);
      dispatch({ type: 'TOGGLE_SUCCESS', payload: { liked: result.liked, like: result } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle like';
      setMutationError(message);
    }
  }, [enabled, postId, userIdentifier, clearMutationError, setMutationError]);

  // 计算偏移量：当前 liked 与初始 liked 的差异
  const likeCountDelta = state.initialLiked === null
    ? 0
    : (state.liked && !state.initialLiked) ? 1
      : (!state.liked && state.initialLiked) ? -1
        : 0;

  return {
    liked: state.liked,
    like: state.like,
    isLoading: state.isLoading,
    error: state.error,
    mutationError,
    likeCountDelta,
    toggle,
    checkStatus,
  };
}
