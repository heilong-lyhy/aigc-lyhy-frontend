// @vitest-environment happy-dom
// src/features/blog/ui/post-error-boundary.spec.tsx

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PostErrorBoundary } from './post-error-boundary';

function ThrowingChild({ shouldThrow }: { readonly shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Child content</div>;
}

describe('PostErrorBoundary', () => {
  const originalError = console.error;

  beforeEach(() => {
    // Suppress React error boundary console noise
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Test error message')) return;
      if (typeof args[0] === 'string' && args[0].includes('Boom')) return;
      if (typeof args[0] === 'string' && args[0].includes('The above error occurred')) return;
      originalError.call(console, ...args);
    };
  });

  afterEach(() => {
    cleanup();
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <PostErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </PostErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('shows error alert when child throws', () => {
    render(
      <PostErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </PostErrorBoundary>,
    );

    expect(screen.getByText('Test error message')).toBeTruthy();
    expect(screen.getByText('页面渲染出错')).toBeTruthy();
  });

  it('resets error state when retry button is clicked', async () => {
    const user = userEvent.setup();

    let shouldThrow = true;

    function ControlledChild() {
      if (shouldThrow) throw new Error('Boom');
      return <div>Recovered</div>;
    }

    render(
      <PostErrorBoundary>
        <ControlledChild />
      </PostErrorBoundary>,
    );

    // Error boundary should show the error
    expect(screen.getByText('Boom')).toBeTruthy();

    // Fix the child before clicking retry
    shouldThrow = false;

    const retryButton = screen.getByRole('button', { name: '重新加载' });
    await user.click(retryButton);

    // After retry, children should render normally
    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});
