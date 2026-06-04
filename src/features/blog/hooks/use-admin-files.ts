// src/features/blog/hooks/use-admin-files.ts

import { useCallback, useReducer } from 'react';

import type { BlogFile } from '@/entities/blog';

import { deleteBlogFile, uploadBlogFile } from '../infrastructure/files-api';
import { useMutationError } from '../lib/use-mutation-error';

type UseAdminFilesResult = {
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly upload: (file: File) => Promise<BlogFile | null>;
  readonly remove: (id: string) => Promise<boolean>;
};

type State = {
  isUploading: boolean;
  isDeleting: boolean;
};

type Action =
  | { type: 'UPLOAD_START' }
  | { type: 'UPLOAD_SUCCESS' }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS' };

const initialState: State = {
  isUploading: false,
  isDeleting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'UPLOAD_START':
      return { ...state, isUploading: true };
    case 'UPLOAD_SUCCESS':
      return { ...state, isUploading: false };
    case 'DELETE_START':
      return { ...state, isDeleting: true };
    case 'DELETE_SUCCESS':
      return { ...state, isDeleting: false };
    default:
      return state;
  }
}

export function useAdminFiles(): UseAdminFilesResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mutationError: error, clearMutationError, setMutationError } = useMutationError();

  const upload = useCallback(async (file: File): Promise<BlogFile | null> => {
    clearMutationError();
    dispatch({ type: 'UPLOAD_START' });
    try {
      const result = await uploadBlogFile({ file });
      dispatch({ type: 'UPLOAD_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setMutationError(message);
      dispatch({ type: 'UPLOAD_SUCCESS' });
      return null;
    }
  }, [clearMutationError, setMutationError]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    clearMutationError();
    dispatch({ type: 'DELETE_START' });
    try {
      const result = await deleteBlogFile(id);
      dispatch({ type: 'DELETE_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setMutationError(message);
      dispatch({ type: 'DELETE_SUCCESS' });
      return false;
    }
  }, [clearMutationError, setMutationError]);

  return {
    isUploading: state.isUploading,
    isDeleting: state.isDeleting,
    error,
    upload,
    remove,
  };
}
