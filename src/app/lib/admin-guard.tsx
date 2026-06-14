// src/app/lib/admin-guard.tsx

import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useAuth, useFullUserInfo } from '@/features/auth';

import { ADMIN_ROLE } from './admin-role';

type AdminGuardProps = {
  readonly children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, accountId } = useAuth();
  const { data: fullUserInfo, isLoading } = useFullUserInfo(
    isAuthenticated ? accountId : null,
  );

  // 未登录 → 跳转登录页
  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  // 正在获取用户信息
  if (isLoading || !fullUserInfo) {
    return null;
  }

  // 非管理员 → 跳转首页
  const hasAdminRole = fullUserInfo.accessGroup.some(
    (role) => role === ADMIN_ROLE,
  );
  if (!hasAdminRole) {
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
}
