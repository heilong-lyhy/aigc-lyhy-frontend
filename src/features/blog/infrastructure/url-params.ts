// src/features/blog/infrastructure/url-params.ts
// 博客首页筛选参数的 URL 序列化/反序列化
// 收束规则：URL search params 的解析、读取、回写实现属于 infrastructure

const QUERY_KEY_CATEGORY = 'category';
const QUERY_KEY_TAG = 'tag';

export type BlogFilterParams = {
  readonly categoryId?: number;
  readonly tagId?: number;
};

/** 筛选参数更新：null 表示清除，undefined 表示不更新 */
export type BlogFilterUpdates = {
  readonly categoryId?: number | null;
  readonly tagId?: number | null;
};

/** 从 URLSearchParams 解析筛选参数 */
export function parseFilterParams(params: URLSearchParams): BlogFilterParams {
  return {
    categoryId: parseIntParam(params.get(QUERY_KEY_CATEGORY)),
    tagId: parseIntParam(params.get(QUERY_KEY_TAG)),
  };
}

/** 将筛选参数写入 URLSearchParams（返回新实例） */
export function applyFilterParams(
  prev: URLSearchParams,
  updates: BlogFilterUpdates,
): URLSearchParams {
  const next = new URLSearchParams(prev);

  if (updates.categoryId !== undefined) {
    if (updates.categoryId != null) {
      next.set(QUERY_KEY_CATEGORY, String(updates.categoryId));
    } else {
      next.delete(QUERY_KEY_CATEGORY);
    }
  }

  if (updates.tagId !== undefined) {
    if (updates.tagId != null) {
      next.set(QUERY_KEY_TAG, String(updates.tagId));
    } else {
      next.delete(QUERY_KEY_TAG);
    }
  }

  return next;
}

function parseIntParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
