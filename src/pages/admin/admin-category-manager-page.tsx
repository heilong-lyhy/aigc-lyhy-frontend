// src/pages/admin/admin-category-manager-page.tsx

import { useCallback } from 'react';

import { useAdminCategories } from '@/features/blog';

import { CategoryManager } from './category-manager';

export function AdminCategoryManagerPage() {
  const { data, isLoading, create, update, remove } = useAdminCategories({ autoLoad: true });

  const handleCreate = useCallback(
    (input: { readonly name: string; readonly slug: string; readonly parentId?: string }) => {
      void create({
        name: input.name,
        slug: input.slug,
        parentId: input.parentId ? Number(input.parentId) : undefined,
      });
    },
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, input: { readonly name?: string; readonly slug?: string }) => {
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

  const handleReorder = useCallback(
    (id: string, parentId: string | null, sortOrder: number) => {
      void update({
        id: Number(id),
        parentId: parentId ? Number(parentId) : null,
        sortOrder,
      });
    },
    [update],
  );

  return (
    <CategoryManager
      categories={data}
      isLoading={isLoading}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onReorder={handleReorder}
      onUpdate={handleUpdate}
    />
  );
}
