// src/features/blog/ui/comment-fields.tsx

import { Form, Input } from 'antd';

type CommentFieldsProps = {
  readonly contentPlaceholder?: string;
  readonly contentRows?: number;
  readonly onFocus?: () => void;
};

const DEFAULT_CONTENT_PLACEHOLDER = '写下您的评论…';
const DEFAULT_CONTENT_ROWS = 4;

export function CommentFields({
  contentPlaceholder = DEFAULT_CONTENT_PLACEHOLDER,
  contentRows = DEFAULT_CONTENT_ROWS,
  onFocus,
}: CommentFieldsProps) {
  return (
    <Form.Item
      name="content"
      rules={[{ message: '请输入内容', required: true }]}
    >
      <Input.TextArea maxLength={2000} placeholder={contentPlaceholder} rows={contentRows} onFocus={onFocus} />
    </Form.Item>
  );
}
