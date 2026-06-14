import type {
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
} from '@/shared/graphql';
import {
  BasicUserInfoDocument,
  executeGraphQL,
  LoginDocument,
  RegisterDocument,
  ResetPasswordDocument,
  UserInfoDocument,
} from '@/shared/graphql';

import type { AuthCredentials, BasicUserInfo, ChangePasswordResult, FullUserInfo, LoginResult, RegisterInput, RegisterResult, ResetPasswordResult } from '../types';

function mapLoginResult(raw: LoginMutation['login']): LoginResult {
  return {
    accessToken: raw.accessToken,
    accountId: raw.accountId,
    refreshToken: raw.refreshToken,
    role: raw.role,
    userInfo: raw.userInfo
      ? {
          accountId: raw.userInfo.accountId,
          avatarUrl: raw.userInfo.avatarUrl ?? null,
          gender: raw.userInfo.gender,
          id: raw.userInfo.id,
          nickname: raw.userInfo.nickname,
          phone: raw.userInfo.phone ?? null,
        }
      : null,
  };
}

function mapRegisterResult(raw: RegisterMutation['register']): RegisterResult {
  return {
    accountId: raw.accountId ?? null,
    message: raw.message,
    success: raw.success,
  };
}

function mapResetPasswordResult(raw: ResetPasswordMutation['resetPassword']): ResetPasswordResult {
  return {
    accountId: raw.accountId ?? null,
    message: raw.message ?? null,
    success: raw.success,
  };
}

function mapBasicUserInfo(raw: BasicUserInfoQuery['basicUserInfo']): BasicUserInfo {
  return {
    accountId: raw.accountId,
    avatarUrl: raw.avatarUrl ?? null,
    gender: raw.gender,
    id: raw.id,
    nickname: raw.nickname,
    phone: raw.phone ?? null,
  };
}

function mapFullUserInfo(raw: UserInfoQuery['userInfo']): FullUserInfo {
  return {
    accountId: raw.accountId,
    accessGroup: raw.accessGroup,
    address: raw.address ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    birthDate: raw.birthDate ?? null,
    createdAt: raw.createdAt,
    email: raw.email ?? null,
    geographic: raw.geographic ?? null,
    gender: raw.gender,
    id: raw.id,
    nickname: raw.nickname,
    notifyCount: raw.notifyCount,
    phone: raw.phone ?? null,
    signature: raw.signature ?? null,
    tags: raw.tags ? [...raw.tags] : null,
    unreadCount: raw.unreadCount,
    updatedAt: raw.updatedAt,
    userState: raw.userState,
  };
}

export async function loginWithPassword(credentials: AuthCredentials): Promise<LoginResult> {
  const data = await executeGraphQL<LoginMutation, LoginMutationVariables>(
    LoginDocument,
    { input: credentials },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return mapLoginResult(data.login);
}

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  const data = await executeGraphQL<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument,
    { input },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return mapRegisterResult(data.register);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const data = await executeGraphQL<ResetPasswordMutation, ResetPasswordMutationVariables>(
    ResetPasswordDocument,
    { input: { token, newPassword } },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return mapResetPasswordResult(data.resetPassword);
}

export async function fetchBasicUserInfo(accountId: number): Promise<BasicUserInfo> {
  const data = await executeGraphQL<BasicUserInfoQuery, BasicUserInfoQueryVariables>(
    BasicUserInfoDocument,
    { accountId },
    { authMode: 'required' },
  );

  return mapBasicUserInfo(data.basicUserInfo);
}

export async function fetchFullUserInfo(accountId: number): Promise<FullUserInfo> {
  const data = await executeGraphQL<UserInfoQuery, UserInfoQueryVariables>(
    UserInfoDocument,
    { accountId },
    { authMode: 'required' },
  );

  return mapFullUserInfo(data.userInfo);
}

// ── ChangePassword ──
// 后端提供 changeBlogAdminPassword mutation，返回 accountId (Int!)

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangeBlogAdminPassword($input: ChangeBlogAdminPasswordInput!) {
    changeBlogAdminPassword(input: $input)
  }
`;

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  await executeGraphQL<{ changeBlogAdminPassword: number }, Record<string, unknown>>(
    CHANGE_PASSWORD_MUTATION,
    { input: { currentPassword, newPassword } },
    { authMode: 'required' },
  );

  return { success: true, message: null };
}
