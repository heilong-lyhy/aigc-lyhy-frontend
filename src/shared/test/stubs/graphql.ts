// src/shared/test/stubs/graphql.ts
// Lightweight stub for @/shared/graphql to prevent OOM in test environments

export function executeGraphQL<TData>(): Promise<TData> {
  return Promise.resolve({} as TData);
}

export function configureGraphQLRuntime() {}
export function getGraphQLClient() {
  return {
    query: () => Promise.resolve({ data: null }),
    mutate: () => Promise.resolve({ data: null }),
  };
}

export class GraphQLIngressError extends Error {
  readonly type: string;
  readonly operationName?: string;

  constructor(options: { type: string; message: string; operationName?: string }) {
    super(options.message);
    this.type = options.type;
    this.operationName = options.operationName;
  }
}

export function isGraphQLIngressError(error: unknown): error is GraphQLIngressError {
  return error instanceof GraphQLIngressError;
}

export function toGraphQLIngressError(error: unknown) {
  if (error instanceof GraphQLIngressError) return error;
  return new GraphQLIngressError({
    type: 'network',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}

export type GraphQLAuthMode = 'required' | 'none';
export type GraphQLIngressErrorType =
  | 'network'
  | 'http'
  | 'graphql'
  | 'auth'
  | 'malformed';
