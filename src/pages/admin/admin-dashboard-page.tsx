// src/pages/admin/admin-dashboard-page.tsx

import { useBlogDashboard, useBlogTags } from '@/features/blog';

import { DashboardPage } from './dashboard';

const USE_MOCK_FALLBACK = false;

export function AdminDashboardPage() {
  const { data, isLoading, error } = useBlogDashboard({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });
  const { data: tags, isLoading: isTagsLoading } = useBlogTags({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  if (isLoading || isTagsLoading) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  return <DashboardPage data={data} tagCount={tags.length} />;
}
