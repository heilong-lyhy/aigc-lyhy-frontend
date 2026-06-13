// src/features/auth/application/auth-provider.tsx

import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { clearStoredAuthData, fetchBasicUserInfo, getStoredAuthData, loginWithPassword, registerAccount, resetPassword, storeAuthData } from '../infrastructure';
import type {
  AuthCredentials,
  BasicUserInfo,
  LoginResult,
  RegisterInput,
  RegisterResult,
  ResetPasswordResult,
} from '../types';

import { AuthContext } from './auth-context';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState(() => {
    const { accessToken, accountId } = getStoredAuthData();
    return {
      accessToken,
      accountId,
      isAuthenticated: !!accessToken && !!accountId,
      isLoading: false,
      userInfo: null as BasicUserInfo | null,
    };
  });

  const refreshUserInfo = useCallback(async () => {
    if (!authState.accountId) {
      return;
    }

    try {
      const userInfo = await fetchBasicUserInfo(authState.accountId);
      setAuthState((prev) => ({ ...prev, userInfo }));
    } catch {
      // transport failure 不清除本地状态，由调用方决定如何处理
    }
  }, [authState.accountId]);

  const login = useCallback(
    async (credentials: AuthCredentials): Promise<LoginResult> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const loginData = await loginWithPassword(credentials);

        storeAuthData(loginData.accessToken, loginData.refreshToken, loginData.accountId);

        setAuthState({
          accessToken: loginData.accessToken,
          accountId: loginData.accountId,
          isAuthenticated: true,
          isLoading: false,
          userInfo: loginData.userInfo as BasicUserInfo | null,
        });

        return loginData;
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<RegisterResult> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const registerData = await registerAccount(input);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return registerData;
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [],
  );

  const resetPasswordFn = useCallback(
    async (token: string, newPassword: string): Promise<ResetPasswordResult> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        const resetData = await resetPassword(token, newPassword);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return resetData;
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredAuthData();
    setAuthState({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      userInfo: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      register,
      resetPassword: resetPasswordFn,
      refreshUserInfo,
    }),
    [authState, login, logout, register, resetPasswordFn, refreshUserInfo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
