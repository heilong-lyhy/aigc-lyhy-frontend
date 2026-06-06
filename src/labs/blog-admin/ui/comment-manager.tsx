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

const COMMENT_STATUS_OPTIONS: readonly { readonly label: string; readonly value: BlogCommentStatus; readonly color: string }[] = [
  { label: '待审核', value: 'pending', color: 'gold' },
  { label: '已通过', value: 'approved', color: 'green' },
  { label: '已驳回', value: 'rejected', color: 'red' },
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
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BlogCommentStatus) => renderStatusTag(status),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: '操作',
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
              通过
            </Button>
          )}
          {record.status !== 'rejected' && (
            <Button
              icon={<CloseOutlined />}
              size="small"
              type="link"
              onClick={() => onReject(record.id)}
            >
              驳回
            </Button>
          )}
          <Popconfirm
            title="标记为垃圾评论？"
            onConfirm={() => onMarkSpam(record.id)}
          >
            <Button
              danger
              icon={<StopOutlined />}
              size="small"
              type="link"
            >
              垃圾
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
        <Title level={3} style={{ margin: 0 }}>
          评论管理
        </Title>
        {selectedRowKeys.length > 0 && (
          <Space>
            <span className="text-text-secondary text-sm">
              已选 {selectedRowKeys.length} 项
            </span>
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="primary"
              onClick={handleBatchApprove}
            >
              批量通过
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={handleBatchReject}
            >
              批量驳回
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
