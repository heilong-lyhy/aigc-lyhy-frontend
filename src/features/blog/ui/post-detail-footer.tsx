// src/features/blog/ui/post-detail-footer.tsx

import { HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';

type PostDetailFooterProps = {
  readonly likeCount: number;
  readonly liked: boolean;
  readonly onToggleLike?: () => void;
  readonly onShare?: () => void;
};

const LABEL_LIKE = '点赞';
const LABEL_LIKED = '已赞';
const LABEL_SHARE = '分享';

export function PostDetailFooter({
  likeCount,
  liked,
  onToggleLike,
  onShare,
}: PostDetailFooterProps) {
  return (
    <footer className="flex items-center justify-between">
      <Space size="middle">
        <Button
          icon={<HeartOutlined />}
          type={liked ? 'primary' : 'default'}
          onClick={onToggleLike}
        >
          {liked ? LABEL_LIKED : LABEL_LIKE} ({likeCount})
        </Button>
      </Space>

      {onShare && (
        <Tooltip title={LABEL_SHARE}>
          <Button icon={<ShareAltOutlined />} onClick={onShare} />
        </Tooltip>
      )}
    </footer>
  );
}
