// src/features/blog/ui/markdown-renderer.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Typography } from 'antd';
import DOMPurify from 'dompurify';
import GithubSlugger from 'github-slugger';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

/** 从 Markdown 内容中提取标题列表，用于目录 */
export type TocItem = {
  readonly id: string;
  readonly text: string;
  readonly level: number;
};

type MarkdownRendererProps = {
  readonly content: string;
  readonly onTocReady?: (items: readonly TocItem[]) => void;
};

const { Text } = Typography;

/** 从 Markdown 文本中提取标题信息，使用 github-slugger 与 rehype-slug 保持一致的 id 生成 */
function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const slugger = new GithubSlugger();
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);
    items.push({ id, text, level });
  }

  return items;
}

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
                  style={{ cursor: 'pointer' }}
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
        {previewSrc && <img alt="preview" src={previewSrc} style={{ width: '100%' }} />}
      </Modal>
    </>
  );
}
