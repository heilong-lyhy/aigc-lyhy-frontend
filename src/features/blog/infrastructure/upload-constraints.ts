// src/features/blog/infrastructure/upload-constraints.ts

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
