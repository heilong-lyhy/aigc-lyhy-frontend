// src/features/blog/ui/like-button.tsx

import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import type { BlogLikeTargetType } from '@/entities/blog';

import { useLike } from '../hooks/use-like';

type LikeButtonProps = {
  readonly targetType: BlogLikeTargetType;
  readonly targetId: string;
  readonly initialLikeCount?: number;
  readonly fingerprint?: string;
  readonly size?: 'small' | 'middle' | 'large';
};

const LABEL_LIKE = '点赞';
const LABEL_LIKED = '已赞';

export function LikeButton({
  targetType,
  targetId,
  initialLikeCount = 0,
  fingerprint,
  size = 'middle',
}: LikeButtonProps) {
  const { liked, isLoading, mutationError, toggle } = useLike({
    targetType,
    targetId,
    fingerprint,
    autoCheck: targetId !== '',
  });

  const displayCount = initialLikeCount + (liked ? 1 : 0);

  return (
    <Tooltip title={mutationError}>
      <Button
        danger={liked}
        icon={liked ? <HeartFilled /> : <HeartOutlined />}
        loading={isLoading}
        size={size}
        type={liked ? 'primary' : 'default'}
        onClick={() => void toggle()}
      >
        {liked ? LABEL_LIKED : LABEL_LIKE}{displayCount > 0 ? ` (${displayCount})` : ''}
      </Button>
    </Tooltip>
  );
}
