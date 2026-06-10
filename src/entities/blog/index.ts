// src/entities/blog/index.ts

// ── 上传校验常量（blog domain 的业务约束，非 infrastructure） ──

/** 通用文件上传允许的 MIME 类型 */
export const ALLOWED_FILE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/** 封面图上传允许的 MIME 类型（子集） */
export const ALLOWED_COVER_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** 文件大小上限（字节） */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** 文件大小上限（MB，用于提示文案） */
export const MAX_FILE_SIZE_MB = 5;

// ── 类型与工具 ──

export { formatRelativeDate } from './format-date';
export type { YearMonthGroup } from './group-by-date';
export { formatAbsoluteDate, groupByYearMonth } from './group-by-date';
export type { PaginatedResult, PaginationInput } from './pagination';
export { isEmptyPage, toCurrentPage, toEffectiveTotal, toPaginationInput } from './pagination';
export type {
  BlogCategory,
  BlogComment,
  BlogCommentStatus,
  BlogDashboard,
  BlogFile,
  BlogFriendLink,
  BlogLike,
  BlogPost,
  BlogPostDetail,
  BlogPostStatus,
  BlogProfile,
  BlogTag,
  PostEditorForm,
  PostNavigationItem,
} from './types';
