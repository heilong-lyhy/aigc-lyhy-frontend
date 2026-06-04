// src/features/blog/hooks/use-comment.ts

import { useCallback, useReducer } from 'react';

import type { BlogComment } from '@/entities/blog';

import { createBlogComment, deleteBlogComment } from '../infrastructure/comments-api';

type UseCommentResult = {
  readonly isSubmitting: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly submitComment: (
    input: Readonly<{
      postId: string;
      authorName: string;
      authorEmail: string;
      content: string;
      parentId?: string | null;
      replyToId?: string | null;
    }>,
  ) => Promise<BlogComment | null>;
  readonly removeComment: (id: string) => Promise<boolean>;
};

type State = {
  isSubmitting: boolean;
  isDeleting: boolean;
  error: string | null;
};

type Action =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'MUTATION_ERROR'; payload: string };

const initialState: State = {
  isSubmitting: false,
  isDeleting: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false };
    case 'DELETE_START':
      return { ...state, isDeleting: true, error: null };
    case 'DELETE_SUCCESS':
      return { ...state, isDeleting: false };
    case 'MUTATION_ERROR':
      return { ...state, isSubmitting: false, isDeleting: false, error: action.payload };
  }
}

export function useComment(): UseCommentResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const submitComment = useCallback(
    async (
      input: Readonly<{
        postId: string;
        authorName: string;
        authorEmail: string;
        content: string;
        parentId?: string | null;
        replyToId?: string | null;
      }>,
    ): Promise<BlogComment | null> => {
      dispatch({ type: 'SUBMIT_START' });
      try {
        const result = await createBlogComment(input);
        dispatch({ type: 'SUBMIT_SUCCESS' });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit comment';
        dispatch({ type: 'MUTATION_ERROR', payload: message });
        return null;
      }
    },
    [],
  );

  const removeComment = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: 'DELETE_START' });
    try {
      const result = await deleteBlogComment(id);
      dispatch({ type: 'DELETE_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      dispatch({ type: 'MUTATION_ERROR', payload: message });
      return false;
    }
  }, []);

  return {
    isSubmitting: state.isSubmitting,
    isDeleting: state.isDeleting,
    error: state.error,
    submitComment,
    removeComment,
  };
}
