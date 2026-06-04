// src/features/blog/ui/tag-cloud.tsx

import { Tag } from 'antd';

import type { BlogTag } from '@/entities/blog';

type TagCloudProps = {
  readonly tags: readonly BlogTag[];
  readonly selectedTagId?: string;
  readonly onSelect?: (tagId: string | undefined) => void;
};

export function TagCloud({ tags, selectedTagId, onSelect }: TagCloudProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="tag-cloud">
      {tags.map((tag) => (
        <Tag
          color={tag.id === selectedTagId ? 'blue' : undefined}
          key={tag.id}
          role="listitem"
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect?.(tag.id === selectedTagId ? undefined : tag.id)}
        >
          {tag.name} ({tag.postCount})
        </Tag>
      ))}
    </div>
  );
}
