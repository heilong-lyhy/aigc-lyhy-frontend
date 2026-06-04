// src/shared/test/stubs/index.ts

export { ApolloClient, gql, HttpLink, InMemoryCache, useApolloClient, useLazyQuery, useMutation, useQuery } from './apollo-client';
export { CombinedGraphQLErrors, ServerError, ServerParseError } from './apollo-errors';
export { setContext } from './apollo-link-context';
export type { GraphQLAuthMode, GraphQLIngressErrorType } from './graphql';
export { configureGraphQLRuntime, executeGraphQL, getGraphQLClient, GraphQLIngressError, isGraphQLIngressError, toGraphQLIngressError } from './graphql';
