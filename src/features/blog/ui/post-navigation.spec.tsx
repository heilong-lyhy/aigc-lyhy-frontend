// @vitest-environment happy-dom
// src/features/blog/ui/post-navigation.spec.tsx

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PostNavigationItem } from '@/entities/blog';

// Mock react-router Link
vi.mock('react-router', () => ({
  Link: ({ to, children }: { readonly to: string; readonly children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

import { PostNavigation } from './post-navigation';

const prevPost: PostNavigationItem = {
  id: '1',
  title: 'Previous Article',
  slug: 'previous-article',
};

const nextPost: PostNavigationItem = {
  id: '2',
  title: 'Next Article',
  slug: 'next-article',
};

afterEach(() => {
  cleanup();
});

describe('PostNavigation', () => {
  it('renders nothing when both prevPost and nextPost are undefined', () => {
    const { container } = render(<PostNavigation />);

    expect(container.innerHTML).toBe('');
  });

  it('renders prev link with correct href and title', () => {
    render(<PostNavigation prevPost={prevPost} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/blog/previous-article');
    expect(screen.getByText('Previous Article')).toBeTruthy();
    expect(screen.getByText('上一篇')).toBeTruthy();
  });

  it('renders next link with correct href and title', () => {
    render(<PostNavigation nextPost={nextPost} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/blog/next-article');
    expect(screen.getByText('Next Article')).toBeTruthy();
    expect(screen.getByText('下一篇')).toBeTruthy();
  });

  it('renders both prev and next links', () => {
    render(<PostNavigation prevPost={prevPost} nextPost={nextPost} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/blog/previous-article');
    expect(links[1].getAttribute('href')).toBe('/blog/next-article');
  });

  it('renders nav element', () => {
    render(<PostNavigation prevPost={prevPost} nextPost={nextPost} />);

    expect(screen.getByRole('navigation')).toBeTruthy();
  });
});
