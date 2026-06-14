// src/pages/admin/admin-post-trash-page.tsx

import { useCallback, useState } from 'react';

import { useAdminDeletedPosts } from '@/features/blog';

import type { PaginationInput } from '@/entities/blog';
import { toPaginationInput } from '@/entities/blog';

import { PostTrash } from './post-trash';

const DEFAULT_PAGE_SIZE = 10;

export function AdminPostTrashPage() {
  const [pagination, setPagination] = useState<PaginationInput>(
    toPaginationInput(1, DEFAULT_PAGE_SIZE),
  );

  const { data, isLoading, restore, permanentDelete } = useAdminDeletedPosts({
    pagination,
    autoLoad: true,
  });

  const handleRestore = useCallback(
    async (id: string) => {
      await restore(Number(id));
    },
    [restore],
  );

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      await permanentDelete(Number(id));
    },
    [permanentDelete],
  );

  return (
    <PostTrash
      data={data}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      onRestore={handleRestore}
      onPermanentDelete={handlePermanentDelete}
    />
  );
}
