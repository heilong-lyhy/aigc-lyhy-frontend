// @vitest-environment happy-dom
// src/features/blog/application/use-admin-files.spec.ts

import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure', () => ({
  fetchBlogFiles: vi.fn(),
  uploadBlogFile: vi.fn(),
  deleteBlogFile: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useAsyncQuery: vi.fn(),
  useMutationError: () => {
    const [mutationError, setMutationErrorState] = React.useState<string | null>(null);
    const setMutationError = vi.fn((message: string) => {
      setMutationErrorState(message);
    });
    const clearMutationError = vi.fn(() => {
      setMutationErrorState(null);
    });
    return { mutationError, setMutationError, clearMutationError };
  },
}));

import type { BlogFile } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { deleteBlogFile, fetchBlogFiles, uploadBlogFile } from '../infrastructure';

import { useAdminFiles } from './use-admin-files';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockFetchBlogFiles = vi.mocked(fetchBlogFiles);
const mockUploadBlogFile = vi.mocked(uploadBlogFile);
const mockDeleteBlogFile = vi.mocked(deleteBlogFile);

const sampleFile: BlogFile = {
  id: '1',
  originalName: 'photo.jpg',
  storedName: 'abc123.jpg',
  mimeType: 'image/jpeg',
  fileSize: 204800,
  storagePath: '/uploads/abc123.jpg',
  fileType: 'image',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const sampleFileList = {
  items: [sampleFile] as readonly BlogFile[],
  total: 1,
  current: 1,
  pageSize: 20,
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminFiles', () => {
  it('initializes with idle state', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    const { result } = renderHook(() => useAdminFiles());

    expect(result.current.files).toBeNull();
    expect(result.current.isLoadingFiles).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('passes pagination and fileType to fetchBlogFiles fetcher', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() =>
      useAdminFiles({ pagination: { page: 2, pageSize: 10 }, fileType: 'image' }),
    );

    const { fetcher, autoLoad } = mockUseAsyncQuery.mock.calls[0][0];
    expect(autoLoad).toBe(true);

    // Call the fetcher to verify it calls fetchBlogFiles with correct args
    void fetcher();
    expect(mockFetchBlogFiles).toHaveBeenCalledWith(
      { page: 2, pageSize: 10 },
      { fileType: 'image' },
    );
  });

  it('does not pass fileType filter when undefined', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useAdminFiles());

    const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];
    void fetcher();
    expect(mockFetchBlogFiles).toHaveBeenCalledWith(
      { page: 1, pageSize: 20 },
      undefined,
    );
  });

  it('exposes files data from useAsyncQuery', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: sampleFileList, isLoading: false }),
    );

    const { result } = renderHook(() => useAdminFiles());

    expect(result.current.files).toEqual(sampleFileList);
    expect(result.current.isLoadingFiles).toBe(false);
  });

  it('exposes loading state from useAsyncQuery', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ isLoading: true }),
    );

    const { result } = renderHook(() => useAdminFiles());

    expect(result.current.isLoadingFiles).toBe(true);
  });

  it('exposes refetchFiles from useAsyncQuery refetch', () => {
    const mockRefetch = vi.fn().mockResolvedValue(undefined);
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ refetch: mockRefetch }),
    );

    const { result } = renderHook(() => useAdminFiles());

    expect(result.current.refetchFiles).toBe(mockRefetch);
  });

  // ── upload ──

  describe('upload', () => {
    it('uploads a file and refetches file list', async () => {
      const mockRefetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch: mockRefetch }));
      mockUploadBlogFile.mockResolvedValueOnce(sampleFile);

      const { result } = renderHook(() => useAdminFiles());

      let uploaded: BlogFile | null = null;
      await act(async () => {
        uploaded = await result.current.upload(new File(['x'], 'photo.jpg'));
      });

      expect(uploaded).toEqual(sampleFile);
      expect(mockUploadBlogFile).toHaveBeenCalledTimes(1);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('sets isUploading during upload and resets after success', async () => {
      let resolveUpload!: (value: BlogFile) => void;
      mockUploadBlogFile.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
      );
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      const { result } = renderHook(() => useAdminFiles());

      act(() => {
        void result.current.upload(new File(['x'], 'photo.jpg'));
      });

      await waitFor(() => {
        expect(result.current.isUploading).toBe(true);
      });

      await act(async () => {
        resolveUpload(sampleFile);
      });

      expect(result.current.isUploading).toBe(false);
    });

    it('captures upload error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUploadBlogFile.mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() => useAdminFiles());

      let uploaded: BlogFile | null = undefined as unknown as BlogFile | null;
      await act(async () => {
        uploaded = await result.current.upload(new File(['x'], 'photo.jpg'));
      });

      expect(uploaded).toBeNull();
      expect(result.current.error).toBe('Upload failed');
      expect(result.current.isUploading).toBe(false);
    });

    it('captures non-Error upload rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUploadBlogFile.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminFiles());

      await act(async () => {
        await result.current.upload(new File(['x'], 'photo.jpg'));
      });

      expect(result.current.error).toBe('Failed to upload file');
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('deletes a file and refetches file list', async () => {
      const mockRefetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn({ refetch: mockRefetch }));
      mockDeleteBlogFile.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAdminFiles());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(true);
      expect(mockDeleteBlogFile).toHaveBeenCalledWith(1);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('returns false when server deletion fails', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogFile.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAdminFiles());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
    });

    it('captures delete error and returns false', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogFile.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useAdminFiles());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove(1);
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe('Forbidden');
      expect(result.current.isDeleting).toBe(false);
    });

    it('captures non-Error delete rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockDeleteBlogFile.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminFiles());

      await act(async () => {
        await result.current.remove(1);
      });

      expect(result.current.error).toBe('Failed to delete file');
    });
  });
});
