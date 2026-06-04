// @vitest-environment happy-dom
// src/features/blog/ui/markdown-renderer.component.spec.tsx

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownRenderer } from './markdown-renderer';

describe('MarkdownRenderer (component)', () => {
  it('renders markdown text as HTML', () => {
    render(<MarkdownRenderer content="Hello **world**" />);

    expect(screen.getByText('world')).toBeTruthy();
  });

  it('renders links with target="_blank" and rel="noopener noreferrer"', () => {
    render(<MarkdownRenderer content="[Example](https://example.com)" />);

    const link = screen.getByRole('link', { name: 'Example' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('calls onTocReady with extracted headings', () => {
    const onTocReady = vi.fn();
    // Use template literal with real newlines to ensure heading parsing works
    const content = `# Title
## Section`;

    render(<MarkdownRenderer content={content} onTocReady={onTocReady} />);

    expect(onTocReady).toHaveBeenCalledWith([
      { id: 'title', text: 'Title', level: 1 },
      { id: 'section', text: 'Section', level: 2 },
    ]);
  });

  it('renders inline code using Ant Design Text', () => {
    render(<MarkdownRenderer content="Use `console.log` to debug" />);

    expect(screen.getByText('console.log')).toBeTruthy();
  });

  it('sanitizes malicious content via DOMPurify', () => {
    const xss = '<img src=x onerror="alert(1)">';
    const { container } = render(<MarkdownRenderer content={xss} />);

    const img = container.querySelector('img');
    // DOMPurify should strip the onerror; getAttribute returns null or undefined when absent
    expect(img?.getAttribute('onerror') ?? null).toBeNull();
  });
});
