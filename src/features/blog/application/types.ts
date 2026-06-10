// src/features/blog/application/types.ts

/** 从 Markdown 内容中提取的目录条目 */
export type TocItem = {
  readonly id: string;
  readonly text: string;
  readonly level: number;
};
