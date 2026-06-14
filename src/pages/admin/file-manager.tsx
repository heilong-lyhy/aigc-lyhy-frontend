// src/pages/admin/file-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  FileImageOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Empty,
  Image,
  message,
  Popconfirm,
  Spin,
  Typography,
  Upload,
} from 'antd';

import { ALLOWED_FILE_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/features/blog';

import type { BlogFile } from '@/entities/blog';
import { formatAbsoluteDate } from '@/entities/blog';

const { Title, Text } = Typography;

const LABEL_PAGE_TITLE = '文件管理';
const LABEL_UPLOAD = '上传文件';
const LABEL_NO_FILES = '暂无文件';
const LABEL_UPLOAD_FIRST = '上传第一个文件';
const LABEL_COPY = '复制';
const LABEL_DELETE = '删除';
const LABEL_CONFIRM_DELETE = '确定删除该文件？';
const LABEL_REFRESH = '刷新';
const MSG_UNSUPPORTED_TYPE = '不支持的文件类型';
const MSG_IMAGE_ONLY = '仅支持图片文件';
const MSG_FILE_SIZE_EXCEEDED = '文件大小超过限制';
const MSG_COPIED = '已复制 URL';
const MSG_COPY_FAILED = '复制失败';

// ── 上传校验常量已收束到 features/blog/infrastructure/files-api ──

type FileManagerProps = {
  readonly files: readonly BlogFile[];
  readonly isLoading: boolean;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly onUpload: (file: File) => Promise<BlogFile | null>;
  readonly onDelete: (id: string) => Promise<boolean>;
  readonly onRefetch: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function FileManager({
  files,
  isLoading,
  isUploading,
  isDeleting,
  error,
  onUpload,
  onDelete,
  onRefetch,
}: FileManagerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');

  const handleBeforeUpload = useCallback((file: File) => {
    if (!ALLOWED_FILE_MIME_TYPES.includes(file.type)) {
      message.error(`${MSG_UNSUPPORTED_TYPE}：${file.type}，${MSG_IMAGE_ONLY}`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(`${MSG_FILE_SIZE_EXCEEDED}（${MAX_FILE_SIZE_MB}MB）`);
      return Upload.LIST_IGNORE;
    }
    return false; // prevent auto upload, we handle it manually
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      await onUpload(file);
    },
    [onUpload],
  );

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      message.success(MSG_COPIED);
    } catch {
      message.error(MSG_COPY_FAILED);
    }
  }, []);

  const handlePreview = useCallback((url: string) => {
    setPreviewSrc(url);
    setPreviewOpen(true);
  }, []);

  const gridItems = useMemo(
    () =>
      files.map((file) => (
        <div key={file.id} className="blog-card-grid-quarter">
          <Card.Grid>
            <div className="flex flex-col">
              <div
                className="flex h-32 cursor-pointer items-center justify-center bg-bg-layout"
                onClick={() => isImageFile(file.mimeType) && handlePreview(file.storagePath)}
              >
                {isImageFile(file.mimeType) ? (
                  <Image
                    alt={file.originalName}
                    height={120}
                    preview={false}
                    src={file.storagePath}
                  />
                ) : (
                  <div className="text-3xl">
                    <FileImageOutlined />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <div className="max-w-full">
                  <Text ellipsis>
                    {file.originalName}
                  </Text>
                </div>
                <Text type="secondary">{formatFileSize(file.fileSize)}</Text>
                <Text type="secondary">{formatAbsoluteDate(file.createdAt)}</Text>
                <div className="flex gap-2">
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    type="link"
                    onClick={() => handleCopyUrl(file.storagePath)}
                  >
                    {LABEL_COPY}
                  </Button>
                  <Popconfirm
                    title={LABEL_CONFIRM_DELETE}
                    onConfirm={() => onDelete(file.id)}
                  >
                    <Button
                      danger
                      disabled={isDeleting}
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      size="small"
                      type="link"
                    >
                      {LABEL_DELETE}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          </Card.Grid>
        </div>
      )),
    [files, isDeleting, onDelete, handleCopyUrl, handlePreview],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="blog-typography-no-margin">
          <Title level={3}>
            {LABEL_PAGE_TITLE}
          </Title>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={onRefetch}
          >
            {LABEL_REFRESH}
          </Button>
          <Upload
            accept={ALLOWED_FILE_MIME_TYPES.join(',')}
            beforeUpload={handleBeforeUpload}
            customRequest={async ({ file }) => {
              await handleUpload(file as File);
            }}
            showUploadList={false}
          >
            <Button icon={<PlusOutlined />} loading={isUploading} type="primary">
              {LABEL_UPLOAD}
            </Button>
          </Upload>
        </div>
      </div>

      {error && <Alert message={error} showIcon type="error" />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : files.length === 0 ? (
        <Empty
          description={LABEL_NO_FILES}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Upload
            accept={ALLOWED_FILE_MIME_TYPES.join(',')}
            beforeUpload={handleBeforeUpload}
            customRequest={async ({ file }) => {
              await handleUpload(file as File);
            }}
            showUploadList={false}
          >
            <Button icon={<InboxOutlined />} loading={isUploading}>{LABEL_UPLOAD_FIRST}</Button>
          </Upload>
        </Empty>
      ) : (
        <Card>{gridItems}</Card>
      )}

      {/* 图片预览 */}
      <Image
        hidden
        preview={{
          visible: previewOpen,
          onVisibleChange: (visible) => setPreviewOpen(visible),
        }}
        src={previewSrc}
      />
    </div>
  );
}
