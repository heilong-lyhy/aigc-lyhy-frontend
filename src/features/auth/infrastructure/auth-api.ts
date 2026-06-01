import { executeGraphQL } from '@/shared/graphql';

import type {
  AuthCredentials,
  BasicUserInfo,
  FullUserInfo,
  LoginResult,
  RegisterInput,
  RegisterResult,
  ResetPasswordResult,
} from '../types';

const LOGIN_MUTATION = `
  mutation Login($input: AuthLoginInput!) {
    login(input: $input) {
      accessToken
      accountId
      refreshToken
      role
      userInfo {
        accountId
        avatarUrl
        gender
        id
        nickname
        phone
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accountId
      message
      success
    }
  }
`;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      accountId
      message
      success
    }
  }
`;

const BASIC_USER_INFO_QUERY = `
  query BasicUserInfo($accountId: Int!) {
    basicUserInfo(accountId: $accountId) {
      accountId
      avatarUrl
      gender
      id
      nickname
      phone
    }
  }
`;

const USER_INFO_QUERY = `
  query UserInfo($accountId: Int!) {
    userInfo(accountId: $accountId) {
      accountId
      accessGroup
      address
      avatarUrl
      birthDate
      createdAt
      email
      gender
      geographic
      id
      nickname
      notifyCount
      phone
      signature
      tags
      unreadCount
      updatedAt
      userState
    }
  }
`;

export async function loginWithPassword(credentials: AuthCredentials): Promise<LoginResult> {
  const data = await executeGraphQL<{ login: LoginResult }, { input: AuthCredentials }>(
    LOGIN_MUTATION,
    { input: credentials },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return data.login;
}

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  const data = await executeGraphQL<{ register: RegisterResult }, { input: RegisterInput }>(
    REGISTER_MUTATION,
    { input },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return data.register;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const data = await executeGraphQL<
    { resetPassword: ResetPasswordResult },
    { input: { token: string; newPassword: string } }
  >(
    RESET_PASSWORD_MUTATION,
    { input: { token, newPassword } },
    { allowAuthRetry: false, authMode: 'none' },
  );

  return data.resetPassword;
}

export async function fetchBasicUserInfo(accountId: number): Promise<BasicUserInfo> {
  const data = await executeGraphQL<{ basicUserInfo: BasicUserInfo }, { accountId: number }>(
    BASIC_USER_INFO_QUERY,
    { accountId },
    { authMode: 'required' },
  );

  return data.basicUserInfo;
}

export async function fetchFullUserInfo(accountId: number): Promise<FullUserInfo> {
  const data = await executeGraphQL<{ userInfo: FullUserInfo }, { accountId: number }>(
    USER_INFO_QUERY,
    { accountId },
    { authMode: 'required' },
  );

  return data.userInfo;
}