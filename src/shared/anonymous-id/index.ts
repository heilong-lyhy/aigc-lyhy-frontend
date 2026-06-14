// src/shared/anonymous-id/index.ts

const STORAGE_KEY = 'blog-anonymous-id';

/**
 * 获取或生成匿名用户标识符。
 * 已登录用户应使用 `user:{accountId}`，此函数仅供未登录用户使用。
 * 标识符持久化在 localStorage 中，同一浏览器会保持一致。
 */
export function getAnonymousId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    // Storage can be unavailable in restricted browsers.
  }

  const id = `anon:${crypto.randomUUID()}`;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage can be unavailable in restricted browsers.
  }

  return id;
}
