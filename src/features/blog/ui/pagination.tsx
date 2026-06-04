// src/features/blog/ui/pagination.tsx

import { Pagination as AntPagination } from 'antd';

import type { PaginationInput } from '@/entities/blog';
import { toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

type PaginationProps = {
  readonly pagination: PaginationInput;
  readonly total: number;
  readonly hasMore: boolean;
  readonly onChange: (pagination: PaginationInput) => void;
};

const PAGE_SIZE_OPTIONS = [6, 12, 24];

export function Pagination({ pagination, total, hasMore, onChange }: PaginationProps) {
  const currentPage = toCurrentPage(pagination);
  const effectiveTotal = toEffectiveTotal(total, hasMore);

  function handleChange(page: number, pageSize: number) {
    onChange(toPaginationInput(page, pageSize));
  }

  return (
    <nav aria-label="pagination">
      <AntPagination
        current={currentPage}
        pageSize={pagination.limit}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showSizeChanger
        showTotal={(t, range) => `${range[0]}-${range[1]} / ${t}`}
        total={effectiveTotal}
        onChange={handleChange}
        onShowSizeChange={handleChange}
      />
    </nav>
  );
}
