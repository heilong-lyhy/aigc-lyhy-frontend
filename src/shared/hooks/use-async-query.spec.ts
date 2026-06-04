// @vitest-environment happy-dom
// src/shared/hooks/use-async-query.spec.ts

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAsyncQuery } from './use-async-query';

describe('useAsyncQuery', () => {
  it('starts with null data and not loading when autoLoad is false', () => {
    const { result } = renderHook(() =>
      useAsyncQuery({ fetcher: vi.fn(), autoLoad: false }),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('auto-loads data on mount', async () => {
    const mockData = { id: '1', name: 'test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncQuery({ fetcher }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('captures error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAsyncQuery({ fetcher }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('captures non-Error rejection as generic message', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error');

    const { result } = renderHook(() => useAsyncQuery({ fetcher }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch data');
  });

  it('refetch reloads data', async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++;
      return { call: callCount };
    });

    const { result } = renderHook(() => useAsyncQuery({ fetcher }));

    await waitFor(() => {
      expect(result.current.data).toEqual({ call: 1 });
    });

    await act(() => result.current.refetch());

    expect(result.current.data).toEqual({ call: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not auto-load when autoLoad is false', () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    renderHook(() => useAsyncQuery({ fetcher, autoLoad: false }));

    expect(fetcher).not.toHaveBeenCalled();
  });
});
