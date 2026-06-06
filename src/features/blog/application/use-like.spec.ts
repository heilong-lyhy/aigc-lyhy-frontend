// @vitest-environment happy-dom
// src/features/blog/hooks/use-like.spec.ts

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkBlogLiked, toggleBlogLike } from '../infrastructure/likes-api';

import { useLike } from './use-like';

vi.mock('../infrastructure/likes-api', () => ({
  checkBlogLiked: vi.fn(),
  toggleBlogLike: vi.fn(),
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

const mockCheckBlogLiked = vi.mocked(checkBlogLiked);
const mockToggleBlogLike = vi.mocked(toggleBlogLike);

afterEach(() => {
  vi.clearAllMocks();
  mockMutationErrorState.mutationError = null;
});

describe('useLike', () => {
  it('does not check status when targetId is empty', () => {
    renderHook(() => useLike({ targetType: 'post', targetId: '', autoCheck: true }));

    expect(mockCheckBlogLiked).not.toHaveBeenCalled();
  });

  it('checks like status on mount when autoCheck is true', async () => {
    mockCheckBlogLiked.mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useLike({ targetType: 'post', targetId: 'post-1', autoCheck: true }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(true);
    });

    expect(mockCheckBlogLiked).toHaveBeenCalledWith('post', 'post-1');
  });

  it('does not check when autoCheck is false', () => {
    renderHook(() =>
      useLike({ targetType: 'post', targetId: 'post-1', autoCheck: false }),
    );

    expect(mockCheckBlogLiked).not.toHaveBeenCalled();
  });

  it('toggles like from unliked to liked', async () => {
    mockCheckBlogLiked.mockResolvedValueOnce(false);
    mockToggleBlogLike.mockResolvedValueOnce({
      liked: true,
      like: {
        id: 'like-1',
        targetType: 'post',
        targetId: 'post-1',
        userId: null,
        fingerprint: null,
        createdAt: '2024-01-01T00:00:00Z',
      },
    });

    const { result } = renderHook(() =>
      useLike({ targetType: 'post', targetId: 'post-1' }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(false);
    });

    await act(() => result.current.toggle());

    expect(result.current.liked).toBe(true);
    expect(mockToggleBlogLike).toHaveBeenCalledWith({
      targetType: 'post',
      targetId: 'post-1',
      fingerprint: undefined,
    });
  });

  it('does not toggle when targetId is empty', async () => {
    const { result } = renderHook(() =>
      useLike({ targetType: 'post', targetId: '' }),
    );

    await act(() => result.current.toggle());
    expect(mockToggleBlogLike).not.toHaveBeenCalled();
  });

  it('captures check error', async () => {
    mockCheckBlogLiked.mockRejectedValueOnce(new Error('Check failed'));

    const { result } = renderHook(() =>
      useLike({ targetType: 'post', targetId: 'post-1' }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Check failed');
    });
  });

  it('captures toggle error as mutationError', async () => {
    mockCheckBlogLiked.mockResolvedValueOnce(false);
    mockToggleBlogLike.mockRejectedValueOnce(new Error('Toggle failed'));

    const { result } = renderHook(() =>
      useLike({ targetType: 'post', targetId: 'post-1' }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(false);
    });

    await act(() => result.current.toggle());

    expect(result.current.mutationError).toBe('Toggle failed');
  });
});
