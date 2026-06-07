// src/labs/blog-admin/ui/post-list.tsx

import { useMemo } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogCategory, BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

import { STATUS_OPTIONS } from '../lib/status-options';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '文章管理';
const LABEL_CREATE = '新建文章';
const LABEL_COL_TITLE = '标题';
const LABEL_COL_STATUS = '状态';
const LABEL_COL_CATEGORY = '分类';
const LABEL_COL_DATE = '日期';
const LABEL_COL_ACTIONS = '操作';
const LABEL_EDIT = '编辑';
const LABEL_UNPUBLISH = '取消发布';
const LABEL_PUBLISH = '发布';
const LABEL_DELETE = '删除';
const LABEL_CONFIRM_DELETE = '确定删除这篇文章？';
const LABEL_FILTER_STATUS = '按状态筛选';
const LABEL_FILTER_CATEGORY = '按分类筛选';

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
      title: LABEL_COL_TITLE,
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: LABEL_COL_STATUS,
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BlogPostStatus) => renderStatusTag(status),
    },
    {
      title: LABEL_COL_CATEGORY,
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 120,
      render: (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name ?? '-';
      },
    },
    {
      title: LABEL_COL_DATE,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: LABEL_COL_ACTIONS,
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
            {LABEL_EDIT}
          </Button>
          {record.status === 'published' ? (
            <Button
              size="small"
              type="link"
              onClick={() => onTogglePublish(record.id, 'draft')}
            >
              {LABEL_UNPUBLISH}
            </Button>
          ) : (
            <Button
              size="small"
              type="link"
              onClick={() => onTogglePublish(record.id, 'published')}
            >
              {LABEL_PUBLISH}
            </Button>
          )}
          <Popconfirm
            title={LABEL_CONFIRM_DELETE}
            onConfirm={() => onDelete(record.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              type="link"
            >
              {LABEL_DELETE}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [categories, onEdit, onDelete, onTogglePublish]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="blog-typography-no-margin">
          <Title level={3}>
            {LABEL_PAGE_TITLE}
          </Title>
        </div>
        <Button type="primary" onClick={() => onEdit('new')}>
          {LABEL_CREATE}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="w-35">
          <Select
            allowClear
            placeholder={LABEL_FILTER_STATUS}
            value={filterStatus}
            onChange={(value) => onFilterStatusChange(value ?? undefined)}
            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </div>
        <div className="w-40">
          <Select
            allowClear
            placeholder={LABEL_FILTER_CATEGORY}
            value={filterCategoryId}
            onChange={(value) => onFilterCategoryChange(value ?? undefined)}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </div>
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
