// src/labs/blog-admin/ui/post-list.tsx

import { useMemo } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogCategory, BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

import { STATUS_OPTIONS } from '../lib/status-options';

const { Title } = Typography;

type PostListProps = {
  readonly data: PaginatedResult<BlogPost> | null;
  readonly isLoading: boolean;
  readonly categories: readonly BlogCategory[];
  readonly filterStatus: BlogPostStatus | undefined;
  readonly filterCategoryId: string | undefined;
  readonly pagination: PaginationInput;
  readonly onFilterStatusChange: (status: BlogPostStatus | undefined) => void;
  readonly onFilterCategoryChange: (categoryId: string | undefined) => void;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onEdit: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onTogglePublish: (id: string, status: BlogPostStatus) => void;
};

const STATUS_COLOR_MAP: Readonly<Record<BlogPostStatus, string>> = {
  draft: 'default',
  published: 'green',
  archived: 'orange',
};

function renderStatusTag(status: BlogPostStatus) {
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return <Tag color={STATUS_COLOR_MAP[status]}>{label}</Tag>;
}

export function PostList({
  data,
  isLoading,
  categories,
  filterStatus,
  filterCategoryId,
  pagination,
  onFilterStatusChange,
  onFilterCategoryChange,
  onPaginationChange,
  onEdit,
  onDelete,
  onTogglePublish,
}: PostListProps) {
  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total, data.hasMore) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogPost> = useMemo(() => [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BlogPostStatus) => renderStatusTag(status),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 120,
      render: (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name ?? '-';
      },
    },
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => onEdit(record.id)}
          >
            编辑
          </Button>
          {record.status === 'published' ? (
            <Button
              size="small"
              type="link"
              onClick={() => onTogglePublish(record.id, 'draft')}
            >
              取消发布
            </Button>
          ) : (
            <Button
              size="small"
              type="link"
              onClick={() => onTogglePublish(record.id, 'published')}
            >
              发布
            </Button>
          )}
          <Popconfirm
            title="确定删除这篇文章？"
            onConfirm={() => onDelete(record.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [categories, onEdit, onDelete, onTogglePublish]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3} style={{ margin: 0 }}>
          文章管理
        </Title>
        <Button type="primary" onClick={() => onEdit('new')}>
          新建文章
        </Button>
      </div>

      <div className="flex gap-3">
        <Select
          allowClear
          placeholder="按状态筛选"
          style={{ width: 140 }}
          value={filterStatus}
          onChange={(value) => onFilterStatusChange(value ?? undefined)}
          options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        />
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 160 }}
          value={filterCategoryId}
          onChange={(value) => onFilterCategoryChange(value ?? undefined)}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
      </div>

      <Table<BlogPost>
        columns={columns}
        dataSource={[...items]}
        loading={isLoading}
        pagination={{
          current,
          pageSize: pagination.limit,
          total,
          showSizeChanger: false,
          onChange: (page) => onPaginationChange(toPaginationInput(page, pagination.limit)),
        }}
        rowKey="id"
      />
    </div>
  );
}
