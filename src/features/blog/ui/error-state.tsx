// src/features/blog/ui/error-state.tsx

import { Alert, Button } from 'antd';

type ErrorStateProps = {
  readonly error: string;
  readonly onRetry?: () => void;
};

const RETRY_LABEL = '重试';

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert
      description={error}
      showIcon
      type="error"
      action={
        onRetry ? (
          <Button onClick={onRetry} size="small" type="primary">
            {RETRY_LABEL}
          </Button>
        ) : undefined
      }
    />
  );
}
