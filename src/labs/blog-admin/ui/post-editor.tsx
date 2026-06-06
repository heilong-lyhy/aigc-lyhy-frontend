// src/labs/blog-admin/ui/post-editor.tsx

import { SaveOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space, Spin, Typography } from 'antd';

import type { BlogCategory, BlogTag, PostEditorForm } from '@/entities/blog';

import { STATUS_OPTIONS } from '../lib/status-options';

const { Title } = Typography;
const { TextArea } = Input;

type PostEditorProps = {
  readonly form: PostEditorForm;
  readonly isDirty: boolean;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly lastSavedAt: string | null;
  readonly onTitleChange: (value: string) => void;
  readonly onSlugChange: (value: string) => void;
  readonly onExcerptChange: (value: string) => void;
  readonly onContentChange: (value: string) => void;
  readonly onCoverImageChange: (value: string) => void;
  readonly onCategoryIdChange: (value: string) => void;
  readonly onTagsChange: (values: readonly string[]) => void;
  readonly onStatusChange: (value: PostEditorForm['status']) => void;
  readonly onSave: () => void;
  readonly onBack: () => void;
};

export function PostEditor({
  form,
  isDirty,
  isLoading,
  isSaving,
  categories,
  tags,
  lastSavedAt,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onContentChange,
  onCoverImageChange,
  onCategoryIdChange,
  onTagsChange,
  onStatusChange,
  onSave,
  onBack,
}: PostEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} type="link">
          &larr; 返回列表
        </Button>
        <Space>
          {lastSavedAt && (
            <span className="text-text-tertiary text-xs">
              上次保存: {lastSavedAt}
            </span>
          )}
          <Button
            disabled={!isDirty || isSaving || isLoading}
            icon={<SaveOutlined />}
            loading={isSaving}
            type="primary"
            onClick={onSave}
          >
            保存
          </Button>
        </Space>
      </div>

      <Title level={3} style={{ margin: 0 }}>
        {form.slug ? '编辑文章' : '新建文章'}
      </Title>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div>
            <label className="mb-1 block text-text-secondary text-sm">标题</label>
            <Input
              placeholder="文章标题"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">Slug</label>
            <Input
              placeholder="url-slug"
              value={form.slug}
              onChange={(e) => onSlugChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">摘要</label>
            <TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="文章摘要"
              value={form.excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">正文（Markdown）</label>
            <TextArea
              autoSize={{ minRows: 12, maxRows: 30 }}
              placeholder="Markdown content"
              value={form.content}
              onChange={(e) => onContentChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-text-secondary text-sm">状态</label>
            <Select
              style={{ width: '100%' }}
              value={form.status}
              onChange={onStatusChange}
              options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">分类</label>
            <Select
              allowClear
              placeholder="选择分类"
              style={{ width: '100%' }}
              value={form.categoryId || undefined}
              onChange={(value) => onCategoryIdChange(value ?? '')}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">标签</label>
            <Select
              allowClear
              mode="multiple"
              placeholder="选择标签"
              style={{ width: '100%' }}
              value={[...form.tags]}
              onChange={(values) => onTagsChange(values)}
              options={tags.map((t) => ({ label: t.name, value: t.id }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm">封面图 URL</label>
            <Input
              placeholder="https://..."
              value={form.coverImage}
              onChange={(e) => onCoverImageChange(e.target.value)}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
