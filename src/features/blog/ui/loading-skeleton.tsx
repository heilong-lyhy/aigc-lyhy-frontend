// src/features/blog/ui/loading-skeleton.tsx

import { Card, Skeleton } from 'antd';

const SKELETON_CARD_COUNT = 6;

export function LoadingSkeleton() {
  return (
    <div className="card-grid" role="status" aria-label="loading">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
        <Card key={i}>
          <Skeleton active avatar={false} paragraph={{ rows: 3 }} title />
        </Card>
      ))}
    </div>
  );
}
