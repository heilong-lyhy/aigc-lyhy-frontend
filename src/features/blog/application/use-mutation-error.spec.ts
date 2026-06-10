// @vitest-environment happy-dom
// src/features/blog/application/use-mutation-error.spec.ts

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMutationError } from './use-mutation-error';

describe('useMutationError', () => {
  it('starts with null mutationError', () => {
    const { result } = renderHook(() => useMutationError());

    expect(result.current.mutationError).toBeNull();
  });

  it('setMutationError stores error message', () => {
    const { result } = renderHook(() => useMutationError());

    act(() => result.current.setMutationError('Something went wrong'));

    expect(result.current.mutationError).toBe('Something went wrong');
  });

  it('clearMutationError resets to null', () => {
    const { result } = renderHook(() => useMutationError());

    act(() => result.current.setMutationError('Error'));
    act(() => result.current.clearMutationError());

    expect(result.current.mutationError).toBeNull();
  });

  it('setMutationError replaces previous error', () => {
    const { result } = renderHook(() => useMutationError());

    act(() => result.current.setMutationError('First error'));
    act(() => result.current.setMutationError('Second error'));

    expect(result.current.mutationError).toBe('Second error');
  });
});
