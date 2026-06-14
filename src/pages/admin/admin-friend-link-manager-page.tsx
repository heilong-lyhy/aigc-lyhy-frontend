// src/pages/admin/admin-friend-link-manager-page.tsx

import { useCallback } from 'react';

import { useAdminFriendLinks } from '@/features/blog';

import { FriendLinkManager } from './friend-link-manager';

export function AdminFriendLinkManagerPage() {
  const { data, isLoading, mutationError, create, update, remove } = useAdminFriendLinks({ autoLoad: true });

  const handleCreate = useCallback(
    (input: Readonly<{ name: string; url: string; description?: string; logoUrl?: string; sortOrder?: number }>) => {
      void create(input);
    },
    [create],
  );

  const handleUpdate = useCallback(
    (input: Readonly<{ id: number; name?: string; url?: string; description?: string; logoUrl?: string; sortOrder?: number }>) => {
      void update(input);
    },
    [update],
  );

  const handleDelete = useCallback(
    (id: number) => {
      void remove(id);
    },
    [remove],
  );

  return (
    <FriendLinkManager
      data={data}
      isLoading={isLoading}
      mutationError={mutationError}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
