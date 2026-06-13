// src/features/auth/application/auth-context.ts

import { createContext } from 'react';

import type {
  AuthCredentials,
  BasicUserInfo,
  LoginResult,
  RegisterInput,
  RegisterResult,
  ResetPasswordResult,
} from '../types';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: BasicUserInfo | null;
  accountId: number | null;
  accessToken: string | null;
};

type AuthContextValue = AuthState & {
  login: (credentials: AuthCredentials) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  resetPassword: (token: string, newPassword: string) => Promise<ResetPasswordResult>;
  refreshUserInfo: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
