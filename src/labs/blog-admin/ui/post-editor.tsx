// src/labs/blog-admin/ui/post-editor.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditOutlined, EyeOutlined, PictureOutlined, SaveOutlined, SplitCellsOutlined } from '@ant-design/icons';
import { Button, Image, Input, message, Segmented, Select, Space, Spin, Switch, Typography, Upload } from 'antd';
import type { ComponentType } from 'react';

import type { BlogCategory, BlogTag, PostEditorForm } from '@/entities/blog';
import { ALLOWED_COVER_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/entities/blog';

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
const LABEL_PINNED = '置顶';
const LABEL_CATEGORY = '分类';
const LABEL_CATEGORY_PLACEHOLDER = '选择分类';
const LABEL_TAGS = '标签';
const LABEL_TAGS_PLACEHOLDER = '选择标签';
const LABEL_COVER_IMAGE = '封面图 URL';
const LABEL_COVER_IMAGE_PLACEHOLDER = 'https://...';
const LABEL_UPLOAD = '上传';
const LABEL_UPLOADING = '上传中...';
const LABEL_INVALID_TYPE = '仅支持 JPG/PNG/WebP 格式';
const LABEL_FILE_TOO_LARGE = '文件大小不能超过 5MB';
const LABEL_UPLOAD_FAILED = '上传失败';

// ── 上传校验常量已收束到 entities/blog ──

const LABEL_MODE_EDIT = '编辑';
const LABEL_MODE_PREVIEW = '预览';
const LABEL_MODE_SPLIT = '分栏';
const LABEL_MODE_SWITCHER = '内容模式切换';

type EditorMode = 'edit' | 'preview' | 'split';

const EDITOR_MODE_OPTIONS = [
  { icon: <EditOutlined />, label: LABEL_MODE_EDIT, value: 'edit' as const },
  { icon: <EyeOutlined />, label: LABEL_MODE_PREVIEW, value: 'preview' as const },
  { icon: <SplitCellsOutlined />, label: LABEL_MODE_SPLIT, value: 'split' as const },
];

/** 预览防抖间隔（ms） */
const PREVIEW_DEBOUNCE_MS = 300;

type PostEditorProps = {
  readonly form: PostEditorForm;
  readonly isDirty: boolean;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly categories: readonly BlogCategory[];
  readonly tags: readonly BlogTag[];
  readonly lastSavedAt: string | null;
  readonly markdownRenderer: ComponentType<{ readonly content: string }>;
  readonly onCoverImageUpload: (file: File) => Promise<string>;
  readonly onTitleChange: (value: string) => void;
  readonly onSlugChange: (value: string) => void;
  readonly onExcerptChange: (value: string) => void;
  readonly onContentChange: (value: string) => void;
  readonly onCoverImageChange: (value: string) => void;
  readonly onCategoryIdChange: (value: string) => void;
  readonly onTagsChange: (values: readonly string[]) => void;
  readonly onStatusChange: (value: PostEditorForm['status']) => void;
  readonly onIsPinnedChange: (value: boolean) => void;
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
  markdownRenderer: MarkdownRenderer,
  onCoverImageUpload,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onContentChange,
  onCoverImageChange,
  onCategoryIdChange,
  onTagsChange,
  onStatusChange,
  onIsPinnedChange,
  onSave,
  onBack,
}: PostEditorProps) {
  const [mode, setMode] = useState<EditorMode>('edit');

  // 防抖预览内容
  const [debouncedContent, setDebouncedContent] = useState(form.content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedContent(form.content);
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form.content]);

  const handleModeChange = useCallback((value: string | number) => {
    setMode(value as EditorMode);
  }, []);

  const showEditor = mode === 'edit' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  // 封面图上传状态
  const [isUploading, setIsUploading] = useState(false);

  const handleCoverUpload = useCallback((file: File) => {
    if (!ALLOWED_COVER_MIME_TYPES.includes(file.type)) {
      void message.warning(LABEL_INVALID_TYPE);
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      void message.warning(LABEL_FILE_TOO_LARGE);
      return false;
    }
    setIsUploading(true);
    void onCoverImageUpload(file)
      .then((url) => {
        onCoverImageChange(url);
      })
      .catch(() => {
        void message.error(LABEL_UPLOAD_FAILED);
      })
      .finally(() => {
        setIsUploading(false);
      });
    return false; // 阻止 AntD 自动上传
  }, [onCoverImageUpload, onCoverImageChange]);

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
            <div className="mb-1 flex items-center justify-between">
              <label className="text-text-secondary text-sm" htmlFor={showEditor ? 'post-content' : undefined}>{LABEL_CONTENT}</label>
              <Segmented
                aria-label={LABEL_MODE_SWITCHER}
                options={EDITOR_MODE_OPTIONS}
                size="small"
                value={mode}
                onChange={handleModeChange}
              />
            </div>
            <div className={mode === 'split' ? 'grid grid-cols-2 gap-4' : ''}>
              {showEditor && (
                <TextArea
                  id="post-content"
                  autoSize={{ minRows: 12, maxRows: 30 }}
                  placeholder={LABEL_CONTENT_PLACEHOLDER}
                  value={form.content}
                  onChange={(e) => onContentChange(e.target.value)}
                />
              )}
              {showPreview && (
                <div className="max-h-[600px] overflow-auto rounded border border-border p-4">
                  <MarkdownRenderer content={debouncedContent} />
                </div>
              )}
            </div>
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
          <div className="flex items-center justify-between">
            <label className="text-text-secondary text-sm">{LABEL_PINNED}</label>
            <Switch checked={form.isPinned} onChange={onIsPinnedChange} />
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
                popupMatchSelectWidth={false}
                value={[...form.tags]}
                onChange={(values) => onTagsChange(values)}
                options={tags.map((t) => ({ label: t.name, value: t.id }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-text-secondary text-sm" htmlFor="post-cover-image">{LABEL_COVER_IMAGE}</label>
            <div className="flex gap-2">
              <Input
                id="post-cover-image"
                placeholder={LABEL_COVER_IMAGE_PLACEHOLDER}
                value={form.coverImage}
                onChange={(e) => onCoverImageChange(e.target.value)}
              />
              <Upload
                accept={ALLOWED_COVER_MIME_TYPES.join(',')}
                beforeUpload={handleCoverUpload}
                showUploadList={false}
              >
                <Button icon={<PictureOutlined />} loading={isUploading}>
                  {isUploading ? LABEL_UPLOADING : LABEL_UPLOAD}
                </Button>
              </Upload>
            </div>
            {form.coverImage && (
              <div className="mt-2 max-w-full">
                <Image
                  alt="封面图预览"
                  height={120}
                  src={form.coverImage}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
