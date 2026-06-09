// src/features/blog/ui/comment-fields.tsx

import { Form, Input } from 'antd';
import type { ReactNode } from 'react';

type CommentFieldsProps = {
  readonly nameLabel?: string;
  readonly emailLabel?: string;
  readonly emailExtra?: ReactNode;
  readonly contentPlaceholder?: string;
  readonly contentRows?: number;
};

const DEFAULT_NAME_LABEL = '昵称';
const DEFAULT_EMAIL_LABEL = '邮箱';
const DEFAULT_CONTENT_PLACEHOLDER = '写下您的评论…';
const DEFAULT_CONTENT_ROWS = 4;

export function CommentFields({
  nameLabel = DEFAULT_NAME_LABEL,
  emailLabel = DEFAULT_EMAIL_LABEL,
  emailExtra,
  contentPlaceholder = DEFAULT_CONTENT_PLACEHOLDER,
  contentRows = DEFAULT_CONTENT_ROWS,
}: CommentFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Form.Item
          label={nameLabel}
          name="authorName"
          rules={[{ message: '请输入昵称', required: true }]}
        >
          <Input maxLength={50} />
        </Form.Item>

        <Form.Item
          extra={emailExtra}
          label={emailLabel}
          name="authorEmail"
          rules={[
            { message: '请输入邮箱', required: true },
            { message: '邮箱格式不正确', type: 'email' },
          ]}
        >
          <Input maxLength={100} />
        </Form.Item>
      </div>

      <Form.Item
        name="content"
        rules={[{ message: '请输入内容', required: true }]}
      >
        <Input.TextArea maxLength={2000} placeholder={contentPlaceholder} rows={contentRows} />
      </Form.Item>
    </>
  );
}
