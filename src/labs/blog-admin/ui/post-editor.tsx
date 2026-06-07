// src/labs/blog-admin/ui/post-editor.tsx

import { SaveOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space, Spin, Typography } from 'antd';

import type { BlogCategory, BlogTag, PostEditorForm } from '@/entities/blog';

import { STATUS_OPTIONS } from '../lib/status-options';

const { Title } = Typography;
const { TextArea } = Input;

const LABEL_BACK = '← 返回列表';
const LABEL_LAST_SAVED = '上次保存:';
const LABEL_SAVE = '保存';
const LABEL_EDIT_POST = '编辑文章';
const LABEL_NEW_POST = '新建文章';
const LABEL_TITLE = '标题';
const LABEL_TITLE_PLACEHOLDER = '文章标题';
const LABEL_SLUG = 'Slug';
const LABEL_SLUG_PLACEHOLDER = 'url-slug';
const LABEL_EXCERPT = '摘要';
const LABEL_EXCERPT_PLACEHOLDER = '文章摘要';
const LABEL_CONTENT = '正文（Markdown）';
const LABEL_CONTENT_PLACEHOLDER = 'Markdown content';
const LABEL_STATUS = '状态';
const LABEL_CATEGORY = '分类';
const LABEL_CATEGORY_PLACEHOLDER = '选择分类';
const LABEL_TAGS = '标签';
const LABEL_TAGS_PLACEHOLDER = '选择标签';
const LABEL_COVER_IMAGE = '封面图 URL';
const LABEL_COVER_IMAGE_PLACEHOLDER = 'https://...';

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
          {LABEL_BACK}
        </Button>
        <Space>
          {lastSavedAt && (
            <span className="text-text-tertiary text-xs">
              {LABEL_LAST_SAVED} {lastSavedAt}
            </span>
          )}
          <Button
            disabled={!isDirty || isSaving || isLoading}
            icon={<SaveOutlined />}
            loading={isSaving}
            type="primary"
            onClick={onSave}
          >
            {LABEL_SAVE}
          </Button>
        </Space>
      </div>

      <div className="blog-typography-no-margin">
        <Title level={3}>
          {form.slug ? LABEL_EDIT_POST : LABEL_NEW_POST}
        </Title>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-title">{LABEL_TITLE}</label>
            <Input
              id="post-title"
              placeholder={LABEL_TITLE_PLACEHOLDER}
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-slug">{LABEL_SLUG}</label>
            <Input
              id="post-slug"
              placeholder={LABEL_SLUG_PLACEHOLDER}
              value={form.slug}
              onChange={(e) => onSlugChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-excerpt">{LABEL_EXCERPT}</label>
            <TextArea
              id="post-excerpt"
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder={LABEL_EXCERPT_PLACEHOLDER}
              value={form.excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-content">{LABEL_CONTENT}</label>
            <TextArea
              id="post-content"
              autoSize={{ minRows: 12, maxRows: 30 }}
              placeholder={LABEL_CONTENT_PLACEHOLDER}
              value={form.content}
              onChange={(e) => onContentChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-status">{LABEL_STATUS}</label>
            <div className="w-full">
              <Select
                id="post-status"
                value={form.status}
                onChange={onStatusChange}
                options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-category">{LABEL_CATEGORY}</label>
            <div className="w-full">
              <Select
                id="post-category"
                allowClear
                placeholder={LABEL_CATEGORY_PLACEHOLDER}
                value={form.categoryId || undefined}
                onChange={(value) => onCategoryIdChange(value ?? '')}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-tags">{LABEL_TAGS}</label>
            <div className="w-full">
              <Select
                id="post-tags"
                allowClear
                mode="multiple"
                placeholder={LABEL_TAGS_PLACEHOLDER}
                value={[...form.tags]}
                onChange={(values) => onTagsChange(values)}
                options={tags.map((t) => ({ label: t.name, value: t.id }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-cover-image">{LABEL_COVER_IMAGE}</label>
            <Input
              id="post-cover-image"
              placeholder={LABEL_COVER_IMAGE_PLACEHOLDER}
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
