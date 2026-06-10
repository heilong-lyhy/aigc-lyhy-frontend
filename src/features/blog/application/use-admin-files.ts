// src/features/blog/application/use-admin-files.ts

import { useCallback, useMemo, useReducer } from 'react';

import type { BlogFile } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import type { BlogFileListResult } from '../infrastructure/files-api';
import { deleteBlogFile, fetchBlogFiles, uploadBlogFile } from '../infrastructure/files-api';

import { useMutationError } from './use-mutation-error';

type UseAdminFilesOptions = {
  readonly pagination?: { readonly page: number; readonly pageSize: number };
  readonly fileType?: string;
  readonly autoLoad?: boolean;
};

type UseAdminFilesResult = {
  readonly files: BlogFileListResult | null;
  readonly isLoadingFiles: boolean;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly upload: (file: File) => Promise<BlogFile | null>;
  readonly remove: (id: number) => Promise<boolean>;
  readonly refetchFiles: () => Promise<void>;
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

const DEFAULT_PAGINATION = { page: 1, pageSize: 20 };

export function useAdminFiles(options: UseAdminFilesOptions = {}): UseAdminFilesResult {
  const { fileType, autoLoad = true } = options;

  /* eslint-disable react-hooks/exhaustive-deps -- 字段级 deps 防止调用方传字面量对象导致引用不稳定 */
  const pagination = useMemo(
    () => options.pagination ?? DEFAULT_PAGINATION,
    [options.pagination?.page, options.pagination?.pageSize],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const fetcher = useCallback(async (): Promise<BlogFileListResult> => {
    return await fetchBlogFiles(pagination, fileType ? { fileType } : undefined);
  }, [pagination, fileType]);

  const { data: files, isLoading: isLoadingFiles, refetch: refetchFiles } = useAsyncQuery<BlogFileListResult>({
    fetcher,
    autoLoad,
  });

  const [state, dispatch] = useReducer(reducer, initialState);
  const { mutationError: error, clearMutationError, setMutationError } = useMutationError();

  const upload = useCallback(async (file: File): Promise<BlogFile | null> => {
    clearMutationError();
    dispatch({ type: 'UPLOAD_START' });
    try {
      const result = await uploadBlogFile({ file });
      dispatch({ type: 'UPLOAD_SUCCESS' });
      await refetchFiles();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setMutationError(message);
      dispatch({ type: 'UPLOAD_SUCCESS' });
      return null;
    }
  }, [clearMutationError, setMutationError, refetchFiles]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    clearMutationError();
    dispatch({ type: 'DELETE_START' });
    try {
      const result = await deleteBlogFile(id);
      dispatch({ type: 'DELETE_SUCCESS' });
      await refetchFiles();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setMutationError(message);
      dispatch({ type: 'DELETE_SUCCESS' });
      return false;
    }
  }, [clearMutationError, setMutationError, refetchFiles]);

  return {
    files,
    isLoadingFiles,
    isUploading: state.isUploading,
    isDeleting: state.isDeleting,
    error,
    upload,
    remove,
    refetchFiles,
  };
}
