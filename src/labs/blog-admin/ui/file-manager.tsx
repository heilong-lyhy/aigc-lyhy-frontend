// src/labs/blog-admin/ui/file-manager.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  FileImageOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Empty,
  Image,
  message,
  Popconfirm,
  Typography,
  Upload,
} from 'antd';

import type { BlogFile } from '@/entities/blog';
import { formatAbsoluteDate } from '@/entities/blog';

const { Title, Text } = Typography;

// ── 上传校验常量 ──

const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type FileManagerProps = {
  readonly files: readonly BlogFile[];
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly onUpload: (file: File) => Promise<BlogFile | null>;
  readonly onDelete: (id: string) => Promise<boolean>;
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
  isUploading,
  isDeleting,
  error,
  onUpload,
  onDelete,
}: FileManagerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');

  const handleBeforeUpload = useCallback((file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      message.error(`不支持的文件类型：${file.type}，仅支持图片文件`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(`文件大小超过 ${MAX_FILE_SIZE_MB}MB 限制`);
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
      message.success('已复制 URL');
    } catch {
      message.error('复制失败');
    }
  }, []);

  const handlePreview = useCallback((url: string) => {
    setPreviewSrc(url);
    setPreviewOpen(true);
  }, []);

  const gridItems = useMemo(
    () =>
      files.map((file) => (
        <Card.Grid key={file.id} style={{ width: '25%', padding: 0 }}>
          <div className="flex flex-col">
            <div
              className="flex h-32 cursor-pointer items-center justify-center bg-bg-layout"
              onClick={() => isImageFile(file.mimeType) && handlePreview(file.url)}
            >
              {isImageFile(file.mimeType) ? (
                <Image
                  alt={file.name}
                  height={120}
                  preview={false}
                  src={file.url}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <FileImageOutlined style={{ fontSize: 32 }} />
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <Text ellipsis style={{ maxWidth: '100%' }}>
                {file.name}
              </Text>
              <Text type="secondary">{formatFileSize(file.size)}</Text>
              <Text type="secondary">{formatAbsoluteDate(file.createdAt)}</Text>
              <div className="flex gap-2">
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="link"
                  onClick={() => handleCopyUrl(file.url)}
                >
                  复制
                </Button>
                <Popconfirm
                  title="确定删除该文件？"
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
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </div>
        </Card.Grid>
      )),
    [files, isDeleting, onDelete, handleCopyUrl, handlePreview],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3} style={{ margin: 0 }}>
          文件管理
        </Title>
        <Upload
          accept={ALLOWED_MIME_TYPES.join(',')}
          beforeUpload={handleBeforeUpload}
          customRequest={async ({ file }) => {
            await handleUpload(file as File);
          }}
          showUploadList={false}
        >
          <Button icon={<PlusOutlined />} loading={isUploading} type="primary">
            上传文件
          </Button>
        </Upload>
      </div>

      {error && <Alert message={error} showIcon type="error" />}

      {files.length === 0 ? (
        <Empty
          description="暂无文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Upload
            accept={ALLOWED_MIME_TYPES.join(',')}
            beforeUpload={handleBeforeUpload}
            customRequest={async ({ file }) => {
              await handleUpload(file as File);
            }}
            showUploadList={false}
          >
            <Button icon={<InboxOutlined />} loading={isUploading}>上传第一个文件</Button>
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
