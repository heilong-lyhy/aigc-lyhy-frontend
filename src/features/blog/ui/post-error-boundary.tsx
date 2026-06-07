// src/features/blog/ui/post-error-boundary.tsx

import { Component, type ReactNode } from 'react';
import { Alert, Button, Typography } from 'antd';

type PostErrorBoundaryProps = {
  readonly children: ReactNode;
};

type PostErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

const LABEL_TITLE = '页面渲染出错';
const LABEL_RETRY = '重新加载';

export class PostErrorBoundary extends Component<
  PostErrorBoundaryProps,
  PostErrorBoundaryState
> {
  constructor(props: PostErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PostErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          description={
            <div className="blog-typography-no-margin">
              <Typography.Paragraph>
                {this.state.error?.message ?? LABEL_TITLE}
              </Typography.Paragraph>
            </div>
          }
          message={LABEL_TITLE}
          showIcon
          type="error"
          action={
            <Button onClick={this.handleRetry} size="small" type="primary">
              {LABEL_RETRY}
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
