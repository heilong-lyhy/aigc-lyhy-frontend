// src/shared/graphql/errors.spec.ts

import { describe, expect, it, vi } from 'vitest';

// Mock heavy dependencies before importing the module under test
vi.mock('@apollo/client/errors', () => {
  class CombinedGraphQLErrors extends Error {
    readonly errors: readonly object[];
    constructor(errors: readonly object[]) {
      super('GraphQL error');
      this.errors = errors;
    }
    static is(error: unknown): error is CombinedGraphQLErrors {
      return error instanceof CombinedGraphQLErrors;
    }
  }

  class ServerError extends Error {
    readonly statusCode: number;
    constructor(message: string, { statusCode }: { statusCode: number }) {
      super(message);
      this.statusCode = statusCode;
    }
    static is(error: unknown): error is ServerError {
      return error instanceof ServerError;
    }
  }

  class ServerParseError extends Error {
    readonly statusCode: number;
    constructor(message: string, { statusCode }: { statusCode: number }) {
      super(message);
      this.statusCode = statusCode;
    }
    static is(error: unknown): error is ServerParseError {
      return error instanceof ServerParseError;
    }
  }

  return { CombinedGraphQLErrors, ServerError, ServerParseError };
});

vi.mock('graphql', () => ({
  // Minimal stub — errors.ts only uses the type, not runtime
}));

import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';

import {
  GraphQLIngressError,
  isGraphQLIngressError,
  toGraphQLIngressError,
} from './errors';

// ---------------------------------------------------------------------------
// GraphQLIngressError
// ---------------------------------------------------------------------------

describe('GraphQLIngressError', () => {
  it('stores all constructor fields', () => {
    const cause = new Error('root');
    const graphqlErrors = [{ message: 'err' }];
    const err = new GraphQLIngressError({
      type: 'graphql',
      message: 'test',
      statusCode: 400,
      operationName: 'MyQuery',
      graphqlErrors,
      cause,
    });

    expect(err.type).toBe('graphql');
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(400);
    expect(err.operationName).toBe('MyQuery');
    expect(err.graphqlErrors).toBe(graphqlErrors);
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('GraphQLIngressError');
  });

  it('provides userMessage per type', () => {
    const types = ['network', 'http', 'graphql', 'auth', 'malformed'] as const;
    for (const type of types) {
      const err = new GraphQLIngressError({ type, message: 'x' });
      expect(err.userMessage).toBeTruthy();
    }
  });

  it('is retryable for network errors', () => {
    const err = new GraphQLIngressError({ type: 'network', message: 'x' });
    expect(err.isRetryable).toBe(true);
  });

  it('is retryable for http 5xx errors', () => {
    const err = new GraphQLIngressError({ type: 'http', message: 'x', statusCode: 503 });
    expect(err.isRetryable).toBe(true);
  });

  it('is not retryable for http 4xx errors', () => {
    const err = new GraphQLIngressError({ type: 'http', message: 'x', statusCode: 400 });
    expect(err.isRetryable).toBe(false);
  });

  it('is not retryable for graphql/auth/malformed errors', () => {
    for (const type of ['graphql', 'auth', 'malformed'] as const) {
      const err = new GraphQLIngressError({ type, message: 'x' });
      expect(err.isRetryable).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// isGraphQLIngressError
// ---------------------------------------------------------------------------

describe('isGraphQLIngressError', () => {
  it('returns true for GraphQLIngressError instances', () => {
    const err = new GraphQLIngressError({ type: 'network', message: 'x' });
    expect(isGraphQLIngressError(err)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isGraphQLIngressError(new Error('x'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isGraphQLIngressError(null)).toBe(false);
    expect(isGraphQLIngressError('x')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toGraphQLIngressError
// ---------------------------------------------------------------------------

describe('toGraphQLIngressError', () => {
  it('returns the same object if already a GraphQLIngressError', () => {
    const original = new GraphQLIngressError({ type: 'network', message: 'x' });
    const result = toGraphQLIngressError(original);
    expect(result).toBe(original);
  });

  it('maps CombinedGraphQLErrors with UNAUTHENTICATED code to auth type', () => {
    const apolloError = new CombinedGraphQLErrors([
      { message: 'TOKEN_INVALID', extensions: { code: 'UNAUTHENTICATED' } },
    ]);
    const result = toGraphQLIngressError(apolloError, { operationName: 'Login' });

    expect(result.type).toBe('auth');
    expect(result.operationName).toBe('Login');
    expect(result.cause).toBe(apolloError);
  });

  it('maps CombinedGraphQLErrors without auth code to graphql type', () => {
    const apolloError = new CombinedGraphQLErrors([
      { message: 'Something went wrong' },
    ]);
    const result = toGraphQLIngressError(apolloError);

    expect(result.type).toBe('graphql');
  });

  it('maps CombinedGraphQLErrors with TOKEN_INVALID_AFTER_REFRESH to auth type', () => {
    const apolloError = new CombinedGraphQLErrors([
      { message: 'TOKEN_INVALID_AFTER_REFRESH' },
    ]);
    const result = toGraphQLIngressError(apolloError);

    expect(result.type).toBe('auth');
  });

  it('maps ServerError with 401 to auth type', () => {
    const serverError = new ServerError('Unauthorized', { statusCode: 401 });
    const result = toGraphQLIngressError(serverError);

    expect(result.type).toBe('auth');
    expect(result.statusCode).toBe(401);
  });

  it('maps ServerError with 500 to http type', () => {
    const serverError = new ServerError('Internal Server Error', { statusCode: 500 });
    const result = toGraphQLIngressError(serverError);

    expect(result.type).toBe('http');
    expect(result.statusCode).toBe(500);
  });

  it('maps ServerParseError with 502 to http type', () => {
    const parseError = new ServerParseError('Bad Gateway', { statusCode: 502 });
    const result = toGraphQLIngressError(parseError);

    expect(result.type).toBe('http');
    expect(result.statusCode).toBe(502);
  });

  it('maps ServerParseError with 200 to malformed type', () => {
    const parseError = new ServerParseError('Parse failed', { statusCode: 200 });
    const result = toGraphQLIngressError(parseError);

    expect(result.type).toBe('malformed');
  });

  it('maps TypeError with "failed to fetch" to network type', () => {
    const error = new TypeError('Failed to fetch');
    const result = toGraphQLIngressError(error);

    expect(result.type).toBe('network');
  });

  it('maps DOMException AbortError to network type', () => {
    const error = new DOMException('The operation was aborted', 'AbortError');
    const result = toGraphQLIngressError(error);

    expect(result.type).toBe('network');
  });

  it('maps unknown Error to graphql type', () => {
    const error = new Error('Something unexpected');
    const result = toGraphQLIngressError(error, { operationName: 'TestQuery' });

    expect(result.type).toBe('graphql');
    expect(result.operationName).toBe('TestQuery');
  });

  it('maps non-Error values to graphql type with generic message', () => {
    const result = toGraphQLIngressError('string error');

    expect(result.type).toBe('graphql');
    expect(result.message).toBe('Unknown GraphQL execution error');
  });
});
