// src/features/auth/application/use-change-password.ts

import { useCallback } from 'react';

import { changePassword } from '../infrastructure/auth-api';

export type ChangePasswordHandleResult = {
  ok: boolean;
  message?: string;
};

export function useChangePassword() {
  const handleChangePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<ChangePasswordHandleResult> => {
      try {
        const result = await changePassword(currentPassword, newPassword);
        return { ok: result.success, message: result.message ?? undefined };
      } catch {
        return { ok: false, message: '密码修改失败' };
      }
    },
    [],
  );

  return { handleChangePassword };
}
