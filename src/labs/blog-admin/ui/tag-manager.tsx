// src/labs/blog-admin/ui/tag-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Popconfirm, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogTag, PaginatedResult, PaginationInput } from '@/entities/blog';
import { formatAbsoluteDate, toCurrentPage, toEffectiveTotal, toPaginationInput } from '@/entities/blog';

const { Title } = Typography;

type TagManagerProps = {
  readonly data: PaginatedResult<BlogTag> | null;
  readonly isLoading: boolean;
  readonly pagination: PaginationInput;
  readonly onPaginationChange: (pagination: PaginationInput) => void;
  readonly onCreate: (input: { readonly name: string; readonly slug: string }) => void;
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
  onDelete,
}: TagManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<TagFormValues>();

  const items = data?.items ?? [];
  const total = data ? toEffectiveTotal(data.total, data.hasMore) : 0;
  const current = toCurrentPage(pagination);

  const columns: ColumnsType<BlogTag> = useMemo(() => [
    {
      title: '标签名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: '文章数',
      dataIndex: 'postCount',
      key: 'postCount',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => formatAbsoluteDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定删除该标签？"
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
      ),
    },
  ], [onDelete]);

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    onCreate(values);
    setModalOpen(false);
    form.resetFields();
  }, [form, onCreate]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3} style={{ margin: 0 }}>
          标签管理
        </Title>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            form.resetFields();
            setModalOpen(true);
          }}
        >
          新建标签
        </Button>
      </div>

      <Table<BlogTag>
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

      <Modal
        destroyOnClose
        open={modalOpen}
        title="新建标签"
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="标签名称"
            name="name"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="标签名称" />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: '请输入 Slug' }]}
          >
            <Input placeholder="url-slug" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
