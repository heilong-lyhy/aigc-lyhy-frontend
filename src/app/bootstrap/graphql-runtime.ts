import { getStoredAuthData } from '@/features/auth';

import { configureGraphQLRuntime } from '@/shared/graphql';

export function bootstrapGraphQLRuntime() {
  configureGraphQLRuntime({
    getAccessToken: () => getStoredAuthData().accessToken,
    onAuthFailure: () => {
      window.location.href = '/auth';
    },
  });
}