// src/labs/blog-admin/lib/status-options.ts

import type { BlogPostStatus } from '@/entities/blog';

const LABEL_DRAFT = '草稿';
const LABEL_PUBLISHED = '已发布';
const LABEL_ARCHIVED = '已归档';
const LABEL_DELETED = '已删除';

export const STATUS_OPTIONS: readonly { readonly label: string; readonly value: BlogPostStatus }[] = [
  { label: LABEL_DRAFT, value: 'draft' },
  { label: LABEL_PUBLISHED, value: 'published' },
  { label: LABEL_ARCHIVED, value: 'archived' },
  { label: LABEL_DELETED, value: 'deleted' },
];
