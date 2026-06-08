// src/features/blog/application/use-comment.ts

import { useCallback, useReducer } from 'react';

import type { BlogComment } from '@/entities/blog';

import { createBlogComment, deleteBlogComment } from '../infrastructure/comments-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseCommentResult = {
  readonly isSubmitting: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly submitComment: (
    input: Readonly<{
      postId: number;
      authorName: string;
      authorEmail: string;
      content: string;
      parentId?: number | null;
      replyToId?: number | null;
    }>,
  ) => Promise<BlogComment | null>;
  readonly removeComment: (id: number) => Promise<boolean>;
};

type State = {
  isSubmitting: boolean;
  isDeleting: boolean;
};

type Action =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS' };

const initialState: State = {
  isSubmitting: false,
  isDeleting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false };
    case 'DELETE_START':
      return { ...state, isDeleting: true };
    case 'DELETE_SUCCESS':
      return { ...state, isDeleting: false };
    default:
      return state;
  }
}

export function useComment(): UseCommentResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mutationError: error, clearMutationError, setMutationError } = useMutationError();

  const submitComment = useCallback(
    async (
      input: Readonly<{
        postId: number;
        authorName: string;
        authorEmail: string;
        content: string;
        parentId?: number | null;
        replyToId?: number | null;
      }>,
    ): Promise<BlogComment | null> => {
      clearMutationError();
      dispatch({ type: 'SUBMIT_START' });
      try {
        const result = await createBlogComment(input);
        dispatch({ type: 'SUBMIT_SUCCESS' });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit comment';
        setMutationError(message);
        dispatch({ type: 'SUBMIT_SUCCESS' });
        return null;
      }
    },
    [clearMutationError, setMutationError],
  );

  const removeComment = useCallback(async (id: number): Promise<boolean> => {
    clearMutationError();
    dispatch({ type: 'DELETE_START' });
    try {
      const result = await deleteBlogComment(id);
      dispatch({ type: 'DELETE_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      setMutationError(message);
      dispatch({ type: 'DELETE_SUCCESS' });
      return false;
    }
  }, [clearMutationError, setMutationError]);

  return {
    isSubmitting: state.isSubmitting,
    isDeleting: state.isDeleting,
    error,
    submitComment,
    removeComment,
  };
}
