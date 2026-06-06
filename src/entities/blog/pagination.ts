// src/entities/blog/pagination.ts

// 当前仅 blog 业务消费；若未来其他 feature 也使用 offset/limit 分页，应迁移至 shared/pagination/

/** 通用分页输入（offset/limit 风格，与后端对齐） */
export interface PaginationInput {
  readonly offset: number;
  readonly limit: number;
}

/** 通用分页输出 */
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

/** 从 offset/limit 计算当前页码（1-based） */
export function toCurrentPage(pagination: PaginationInput): number {
  return Math.floor(pagination.offset / pagination.limit) + 1;
}

/** 从页码和每页条数计算 offset/limit */
export function toPaginationInput(page: number, pageSize: number): PaginationInput {
  return { offset: (page - 1) * pageSize, limit: pageSize };
}

/**
 * 计算分页组件需要的有效 total。
 * 当 hasMore=true 时，AntD Pagination 需要比实际 total 多 1 才能显示"下一页"按钮。
 */
export function toEffectiveTotal(total: number, hasMore: boolean): number {
  return hasMore ? total + 1 : total;
}

/** 判断分页结果是否为空（数据已加载、无错误、列表为空） */
export function isEmptyPage<T>(data: PaginatedResult<T> | null, isLoading: boolean, error: string | null): boolean {
  return data !== null && data.items.length === 0 && !isLoading && !error;
}
