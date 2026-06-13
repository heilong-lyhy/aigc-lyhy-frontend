// src/features/blog/ui/comment-form.tsx

import { useCallback } from 'react';
import { Button, Form, Modal, Typography } from 'antd';

import { stripHtml } from '../application/strip-html';
import { useComment } from '../application/use-comment';

import { CommentFields } from './comment-fields';
import { useLoginPrompt } from './use-login-prompt';

type CommentFormProps = {
  readonly postId: string;
  readonly isAuthenticated: boolean;
  readonly onSuccess?: () => void;
};

type CommentFormValues = {
  content: string;
};

const { Text } = Typography;
const LABEL_SUBMIT = '提交评论';
const LABEL_SUBMITTING = '提交中…';
const LOGIN_PROMPT_MESSAGE = '登录后即可发表评论';

export function CommentForm({ postId, isAuthenticated, onSuccess }: CommentFormProps) {
  const [form] = Form.useForm<CommentFormValues>();
  const { isSubmitting, error, submitCommentByUser } = useComment();
  const {
    loginModalOpen,
    loginPromptTitle,
    loginButtonText,
    loginPromptMessage,
    handleFocus: openLoginModal,
    handleLoginRedirect,
    closeLoginModal,
  } = useLoginPrompt({ message: LOGIN_PROMPT_MESSAGE });

  const handleFocus = useCallback(() => {
    if (!isAuthenticated) {
      openLoginModal();
    }
  }, [isAuthenticated, openLoginModal]);

  const handleSubmit = useCallback(
    async (values: CommentFormValues) => {
      const result = await submitCommentByUser({
        postId: Number(postId),
        content: stripHtml(values.content.trim()),
      });

      if (result) {
        form.resetFields();
        onSuccess?.();
      }
    },
    [postId, submitCommentByUser, form, onSuccess],
  );

  return (
    <>
      <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v)}>
        <CommentFields onFocus={handleFocus} />

        {error && (
          <div className="mb-2">
            <Text type="danger">{error}</Text>
          </div>
        )}

        <Form.Item>
          <Button disabled={!isAuthenticated} htmlType="submit" loading={isSubmitting} type="primary">
            {isSubmitting ? LABEL_SUBMITTING : LABEL_SUBMIT}
          </Button>
        </Form.Item>
      </Form>

      <Modal
        cancelText="取消"
        okText={loginButtonText}
        open={loginModalOpen}
        title={loginPromptTitle}
        onCancel={closeLoginModal}
        onOk={handleLoginRedirect}
      >
        <Text>{loginPromptMessage}</Text>
      </Modal>
    </>
  );
}
