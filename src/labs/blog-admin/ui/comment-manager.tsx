// src/labs/blog-admin/ui/comment-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MessageOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
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
const LABEL_DELETE = '删除';
const LABEL_CONFIRM_DELETE = '确定要删除此评论吗？此操作不可恢复';
const LABEL_REPLY = '回复';
const LABEL_REPLY_SUBMIT = '发送';
const LABEL_REPLY_CANCEL = '取消';
const LABEL_REPLY_PLACEHOLDER = '输入回复内容…';
const LABEL_ADMIN_BADGE = '博主';
const LABEL_HIDDEN = '已隐藏';
const LABEL_HIDE = '隐藏';
const LABEL_UNHIDE = '取消隐藏';
const LABEL_CONFIRM_HIDE = '确定要隐藏此评论吗？';
const LABEL_CONFIRM_UNHIDE = '确定要取消隐藏此评论吗？';
const LABEL_FILTER_STATUS = '状态筛选';

const COMMENT_STATUS_OPTIONS: readonly { readonly label: string; readonly value: BlogCommentStatus; readonly color: string }[] = [
  { label: LABEL_STATUS_PENDING, value: 'pending', color: 'gold' },
  { label: LABEL_STATUS_APPROVED, value: 'approved', color: 'green' },
  { label: LABEL_STATUS_REJECTED, value: 'rejected', color: 'red' },
];

type CommentManagerProps = {
  readonly data: PaginatedResult<BlogComment> | null;
  readonly isLoading: boolean;
  readonly pagination: PaginationInput;
  readonly statusFilter?: BlogCommentStatus;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onStatusFilterChange: (status?: BlogCommentStatus) => void;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onMarkSpam: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onReply: (commentId: string, content: string) => void;
  readonly onHide: (id: string) => void;
  readonly onUnhide: (id: string) => void;
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
  statusFilter,
  onPaginationChange,
  onStatusFilterChange,
  onApprove,
  onReject,
  onMarkSpam,
  onDelete,
  onReply,
  onHide,
  onUnhide,
  onBatchApprove,
  onBatchReject,
}: CommentManagerProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogComment> = useMemo(() => [
    {
      title: LABEL_COL_AUTHOR,
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120,
      render: (name: string, record: BlogComment) => (
        <span>
          {name}
          {record.isAdminReply && (
            <span className="ml-1">
              <Tag color="blue">{LABEL_ADMIN_BADGE}</Tag>
            </span>
          )}
        </span>
      ),
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
      width: 120,
      render: (status: BlogCommentStatus, record: BlogComment) => (
        <Space size={4}>
          {renderStatusTag(status)}
          {record.isHidden && <Tag color="default">{LABEL_HIDDEN}</Tag>}
        </Space>
      ),
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
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
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
          <Button
            icon={<MessageOutlined />}
            size="small"
            type="link"
            onClick={() => {
              setReplyingTo(record.id);
              setReplyContent('');
            }}
          >
            {LABEL_REPLY}
          </Button>
          {record.isHidden ? (
            <Popconfirm
              title={LABEL_CONFIRM_UNHIDE}
              onConfirm={() => onUnhide(record.id)}
            >
              <Button
                icon={<EyeOutlined />}
                size="small"
                type="link"
              >
                {LABEL_UNHIDE}
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={LABEL_CONFIRM_HIDE}
              onConfirm={() => onHide(record.id)}
            >
              <Button
                icon={<EyeInvisibleOutlined />}
                size="small"
                type="link"
              >
                {LABEL_HIDE}
              </Button>
            </Popconfirm>
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
  ], [onApprove, onReject, onMarkSpam, onDelete, onHide, onUnhide]);

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

  const handleSubmitReply = useCallback(() => {
    if (!replyingTo || !replyContent.trim()) return;
    onReply(replyingTo, replyContent.trim());
    setReplyingTo(null);
    setReplyContent('');
  }, [replyingTo, replyContent, onReply]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setReplyContent('');
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="blog-typography-no-margin">
            <Title level={3}>
              {LABEL_PAGE_TITLE}
            </Title>
          </div>
          <div className="w-35">
            <Select
              allowClear
              placeholder={LABEL_FILTER_STATUS}
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={COMMENT_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>
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
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: false,
          onChange: (page) => onPaginationChange(toPaginationInput(page, pagination.pageSize)),
        }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        expandable={{
          expandedRowKeys: replyingTo ? [replyingTo] : [],
          expandedRowRender: (record) =>
            replyingTo === record.id ? (
              <div className="p-4">
                <Input
                  aria-label={LABEL_REPLY_PLACEHOLDER}
                  placeholder={LABEL_REPLY_PLACEHOLDER}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onPressEnter={handleSubmitReply}
                />
                <div className="mt-2">
                  <Space>
                    <Button type="primary" size="small" onClick={handleSubmitReply}>
                      {LABEL_REPLY_SUBMIT}
                    </Button>
                    <Button size="small" onClick={handleCancelReply}>
                      {LABEL_REPLY_CANCEL}
                    </Button>
                  </Space>
                </div>
              </div>
            ) : null,
          showExpandColumn: false,
        }}
      />
    </div>
  );
}
