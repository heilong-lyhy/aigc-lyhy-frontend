// src/features/blog/ui/comment-form.tsx

import { useCallback } from 'react';
import { Button, Form, Typography } from 'antd';

import { useComment } from '../application/use-comment';
import { stripHtml } from '../lib/strip-html';

import { CommentFields } from './comment-fields';

type CommentFormProps = {
  readonly postId: string;
  readonly onSuccess?: () => void;
};

type CommentFormValues = {
  authorName: string;
  authorEmail: string;
  content: string;
};

const { Text } = Typography;
const LABEL_SUBMIT = '提交评论';
const LABEL_SUBMITTING = '提交中…';

export function CommentForm({ postId, onSuccess }: CommentFormProps) {
  const [form] = Form.useForm<CommentFormValues>();
  const { isSubmitting, error, submitComment } = useComment();

  const handleSubmit = useCallback(
    async (values: CommentFormValues) => {
      const result = await submitComment({
        postId: Number(postId),
        authorName: stripHtml(values.authorName.trim()),
        authorEmail: stripHtml(values.authorEmail.trim()),
        content: stripHtml(values.content.trim()),
      });

      if (result) {
        form.resetFields();
        onSuccess?.();
      }
    },
    [postId, submitComment, form, onSuccess],
  );

  return (
    <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v)}>
      <CommentFields
        emailExtra={
          <Typography.Text type="secondary">
            头像将根据邮箱自动生成
          </Typography.Text>
        }
        emailLabel="您的邮箱（不会公开）"
        nameLabel="您的昵称"
      />

      {error && (
        <div className="mb-2">
          <Text type="danger">{error}</Text>
        </div>
      )}

      <Form.Item>
        <Button htmlType="submit" loading={isSubmitting} type="primary">
          {isSubmitting ? LABEL_SUBMITTING : LABEL_SUBMIT}
        </Button>
      </Form.Item>
    </Form>
  );
}
