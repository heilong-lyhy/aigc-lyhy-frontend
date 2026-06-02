// src/shared/graphql/index.ts

// Schema-level types (enums, inputs, DTOs) — single source of truth
export type {
  AccountStatus,
  AudienceTypeEnum,
  Gender,
  IdentityTypeEnum,
  LoginTypeEnum,
  RegisterTypeEnum,
  UserState,
} from './__generated__/schema-types';

// Operation-level types (mutations, queries, variables)
export type {
  BasicUserInfoQuery,
  BasicUserInfoQueryVariables,
  LoginMutation,
  LoginMutationVariables,
  RegisterMutation,
  RegisterMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  UserInfoQuery,
  UserInfoQueryVariables,
} from './__generated__/operations';

// DocumentNodes for typed GraphQL operations
export {
  BasicUserInfoDocument,
  LoginDocument,
  RegisterDocument,
  ResetPasswordDocument,
  UserInfoDocument,
} from './__generated__/operations';
export { configureGraphQLRuntime, getGraphQLClient } from './client';
export type { GraphQLIngressErrorType } from './errors';
export { GraphQLIngressError, isGraphQLIngressError, toGraphQLIngressError } from './errors';
export type { GraphQLAuthMode } from './request';
export { executeGraphQL } from './request';
