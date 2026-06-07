// src/labs/blog-admin/ui/comment-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogComment, BlogCommentStatus, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '评论管理';
const LABEL_COL_AUTHOR = '作者';
const LABEL_COL_CONTENT = '内容';
const LABEL_COL_STATUS = '状态';
const LABEL_COL_TIME = '时间';
const LABEL_COL_ACTIONS = '操作';
const LABEL_APPROVE = '通过';
const LABEL_REJECT = '驳回';
const LABEL_SPAM = '垃圾';
const LABEL_CONFIRM_SPAM = '标记为垃圾评论？';
const LABEL_SELECTED = '已选';
const LABEL_ITEMS = '项';
const LABEL_BATCH_APPROVE = '批量通过';
const LABEL_BATCH_REJECT = '批量驳回';
const LABEL_STATUS_PENDING = '待审核';
const LABEL_STATUS_APPROVED = '已通过';
const LABEL_STATUS_REJECTED = '已驳回';

const COMMENT_STATUS_OPTIONS: readonly { readonly label: string; readonly value: BlogCommentStatus; readonly color: string }[] = [
  { label: LABEL_STATUS_PENDING, value: 'pending', color: 'gold' },
  { label: LABEL_STATUS_APPROVED, value: 'approved', color: 'green' },
  { label: LABEL_STATUS_REJECTED, value: 'rejected', color: 'red' },
];

type CommentManagerProps = {
  readonly data: PaginatedResult<BlogComment> | null;
  readonly isLoading: boolean;
  readonly pagination: PaginationInput;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onMarkSpam: (id: string) => void;
  readonly onBatchApprove: (ids: readonly string[]) => void;
  readonly onBatchReject: (ids: readonly string[]) => void;
};

function renderStatusTag(status: BlogCommentStatus) {
  const option = COMMENT_STATUS_OPTIONS.find((o) => o.value === status);
  return <Tag color={option?.color ?? 'default'}>{option?.label ?? status}</Tag>;
}

export function CommentManager({
  data,
  isLoading,
  pagination,
  onPaginationChange,
  onApprove,
  onReject,
  onMarkSpam,
  onBatchApprove,
  onBatchReject,
}: CommentManagerProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total, data.hasMore) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogComment> = useMemo(() => [
    {
      title: LABEL_COL_AUTHOR,
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120,
    },
    {
      title: LABEL_COL_CONTENT,
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: LABEL_COL_STATUS,
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BlogCommentStatus) => renderStatusTag(status),
    },
    {
      title: LABEL_COL_TIME,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: LABEL_COL_ACTIONS,
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'approved' && (
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="link"
              onClick={() => onApprove(record.id)}
            >
              {LABEL_APPROVE}
            </Button>
          )}
          {record.status !== 'rejected' && (
            <Button
              icon={<CloseOutlined />}
              size="small"
              type="link"
              onClick={() => onReject(record.id)}
            >
              {LABEL_REJECT}
            </Button>
          )}
          <Popconfirm
            title={LABEL_CONFIRM_SPAM}
            onConfirm={() => onMarkSpam(record.id)}
          >
            <Button
              danger
              icon={<StopOutlined />}
              size="small"
              type="link"
            >
              {LABEL_SPAM}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [onApprove, onReject, onMarkSpam]);

  const handleBatchApprove = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    onBatchApprove(selectedRowKeys.map(String));
    setSelectedRowKeys([]);
  }, [selectedRowKeys, onBatchApprove]);

  const handleBatchReject = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    onBatchReject(selectedRowKeys.map(String));
    setSelectedRowKeys([]);
  }, [selectedRowKeys, onBatchReject]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="blog-typography-no-margin">
          <Title level={3}>
            {LABEL_PAGE_TITLE}
          </Title>
        </div>
        {selectedRowKeys.length > 0 && (
          <Space>
            <span className="text-text-secondary text-sm">
              {LABEL_SELECTED} {selectedRowKeys.length} {LABEL_ITEMS}
            </span>
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="primary"
              onClick={handleBatchApprove}
            >
              {LABEL_BATCH_APPROVE}
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={handleBatchReject}
            >
              {LABEL_BATCH_REJECT}
            </Button>
          </Space>
        )}
      </div>

      <Table<BlogComment>
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
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />
    </div>
  );
}
