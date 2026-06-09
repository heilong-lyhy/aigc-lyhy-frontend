// src/labs/blog-admin/ui/tag-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogTag, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '标签管理';
const LABEL_CREATE = '新建标签';
const LABEL_COL_NAME = '标签名';
const LABEL_COL_POST_COUNT = '文章数';
const LABEL_COL_CREATED = '创建时间';
const LABEL_COL_ACTIONS = '操作';
const LABEL_DELETE = '删除';
const LABEL_EDIT = '编辑';
const LABEL_CONFIRM_DELETE = '确定删除该标签？';
const LABEL_MODAL_CREATE = '新建标签';
const LABEL_MODAL_EDIT = '编辑标签';
const LABEL_NAME = '标签名称';
const LABEL_NAME_REQUIRED = '请输入标签名称';
const LABEL_SLUG_REQUIRED = '请输入 Slug';
const LABEL_SLUG_PLACEHOLDER = 'url-slug';

type TagManagerProps = {
  readonly data: PaginatedResult<BlogTag> | null;
  readonly isLoading: boolean;
  readonly pagination: PaginationInput;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onCreate: (input: { readonly name: string; readonly slug: string }) => void;
  readonly onUpdate: (id: string, input: { readonly name: string; readonly slug: string }) => void;
  readonly onDelete: (id: string) => void;
};

type TagFormValues = {
  readonly name: string;
  readonly slug: string;
};

export function TagManager({
  data,
  isLoading,
  pagination,
  onPaginationChange,
  onCreate,
  onUpdate,
  onDelete,
}: TagManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<TagFormValues>();

  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total) : 0;
  const current = toCurrentPage(pagination);

  const openCreateModal = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((tag: BlogTag) => {
    setEditingId(tag.id);
    form.setFieldsValue({ name: tag.name, slug: tag.slug });
    setModalOpen(true);
  }, [form]);

  const columns: ColumnsType<BlogTag> = useMemo(() => [
    {
      title: LABEL_COL_NAME,
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: LABEL_COL_POST_COUNT,
      dataIndex: 'postCount',
      key: 'postCount',
      width: 100,
    },
    {
      title: LABEL_COL_CREATED,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: LABEL_COL_ACTIONS,
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => openEditModal(record)}
          >
            {LABEL_EDIT}
          </Button>
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
  ], [onDelete, openEditModal]);

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    if (editingId) {
      onUpdate(editingId, values);
    } else {
      onCreate(values);
    }
    setModalOpen(false);
    form.resetFields();
  }, [editingId, form, onCreate, onUpdate]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="blog-typography-no-margin">
          <Title level={3}>{LABEL_PAGE_TITLE}</Title>
        </div>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={openCreateModal}
        >
          {LABEL_CREATE}
        </Button>
      </div>

      <Table<BlogTag>
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

      <Modal
        destroyOnClose
        open={modalOpen}
        title={editingId ? LABEL_MODAL_EDIT : LABEL_MODAL_CREATE}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={LABEL_NAME}
            name="name"
            rules={[{ required: true, message: LABEL_NAME_REQUIRED }]}
          >
            <Input placeholder={LABEL_NAME} />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: LABEL_SLUG_REQUIRED }]}
          >
            <Input placeholder={LABEL_SLUG_PLACEHOLDER} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
