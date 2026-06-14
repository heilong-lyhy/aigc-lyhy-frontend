// src/pages/admin/admin-post-list-page.tsx

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAdminPosts, useBlogCategories } from '@/features/blog';

import type { BlogPostStatus, PaginationInput } from '@/entities/blog';
import { toPaginationInput } from '@/entities/blog';

import { PostList } from './post-list';

const USE_MOCK_FALLBACK = false;
const DEFAULT_PAGE_SIZE = 10;

export function AdminPostListPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationInput>(
    toPaginationInput(1, DEFAULT_PAGE_SIZE),
  );
  const [filterStatus, setFilterStatus] = useState<BlogPostStatus | undefined>();
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();

  const { data, isLoading, remove, update } = useAdminPosts({
    pagination,
    status: filterStatus,
    autoLoad: true,
  });

  const { data: categories = [] } = useBlogCategories({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const handleEdit = useCallback(
    (id: string) => {
      navigate(id === 'new' ? '/admin/posts/new' : `/admin/posts/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(Number(id));
    },
    [remove],
  );

  const handleTogglePublish = useCallback(
    async (id: string, status: BlogPostStatus) => {
      await update({ id: Number(id), status });
    },
    [update],
  );

  const handleTogglePin = useCallback(
    async (id: string, isPinned: boolean) => {
      await update({ id: Number(id), isPinned });
    },
    [update],
  );

  return (
    <PostList
      categories={categories}
      data={data}
      filterCategoryId={filterCategoryId}
      filterStatus={filterStatus}
      isLoading={isLoading}
      pagination={pagination}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onFilterCategoryChange={setFilterCategoryId}
      onFilterStatusChange={setFilterStatus}
      onPaginationChange={setPagination}
      onTogglePublish={handleTogglePublish}
      onTogglePin={handleTogglePin}
    />
  );
}
