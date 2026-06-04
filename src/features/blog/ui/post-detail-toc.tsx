// src/features/blog/ui/post-detail-toc.tsx

import { Anchor } from 'antd';

import type { TocItem } from '../lib/types';

type PostDetailTocProps = {
  readonly items: readonly TocItem[];
};

const LABEL_TOC_TITLE = '目录';

export function PostDetailToc({ items }: PostDetailTocProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={LABEL_TOC_TITLE}>
      <Anchor
        items={items.map((item) => ({
          key: item.id,
          href: `#${item.id}`,
          title: item.text,
        }))}
        offsetTop={80}
      />
    </nav>
  );
}
