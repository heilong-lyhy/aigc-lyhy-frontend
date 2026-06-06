// @vitest-environment happy-dom
// src/features/blog/hooks/use-admin-files.spec.ts

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/files-api', () => ({
  uploadBlogFile: vi.fn(),
  deleteBlogFile: vi.fn(),
}));

// eslint-disable-next-line prefer-const
let mockMutationErrorState = { mutationError: null as string | null };

vi.mock('../lib/use-mutation-error', () => ({
  useMutationError: () => {
    const setMutationError = vi.fn((message: string) => {
      mockMutationErrorState.mutationError = message;
    });
    const clearMutationError = vi.fn(() => {
      mockMutationErrorState.mutationError = null;
    });
    return {
      mutationError: mockMutationErrorState.mutationError,
      setMutationError,
      clearMutationError,
    };
  },
}));

import { deleteBlogFile, uploadBlogFile } from '../infrastructure/files-api';

import { useAdminFiles } from './use-admin-files';

const mockUploadBlogFile = vi.mocked(uploadBlogFile);
const mockDeleteBlogFile = vi.mocked(deleteBlogFile);

const sampleFile = {
  id: 'f1',
  name: 'photo.jpg',
  url: 'https://cdn.example.com/photo.jpg',
  mimeType: 'image/jpeg',
  size: 204800,
  createdAt: '2024-06-01T00:00:00Z',
};

afterEach(() => {
  vi.clearAllMocks();
  mockMutationErrorState.mutationError = null;
});

describe('useAdminFiles', () => {
  it('initializes with idle state', () => {
    const { result } = renderHook(() => useAdminFiles());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── upload ──

  describe('upload', () => {
    it('uploads a file and returns mapped entity', async () => {
      mockUploadBlogFile.mockResolvedValueOnce(sampleFile);

      const { result } = renderHook(() => useAdminFiles());

      let uploaded: typeof sampleFile | null = null;
      await act(async () => {
        uploaded = await result.current.upload(new File(['x'], 'photo.jpg'));
      });

      expect(uploaded).toEqual(sampleFile);
      expect(mockUploadBlogFile).toHaveBeenCalledTimes(1);
    });

    it('sets isUploading during upload and resets after success', async () => {
      let resolveUpload!: (value: typeof sampleFile) => void;
      mockUploadBlogFile.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
      );

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
      mockUploadBlogFile.mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() => useAdminFiles());

      let uploaded: typeof sampleFile | null = undefined as unknown as typeof sampleFile | null;
      await act(async () => {
        uploaded = await result.current.upload(new File(['x'], 'photo.jpg'));
      });

      expect(uploaded).toBeNull();
      expect(result.current.error).toBe('Upload failed');
      expect(result.current.isUploading).toBe(false);
    });

    it('captures non-Error upload rejection with default message', async () => {
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
    it('deletes a file and returns true', async () => {
      mockDeleteBlogFile.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAdminFiles());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.remove('f1');
      });

      expect(deleted).toBe(true);
      expect(mockDeleteBlogFile).toHaveBeenCalledWith('f1');
    });

    it('returns false when server deletion fails', async () => {
      mockDeleteBlogFile.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAdminFiles());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove('f1');
      });

      expect(deleted).toBe(false);
    });

    it('captures delete error and returns false', async () => {
      mockDeleteBlogFile.mockRejectedValueOnce(new Error('Forbidden'));

      const { result } = renderHook(() => useAdminFiles());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.remove('f1');
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe('Forbidden');
      expect(result.current.isDeleting).toBe(false);
    });

    it('captures non-Error delete rejection with default message', async () => {
      mockDeleteBlogFile.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminFiles());

      await act(async () => {
        await result.current.remove('f1');
      });

      expect(result.current.error).toBe('Failed to delete file');
    });
  });
});
