// @vitest-environment happy-dom
// src/features/blog/application/use-admin-profile.spec.ts

import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure', () => ({
  fetchBlogProfile: vi.fn(),
  updateBlogProfile: vi.fn(),
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

import type { BlogProfile } from '@/entities/blog';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchBlogProfile, updateBlogProfile } from '../infrastructure';

import { useAdminProfile } from './use-admin-profile';

const mockUseAsyncQuery = vi.mocked(useAsyncQuery);
const mockFetchBlogProfile = vi.mocked(fetchBlogProfile);
const mockUpdateBlogProfile = vi.mocked(updateBlogProfile);

const sampleProfile: BlogProfile = {
  id: 'prof-1',
  nickname: 'TestUser',
  avatar: null,
  bio: 'Hello',
  socialLinks: [] as readonly never[],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

function mockAsyncQueryReturn(overrides: Partial<ReturnType<typeof useAsyncQuery>> = {}) {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAdminProfile', () => {
  it('initializes with autoLoad false', () => {
    mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

    renderHook(() => useAdminProfile());

    const options = mockUseAsyncQuery.mock.calls[0][0];
    expect(options.autoLoad).toBe(false);
  });

  it('exposes data from useAsyncQuery', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ data: sampleProfile, isLoading: false }),
    );

    const { result } = renderHook(() => useAdminProfile());

    expect(result.current.data).toEqual(sampleProfile);
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes error from useAsyncQuery', () => {
    mockUseAsyncQuery.mockReturnValue(
      mockAsyncQueryReturn({ error: 'Network error' }),
    );

    const { result } = renderHook(() => useAdminProfile());

    expect(result.current.error).toBe('Network error');
  });

  // ── load ──

  describe('load', () => {
    it('calls refetch to load profile', async () => {
      const mockRefetch = vi.fn().mockResolvedValue(undefined);
      mockUseAsyncQuery.mockReturnValue(
        mockAsyncQueryReturn({ refetch: mockRefetch }),
      );

      const { result } = renderHook(() => useAdminProfile());

      await act(async () => {
        await result.current.load();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates profile and returns mapped entity', async () => {
      const updatedProfile = { ...sampleProfile, nickname: 'Updated' };
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogProfile.mockResolvedValueOnce(updatedProfile);

      const { result } = renderHook(() => useAdminProfile());

      let returned: typeof updatedProfile | null = undefined as unknown as typeof updatedProfile | null;
      await act(async () => {
        returned = await result.current.update({ nickname: 'Updated' });
      });

      expect(returned).toEqual(updatedProfile);
      expect(mockUpdateBlogProfile).toHaveBeenCalledWith({ nickname: 'Updated' });
    });

    it('captures update error and returns null', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogProfile.mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useAdminProfile());

      let returned: typeof sampleProfile | null = undefined as unknown as typeof sampleProfile | null;
      await act(async () => {
        returned = await result.current.update({ nickname: 'x' });
      });

      expect(returned).toBeNull();
      expect(result.current.mutationError).toBe('Unauthorized');
    });

    it('captures non-Error rejection with default message', async () => {
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());
      mockUpdateBlogProfile.mockRejectedValueOnce('unknown');

      const { result } = renderHook(() => useAdminProfile());

      await act(async () => {
        await result.current.update({ nickname: 'x' });
      });

      expect(result.current.mutationError).toBe('Failed to update profile');
    });
  });

  // ── fetcher ──

  describe('fetcher', () => {
    it('delegates to fetchBlogProfile', async () => {
      mockFetchBlogProfile.mockResolvedValueOnce(sampleProfile);
      mockUseAsyncQuery.mockReturnValue(mockAsyncQueryReturn());

      renderHook(() => useAdminProfile());

      const { fetcher } = mockUseAsyncQuery.mock.calls[0][0];
      const result = await fetcher();

      expect(mockFetchBlogProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleProfile);
    });
  });
});
