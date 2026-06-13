// src/features/blog/ui/like-button.tsx

import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { useLike } from '../application/use-like';

type LikeButtonProps = {
  readonly postId: number;
  readonly userIdentifier: string;
  readonly initialLikeCount?: number;
  readonly size?: 'small' | 'middle' | 'large';
};

const LABEL_LIKE = '点赞';
const LABEL_LIKED = '已赞';

export function LikeButton({
  postId,
  userIdentifier,
  initialLikeCount = 0,
  size = 'middle',
}: LikeButtonProps) {
  const { liked, isLoading, mutationError, likeCountDelta, toggle } = useLike({
    postId,
    userIdentifier,
    autoCheck: postId > 0,
  });

  const displayCount = initialLikeCount + likeCountDelta;

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
