// src/features/auth/application/use-full-user-info.ts

import { useCallback } from 'react';

import { useAsyncQuery } from '@/shared/hooks';

import { fetchFullUserInfo } from '../infrastructure';
import type { FullUserInfo } from '../types';

type UseFullUserInfoResult = {
  readonly data: FullUserInfo | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

export function useFullUserInfo(accountId: number | null): UseFullUserInfoResult {
  const fetcher = useCallback(async (): Promise<FullUserInfo> => {
    if (!accountId) throw new Error('No account ID');
    return await fetchFullUserInfo(accountId);
  }, [accountId]);

  return useAsyncQuery<FullUserInfo>({
    fetcher,
    autoLoad: accountId !== null,
  });
}
