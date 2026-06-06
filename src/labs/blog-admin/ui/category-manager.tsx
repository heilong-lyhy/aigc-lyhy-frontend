// src/labs/blog-admin/ui/category-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tree,
  Typography,
} from 'antd';
import type { TreeProps } from 'antd/es/tree';

import type { BlogCategory } from '@/entities/blog';

const { Title } = Typography;

type CategoryManagerProps = {
  readonly categories: readonly BlogCategory[];
  readonly isLoading: boolean;
  readonly onCreate: (input: { readonly name: string; readonly slug: string; readonly parentId?: string }) => void;
  readonly onUpdate: (id: string, input: { readonly name?: string; readonly slug?: string }) => void;
  readonly onDelete: (id: string) => void;
  readonly onReorder: (id: string, parentId: string | null, sortOrder: number) => void;
};

type CategoryFormValues = {
  readonly name: string;
  readonly slug: string;
};

type CategoryTreeNode = {
  readonly key: string;
  readonly name: string;
  readonly postCount: number;
  readonly children: readonly CategoryTreeNode[];
};

function buildCategoryTree(categories: readonly BlogCategory[]): CategoryTreeNode[] {
  return categories.map((cat) => ({
    key: cat.id,
    name: cat.name,
    postCount: cat.postCount,
    children: cat.children.length > 0 ? buildCategoryTree(cat.children) : [],
  }));
}

function flattenTree(nodes: readonly CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenTree(node.children));
  }
  return result;
}

export function CategoryManager({
  categories,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [form] = Form.useForm<CategoryFormValues>();

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatNodes = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  const treeData = useMemo(
    () =>
      categoryTree.map(function toDataNode(node): TreeProps['treeData'] extends (infer T)[] | undefined ? T : never {
        return {
          key: node.key,
          title: node.name,
          children: node.children.length > 0 ? node.children.map(toDataNode) : [],
        };
      }),
    [categoryTree],
  );

  const openCreateModal = useCallback((parentId?: string) => {
    setEditingId(null);
    setParentForNew(parentId ?? null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setEditingId(id);
    setParentForNew(null);
    form.setFieldsValue({ name: cat.name, slug: cat.slug });
    setModalOpen(true);
  }, [categories, form]);

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    if (editingId) {
      onUpdate(editingId, values);
    } else {
      onCreate({ ...values, parentId: parentForNew ?? undefined });
    }
    setModalOpen(false);
    form.resetFields();
  }, [editingId, form, onCreate, onUpdate, parentForNew]);

  const handleDrop = useCallback(
    (info: Parameters<NonNullable<TreeProps['onDrop']>>[0]) => {
      const dragKey = String(info.dragNode.key);
      const dropKey = String(info.node.key);
      const dropToGap = info.dropToGap;
      // 拖拽到节点间隙 → parentId = null（根级）；拖拽到节点上 → parentId = 目标节点
      const parentId = dropToGap ? null : dropKey;
      const sortOrder = info.dropPosition;
      onReorder(dragKey, parentId, sortOrder);
    },
    [onReorder],
  );

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const findNode = useCallback(
    (key: string): CategoryTreeNode | undefined => flatNodes.find((n) => n.key === key),
    [flatNodes],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3} style={{ margin: 0 }}>
          分类管理
        </Title>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openCreateModal()}>
          新建分类
        </Button>
      </div>

      {isLoading ? null : (
        <Tree
          blockNode
          draggable
          showLine={{ showLeafIcon: false }}
          treeData={treeData}
          titleRender={(nodeData) => {
            const node = findNode(String(nodeData.key));
            return (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2">
                  <span>{node?.name ?? String(nodeData.title ?? '')}</span>
                  <span className="text-text-tertiary text-xs">
                    {node?.postCount ?? 0} 篇
                  </span>
                </span>
                <Space size={4} onClick={stopPropagation}>
                  <Button
                    icon={<FolderAddOutlined />}
                    size="small"
                    type="link"
                    onClick={() => openCreateModal(String(nodeData.key))}
                  >
                    子分类
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    type="link"
                    onClick={() => openEditModal(String(nodeData.key))}
                  />
                  <Popconfirm
                    title="确定删除该分类？"
                    onConfirm={() => onDelete(String(nodeData.key))}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      type="link"
                    />
                  </Popconfirm>
                </Space>
              </div>
            );
          }}
          onDrop={handleDrop}
        />
      )}

      <Modal
        destroyOnClose
        open={modalOpen}
        title={editingId ? '编辑分类' : '新建分类'}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="分类名称" />
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
