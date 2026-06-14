// src/pages/admin/admin-tag-manager-page.tsx

import { useCallback, useState } from 'react';

import { useAdminTags } from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';
import { toPaginationInput } from '@/entities/blog';

import { TagManager } from './tag-manager';

const DEFAULT_PAGE_SIZE = 10;

export function AdminTagManagerPage() {
  const [tagPagination, setTagPagination] = useState<PaginationInput>(toPaginationInput(1, DEFAULT_PAGE_SIZE));
  const { data, isLoading, create, update, remove } = useAdminTags({ autoLoad: true });

  const tagData = data.length > 0
    ? { items: data, total: data.length, current: tagPagination.page, pageSize: tagPagination.pageSize }
    : null;

  const handleCreate = useCallback(
    (input: { readonly name: string; readonly slug: string }) => {
      void create(input);
    },
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, input: { readonly name: string; readonly slug: string }) => {
      void update({ id: Number(id), ...input });
    },
    [update],
  );

  const handleDelete = useCallback(
    (id: string) => {
      void remove(Number(id));
    },
    [remove],
  );

  return (
    <TagManager
      data={tagData}
      isLoading={isLoading}
      pagination={tagPagination}
      onPaginationChange={setTagPagination}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
