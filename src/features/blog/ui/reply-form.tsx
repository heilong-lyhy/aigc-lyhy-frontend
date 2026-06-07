// src/features/blog/ui/reply-form.tsx

import { useCallback } from 'react';
import { Button, Form, Typography } from 'antd';

import type { BlogComment } from '@/entities/blog';

import { useComment } from '../application/use-comment';
import { stripHtml } from '../lib/strip-html';

import { CommentFields } from './comment-fields';

type ReplyFormProps = {
  readonly postId: string;
  readonly parentComment: BlogComment;
  readonly onCancel: () => void;
  readonly onSuccess?: () => void;
};

type ReplyFormValues = {
  authorName: string;
  authorEmail: string;
  content: string;
};

const { Text } = Typography;
const LABEL_SUBMIT = '回复';
const LABEL_SUBMITTING = '提交中…';
const LABEL_CANCEL = '取消';

export function ReplyForm({ postId, parentComment, onCancel, onSuccess }: ReplyFormProps) {
  const [form] = Form.useForm<ReplyFormValues>();
  const { isSubmitting, error, submitComment } = useComment();

  const handleSubmit = useCallback(
    async (values: ReplyFormValues) => {
      const result = await submitComment({
        postId,
        authorName: stripHtml(values.authorName.trim()),
        authorEmail: stripHtml(values.authorEmail.trim()),
        content: stripHtml(values.content.trim()),
        parentId: parentComment.id,
        replyToId: parentComment.replyToId ?? parentComment.id,
      });

      if (result) {
        form.resetFields();
        onSuccess?.();
      }
    },
    [postId, parentComment, submitComment, form, onSuccess],
  );

  return (
    <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v)}>
      <CommentFields contentPlaceholder="写下您的回复…" contentRows={3} />

      {error && (
        <div className="mb-2">
          <Text type="danger">{error}</Text>
        </div>
      )}

      <Form.Item>
        <div className="flex gap-2">
          <Button htmlType="submit" loading={isSubmitting} size="small" type="primary">
            {isSubmitting ? LABEL_SUBMITTING : LABEL_SUBMIT}
          </Button>
          <Button onClick={onCancel} size="small">
            {LABEL_CANCEL}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}
