// src/features/auth/get-access-token.ts

import { getStoredAuthData } from './infrastructure/auth-storage';

/** 获取当前存储的 access token，供应用级引导逻辑使用 */
export function getAccessToken(): string | null {
  return getStoredAuthData().accessToken;
}
