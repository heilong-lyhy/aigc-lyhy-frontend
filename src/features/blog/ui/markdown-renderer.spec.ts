// src/features/blog/ui/markdown-renderer.spec.ts

import { describe, expect, it } from 'vitest';

import { extractToc } from '../application/extract-toc';

describe('extractToc', () => {
  it('extracts headings from markdown content', () => {
    const content = '# Title\n## Section 1\n### Subsection\n## Section 2';
    const items = extractToc(content);

    expect(items).toEqual([
      { id: 'title', text: 'Title', level: 1 },
      { id: 'section-1', text: 'Section 1', level: 2 },
      { id: 'subsection', text: 'Subsection', level: 3 },
      { id: 'section-2', text: 'Section 2', level: 2 },
    ]);
  });

  it('returns empty array for content without headings', () => {
    const content = 'Just some text\nwith no headings';
    expect(extractToc(content)).toEqual([]);
  });

  it('deduplicates identical heading text via slugger', () => {
    const content = '# Intro\n## Details\n## Details';
    const items = extractToc(content);

    expect(items[1].id).toBe('details');
    expect(items[2].id).toBe('details-1');
  });

  it('ignores non-heading lines that start with #', () => {
    const content = 'Not a heading # fake\n# Real Heading';
    const items = extractToc(content);

    expect(items).toHaveLength(1);
    expect(items[0].text).toBe('Real Heading');
  });

  it('handles all heading levels h1-h6', () => {
    const content = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const items = extractToc(content);

    expect(items.map((i) => i.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
