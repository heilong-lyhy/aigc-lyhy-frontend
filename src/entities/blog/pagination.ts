// src/entities/blog/pagination.ts

// 当前仅 blog 业务消费；若未来其他 feature 也使用 page/pageSize 分页，应迁移至 shared/pagination/

/** 通用分页输入（page/pageSize 风格，与后端对齐） */
export interface PaginationInput {
  readonly page: number;
  readonly pageSize: number;
}

/** 通用分页输出（与后端 BlogPostsListResponse / BlogCommentsListResponse 对齐） */
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly current: number;
  readonly pageSize: number;
}

/** 从页码和每页条数构造分页输入 */
export function toPaginationInput(page: number, pageSize: number): PaginationInput {
  return { page, pageSize };
}

/** 计算分页组件需要的有效 total */
export function toEffectiveTotal(total: number): number {
  return total;
}

/** 获取当前页码（page/pageSize 模式下直接返回 page） */
export function toCurrentPage(pagination: PaginationInput): number {
  return pagination.page;
}

/** 判断分页结果是否为空（数据已加载、无错误、列表为空） */
export function isEmptyPage<T>(data: PaginatedResult<T> | null, isLoading: boolean, error: string | null): boolean {
  return data !== null && data.items.length === 0 && !isLoading && !error;
}
