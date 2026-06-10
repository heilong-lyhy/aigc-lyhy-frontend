// src/labs/blog-admin/ui/post-trash.tsx

import { useMemo } from 'react';
import { DeleteOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Empty, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogPost, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '回收站';
const LABEL_COL_TITLE = '标题';
const LABEL_COL_DELETED_DATE = '删除时间';
const LABEL_COL_ACTIONS = '操作';
const LABEL_RESTORE = '恢复';
const LABEL_PERMANENT_DELETE = '永久删除';
const LABEL_CONFIRM_RESTORE = '确定恢复这篇文章？';
const LABEL_CONFIRM_PERMANENT_DELETE = '确定永久删除这篇文章？此操作不可恢复';
const LABEL_EMPTY = '回收站为空';

type PostTrashProps = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly pagination: PaginationInput;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onRestore: (id: string) => void;
  readonly onPermanentDelete: (id: string) => void;
};

export function PostTrash({
  data,
  isLoading,
  pagination,
  onPaginationChange,
  onRestore,
  onPermanentDelete,
}: PostTrashProps) {
  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogPost> = useMemo(
    () => [
      {
        title: LABEL_COL_TITLE,
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: LABEL_COL_DELETED_DATE,
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        render: (date: string) => formatAbsoluteDate(date),
      },
      {
        title: LABEL_COL_ACTIONS,
        key: 'actions',
        width: 200,
        render: (_, record) => (
          <Space size="small">
            <Popconfirm title={LABEL_CONFIRM_RESTORE} onConfirm={() => onRestore(record.id)}>
              <Button icon={<UndoOutlined />} size="small" type="link">
                {LABEL_RESTORE}
              </Button>
            </Popconfirm>
            <Popconfirm title={LABEL_CONFIRM_PERMANENT_DELETE} onConfirm={() => onPermanentDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />} size="small" type="link">
                {LABEL_PERMANENT_DELETE}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onRestore, onPermanentDelete],
  );

  if (data !== null && !isLoading && items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="blog-typography-no-margin">
          <Title level={3}>{LABEL_PAGE_TITLE}</Title>
        </div>
        <Empty description={LABEL_EMPTY} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="blog-typography-no-margin">
        <Title level={3}>{LABEL_PAGE_TITLE}</Title>
      </div>
      <Table<BlogPost>
        columns={columns}
        dataSource={[...items]}
        loading={isLoading}
        pagination={{
          current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: false,
          onChange: (page) => onPaginationChange(toPaginationInput(page, pagination.pageSize)),
        }}
        rowKey="id"
      />
    </div>
  );
}
