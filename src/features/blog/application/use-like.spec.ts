// @vitest-environment happy-dom
// src/features/blog/application/use-like.spec.ts

import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkBlogPostLiked, toggleBlogPostLike } from '../infrastructure/likes-api';

import { useLike } from './use-like';

vi.mock('../infrastructure/likes-api', () => ({
  checkBlogPostLiked: vi.fn(),
  toggleBlogPostLike: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
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

const mockCheckBlogPostLiked = vi.mocked(checkBlogPostLiked);
const mockToggleBlogPostLike = vi.mocked(toggleBlogPostLike);

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLike', () => {
  it('does not check status when postId is 0', () => {
    renderHook(() => useLike({ postId: 0, userIdentifier: 'user-1', autoCheck: true }));

    expect(mockCheckBlogPostLiked).not.toHaveBeenCalled();
  });

  it('checks like status on mount when autoCheck is true', async () => {
    mockCheckBlogPostLiked.mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useLike({ postId: 1, userIdentifier: 'user-1', autoCheck: true }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(true);
    });

    expect(mockCheckBlogPostLiked).toHaveBeenCalledWith(1, 'user-1');
  });

  it('does not check when autoCheck is false', () => {
    renderHook(() =>
      useLike({ postId: 1, userIdentifier: 'user-1', autoCheck: false }),
    );

    expect(mockCheckBlogPostLiked).not.toHaveBeenCalled();
  });

  it('toggles like from unliked to liked', async () => {
    mockCheckBlogPostLiked.mockResolvedValueOnce(false);
    mockToggleBlogPostLike.mockResolvedValueOnce({ liked: true });

    const { result } = renderHook(() =>
      useLike({ postId: 1, userIdentifier: 'user-1' }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(false);
    });

    await act(() => result.current.toggle());

    expect(result.current.liked).toBe(true);
    expect(mockToggleBlogPostLike).toHaveBeenCalledWith(1, 'user-1');
  });

  it('does not toggle when postId is 0', async () => {
    const { result } = renderHook(() =>
      useLike({ postId: 0, userIdentifier: 'user-1' }),
    );

    await act(() => result.current.toggle());
    expect(mockToggleBlogPostLike).not.toHaveBeenCalled();
  });

  it('captures check error', async () => {
    mockCheckBlogPostLiked.mockRejectedValueOnce(new Error('Check failed'));

    const { result } = renderHook(() =>
      useLike({ postId: 1, userIdentifier: 'user-1' }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Check failed');
    });
  });

  it('captures toggle error as mutationError', async () => {
    mockCheckBlogPostLiked.mockResolvedValueOnce(false);
    mockToggleBlogPostLike.mockRejectedValueOnce(new Error('Toggle failed'));

    const { result } = renderHook(() =>
      useLike({ postId: 1, userIdentifier: 'user-1' }),
    );

    await waitFor(() => {
      expect(result.current.liked).toBe(false);
    });

    await act(() => result.current.toggle());

    expect(result.current.mutationError).toBe('Toggle failed');
  });
});
