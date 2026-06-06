// src/labs/blog-admin/lib/status-options.ts

import type { BlogPostStatus } from '@/entities/blog';

export const STATUS_OPTIONS: readonly { readonly label: string; readonly value: BlogPostStatus }[] = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];
