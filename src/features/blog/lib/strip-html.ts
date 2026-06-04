// src/features/blog/lib/strip-html.ts

/** 前端 XSS 防护：剥离 HTML 标签 */
export const stripHtml = (input: string): string => input.replace(/<[^>]*>/g, '');
