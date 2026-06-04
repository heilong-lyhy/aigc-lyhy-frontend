// src/features/blog/ui/comment-item.tsx

import { MessageOutlined } from '@ant-design/icons';
import { Avatar, Button, Typography } from 'antd';

import type { BlogComment } from '@/entities/blog';
import { formatRelativeDate } from '@/entities/blog';

type CommentItemProps = {
  readonly comment: BlogComment;
  readonly onReply?: (comment: BlogComment) => void;
};

const { Text } = Typography;
const LABEL_REPLY = '回复';

export function CommentItem({ comment, onReply }: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <Avatar alt={comment.authorName} size="small" src={comment.authorAvatar}>
        {comment.authorName.charAt(0) || 'U'}
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Text strong>{comment.authorName}</Text>
          <Text type="secondary">
            <time dateTime={comment.createdAt}>{formatRelativeDate(comment.createdAt)}</time>
          </Text>
        </div>

        <Text>{comment.content}</Text>

        {onReply && (
          <div>
            <Button
              icon={<MessageOutlined />}
              size="small"
              type="text"
              onClick={() => onReply(comment)}
            >
              {LABEL_REPLY}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
