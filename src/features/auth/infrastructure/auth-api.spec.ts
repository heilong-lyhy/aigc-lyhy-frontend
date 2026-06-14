// src/features/auth/infrastructure/auth-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

// Must also mock codegen documents to prevent import errors
vi.mock('@/shared/graphql', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/graphql')>();
  return {
    ...actual,
    executeGraphQL: vi.fn(),
  };
});

import { executeGraphQL } from '@/shared/graphql';

import { changePassword } from './auth-api';

const mockExecute = vi.mocked(executeGraphQL);

describe('auth-api — changePassword', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls changeBlogAdminPassword mutation with auth required', async () => {
    mockExecute.mockResolvedValueOnce({
      changeBlogAdminPassword: 1,
    });

    const result = await changePassword('old-pass', 'new-pass');

    expect(result.success).toBe(true);
    expect(result.message).toBeNull();

    const [, variables, options] = mockExecute.mock.calls[0];
    expect(variables.input.currentPassword).toBe('old-pass');
    expect(variables.input.newPassword).toBe('new-pass');
    expect(options?.authMode).toBe('required');
  });

  it('propagates errors from executeGraphQL', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Network failure'));

    await expect(changePassword('old', 'new')).rejects.toThrow('Network failure');
  });
});
