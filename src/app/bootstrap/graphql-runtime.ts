import { getAccessToken } from '@/features/auth';

import { configureGraphQLRuntime } from '@/shared/graphql';

export function bootstrapGraphQLRuntime() {
  configureGraphQLRuntime({
    getAccessToken,
    onAuthFailure: () => {
      window.location.href = '/auth';
    },
  });
}