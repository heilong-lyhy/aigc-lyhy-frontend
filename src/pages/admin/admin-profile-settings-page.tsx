// src/pages/admin/admin-profile-settings-page.tsx

import { useEffect } from 'react';

import { useChangePassword } from '@/features/auth';
import { useAdminProfile } from '@/features/blog';

import { ProfileSettings } from './profile-settings';

export function AdminProfileSettingsPage() {
  const { data, isLoading, mutationError, load, update } = useAdminProfile();
  const { handleChangePassword } = useChangePassword();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProfileSettings
      isLoading={isLoading}
      mutationError={mutationError}
      profile={data}
      onChangePassword={handleChangePassword}
      onUpdateProfile={update}
    />
  );
}
