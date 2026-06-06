// src/features/blog/lib/strip-html.spec.ts

import { describe, expect, it } from 'vitest';

import { stripHtml } from './strip-html';

describe('stripHtml', () => {
  it('removes HTML tags from string', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('No tags here')).toBe('No tags here');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1Line 2');
  });

  it('handles tags with attributes', () => {
    expect(stripHtml('<a href="https://example.com">Link</a>')).toBe('Link');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles string with only tags', () => {
    expect(stripHtml('<div><span></span></div>')).toBe('');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><em>Text</em></p></div>')).toBe('Text');
  });

  it('removes content between angle brackets (regex limitation)', () => {
    // stripHtml uses a simple regex that matches any <...> pattern,
    // so non-HTML angle brackets like "1 < 2" are also stripped.
    // This is acceptable for the XSS-prevention use case.
    expect(stripHtml('1 < 2 && 3 > 1')).toBe('1  1');
  });
});
