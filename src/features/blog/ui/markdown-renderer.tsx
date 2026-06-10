// src/features/blog/ui/markdown-renderer.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Typography } from 'antd';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { extractToc } from '../application/extract-toc';
import type { TocItem } from '../application/types';

export type MarkdownRendererProps = {
  readonly content: string;
  readonly onTocReady?: (items: readonly TocItem[]) => void;
};

const { Text } = Typography;

export function MarkdownRenderer({ content, onTocReady }: MarkdownRendererProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const sanitizedContent = useMemo(() => DOMPurify.sanitize(content), [content]);

  const tocItems = useMemo(() => extractToc(content), [content]);

  // 通知父组件目录数据
  useEffect(() => {
    onTocReady?.(tocItems);
  }, [tocItems, onTocReady]);

  const handleImageClick = useCallback((src: string) => {
    setPreviewSrc(src);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewSrc(null);
  }, []);

  return (
    <>
      <div className="markdown-body">
        <ReactMarkdown
          rehypePlugins={[rehypeSlug, rehypeHighlight]}
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => {
              if (!src) return null;
              return (
                <Image
                  alt={alt ?? ''}
                  loading="lazy"
                  preview={false}
                  src={src}
                  onClick={() => handleImageClick(src)}
                />
              );
            },
            a: ({ href, children }) => (
              <a href={href} rel="noopener noreferrer" target="_blank">
                {children}
              </a>
            ),
            code: ({ className, children, ...rest }) => {
              // react-markdown passes `node` internally; strip it before spreading to DOM
              const domProps = Object.fromEntries(
                Object.entries(rest).filter(([key]) => key !== 'node'),
              );
              const isInline = !className;
              if (isInline) {
                return (
                  <Text code>
                    {children}
                  </Text>
                );
              }
              return (
                <code className={className} {...domProps}>
                  {children}
                </code>
              );
            },
          }}
        >
          {sanitizedContent}
        </ReactMarkdown>
      </div>

      <Modal footer={null} open={previewSrc !== null} title={null} onCancel={handlePreviewClose}>
        {previewSrc && <img alt="preview" className="w-full" src={previewSrc} />}
      </Modal>
    </>
  );
}
