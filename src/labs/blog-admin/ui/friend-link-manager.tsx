// src/labs/blog-admin/ui/friend-link-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { BlogFriendLink } from '@/entities/blog';
import { formatAbsoluteDate } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '友链管理';
const LABEL_CREATE = '新建友链';
const LABEL_COL_NAME = '名称';
const LABEL_COL_URL = '链接';
const LABEL_COL_DESCRIPTION = '描述';
const LABEL_COL_SORT = '排序';
const LABEL_COL_CREATED = '创建时间';
const LABEL_COL_ACTIONS = '操作';
const LABEL_DELETE = '删除';
const LABEL_EDIT = '编辑';
const LABEL_CONFIRM_DELETE = '确定删除该友链？';
const LABEL_MODAL_CREATE = '新建友链';
const LABEL_MODAL_EDIT = '编辑友链';
const LABEL_NAME = '名称';
const LABEL_NAME_REQUIRED = '请输入名称';
const LABEL_URL = '链接';
const LABEL_URL_REQUIRED = '请输入链接';
const LABEL_DESCRIPTION = '描述';
const LABEL_AVATAR = '头像 URL';
const LABEL_SORT_ORDER = '排序';

type FriendLinkManagerProps = {
  readonly data: readonly BlogFriendLink[];
  readonly isLoading: boolean;
  readonly mutationError: string | null;
  readonly onCreate: (
    input: Readonly<{
      name: string;
      url: string;
      description?: string;
      avatar?: string;
      sortOrder?: number;
    }>,
  ) => void;
  readonly onUpdate: (
    input: Readonly<{
      id: number;
      name?: string;
      url?: string;
      description?: string;
      avatar?: string;
      sortOrder?: number;
    }>,
  ) => void;
  readonly onDelete: (id: number) => void;
};

type FriendLinkFormValues = {
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly avatar?: string;
  readonly sortOrder?: number;
};

export function FriendLinkManager({
  data,
  isLoading,
  mutationError,
  onCreate,
  onUpdate,
  onDelete,
}: FriendLinkManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<FriendLinkFormValues>();

  const openCreateModal = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (link: BlogFriendLink) => {
      setEditingId(Number(link.id));
      form.setFieldsValue({
        name: link.name,
        url: link.url,
        description: link.description ?? undefined,
        avatar: link.avatar ?? undefined,
        sortOrder: link.sortOrder,
      });
      setModalOpen(true);
    },
    [form],
  );

  const columns: ColumnsType<BlogFriendLink> = useMemo(
    () => [
      {
        title: LABEL_COL_NAME,
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record) => (
          <Space>
            <Avatar shape="square" size={24} src={record.avatar}>
              {name.charAt(0)}
            </Avatar>
            <span>{name}</span>
          </Space>
        ),
      },
      {
        title: LABEL_COL_URL,
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (url: string) => (
          <a href={url} rel="noopener noreferrer" target="_blank">
            {url}
          </a>
        ),
      },
      {
        title: LABEL_COL_DESCRIPTION,
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },
      {
        title: LABEL_COL_SORT,
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 80,
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
            <Popconfirm title={LABEL_CONFIRM_DELETE} onConfirm={() => onDelete(Number(record.id))}>
              <Button danger icon={<DeleteOutlined />} size="small" type="link">
                {LABEL_DELETE}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onDelete, openEditModal],
  );

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    if (editingId) {
      onUpdate({ id: editingId, ...values });
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
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreateModal}>
          {LABEL_CREATE}
        </Button>
      </div>

      {mutationError && <Typography.Text type="danger">{mutationError}</Typography.Text>}

      <Table<BlogFriendLink>
        columns={columns}
        dataSource={[...data]}
        loading={isLoading}
        pagination={false}
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
            label={LABEL_URL}
            name="url"
            rules={[{ required: true, message: LABEL_URL_REQUIRED }]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item label={LABEL_DESCRIPTION} name="description">
            <Input placeholder={LABEL_DESCRIPTION} />
          </Form.Item>
          <Form.Item label={LABEL_AVATAR} name="avatar">
            <Input placeholder="https://example.com/avatar.png" />
          </Form.Item>
          <Form.Item label={LABEL_SORT_ORDER} name="sortOrder">
            <InputNumber min={0} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
