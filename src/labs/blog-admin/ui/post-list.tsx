// src/labs/blog-admin/ui/post-list.tsx

import { useMemo } from 'react';
import { DeleteOutlined, EditOutlined, EllipsisOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogCategory, BlogPost, BlogPostStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

import { STATUS_OPTIONS } from '../lib/status-options';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '文章管理';
const LABEL_CREATE = '新建文章';
const LABEL_COL_TITLE = '标题';
const LABEL_PINNED = '置顶';
const LABEL_COL_STATUS = '状态';
const LABEL_COL_CATEGORY = '分类';
const LABEL_COL_DATE = '日期';
const LABEL_COL_ACTIONS = '操作';
const LABEL_PIN = '置顶';
const LABEL_UNPIN = '取消置顶';
const LABEL_EDIT = '编辑';
const LABEL_UNPUBLISH = '取消发布';
const LABEL_PUBLISH = '发布';
const LABEL_DELETE = '移入回收站';
const LABEL_CONFIRM_DELETE = '确定将这篇文章移入回收站？';
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
  readonly onTogglePin: (id: string, isPinned: boolean) => void;
};

const STATUS_COLOR_MAP: Readonly<Record<BlogPostStatus, string>> = {
  draft: 'default',
  published: 'green',
  archived: 'orange',
  deleted: 'red',
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
  onTogglePin,
}: PostListProps) {
  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogPost> = useMemo(() => [
    {
      title: LABEL_COL_TITLE,
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record) => (
        <span>
          {title}
          {record.isPinned && <span className="ml-1"><Tag color="blue">{LABEL_PINNED}</Tag></span>}
        </span>
      ),
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
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                icon: <EditOutlined />,
                key: 'edit',
                label: LABEL_EDIT,
                onClick: () => onEdit(record.id),
              },
              record.isPinned
                ? {
                    icon: <PushpinFilled />,
                    key: 'toggle-pin',
                    label: LABEL_UNPIN,
                    onClick: () => onTogglePin(record.id, false),
                  }
                : {
                    icon: <PushpinOutlined />,
                    key: 'toggle-pin',
                    label: LABEL_PIN,
                    onClick: () => onTogglePin(record.id, true),
                  },
              record.status === 'published'
                ? {
                    key: 'toggle-publish',
                    label: LABEL_UNPUBLISH,
                    onClick: () => onTogglePublish(record.id, 'draft'),
                  }
                : {
                    key: 'toggle-publish',
                    label: LABEL_PUBLISH,
                    onClick: () => onTogglePublish(record.id, 'published'),
                  },
              {
                danger: true,
                icon: <DeleteOutlined />,
                key: 'delete',
                label: LABEL_DELETE,
                onClick: () => {
                  Modal.confirm({
                    content: LABEL_CONFIRM_DELETE,
                    okType: 'danger',
                    onOk: () => onDelete(record.id),
                  });
                },
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<EllipsisOutlined />} size="small" type="text" />
        </Dropdown>
      ),
    },
  ], [categories, onEdit, onDelete, onTogglePublish, onTogglePin]);

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
            options={STATUS_OPTIONS.filter((o) => o.value !== 'deleted').map((o) => ({ label: o.label, value: o.value }))}
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
