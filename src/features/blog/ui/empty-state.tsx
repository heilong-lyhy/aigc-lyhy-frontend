// src/features/blog/ui/empty-state.tsx

import { Empty } from 'antd';

type EmptyStateProps = {
  readonly description?: string;
};

const DEFAULT_DESCRIPTION = '暂无文章';

export function EmptyState({ description = DEFAULT_DESCRIPTION }: EmptyStateProps) {
  return <Empty description={description} />;
}
