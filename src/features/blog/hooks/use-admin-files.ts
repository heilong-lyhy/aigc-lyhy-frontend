// src/features/blog/hooks/use-admin-files.ts

import { useCallback, useReducer } from 'react';

import type { BlogFile } from '@/entities/blog';

import { deleteBlogFile, uploadBlogFile } from '../infrastructure/files-api';

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
  error: string | null;
};

type Action =
  | { type: 'UPLOAD_START' }
  | { type: 'UPLOAD_SUCCESS' }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'MUTATION_ERROR'; payload: string };

const initialState: State = {
  isUploading: false,
  isDeleting: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'UPLOAD_START':
      return { ...state, isUploading: true, error: null };
    case 'UPLOAD_SUCCESS':
      return { ...state, isUploading: false };
    case 'DELETE_START':
      return { ...state, isDeleting: true, error: null };
    case 'DELETE_SUCCESS':
      return { ...state, isDeleting: false };
    case 'MUTATION_ERROR':
      return { ...state, isUploading: false, isDeleting: false, error: action.payload };
  }
}

export function useAdminFiles(): UseAdminFilesResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const upload = useCallback(async (file: File): Promise<BlogFile | null> => {
    dispatch({ type: 'UPLOAD_START' });
    try {
      const result = await uploadBlogFile({ file });
      dispatch({ type: 'UPLOAD_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      dispatch({ type: 'MUTATION_ERROR', payload: message });
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: 'DELETE_START' });
    try {
      const result = await deleteBlogFile(id);
      dispatch({ type: 'DELETE_SUCCESS' });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      dispatch({ type: 'MUTATION_ERROR', payload: message });
      return false;
    }
  }, []);

  return {
    isUploading: state.isUploading,
    isDeleting: state.isDeleting,
    error: state.error,
    upload,
    remove,
  };
}
