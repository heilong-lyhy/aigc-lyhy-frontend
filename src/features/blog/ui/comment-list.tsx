// src/features/blog/ui/comment-list.tsx

import { Typography } from 'antd';

import type { BlogComment } from '@/entities/blog';

import { CommentItem } from './comment-item';

type CommentListProps = {
  readonly comments: readonly BlogComment[];
  readonly onReply?: (comment: BlogComment) => void;
};

const MAX_NESTING_LEVEL = 5;

const { Title } = Typography;
const LABEL_COMMENTS = '评论';
const LABEL_NO_COMMENTS = '暂无评论';

/**
 * 将树形评论扁平化为一维列表，保留嵌套缩进。
 * 超过 MAX_NESTING_LEVEL 的评论仍渲染，但不再增加缩进。
 */
function flattenComments(comments: readonly BlogComment[]): readonly BlogComment[] {
  const byParent = new Map<string, BlogComment[]>();
  const roots: BlogComment[] = [];

  for (const comment of comments) {
    if (comment.parentId) {
      const siblings = byParent.get(comment.parentId) ?? [];
      siblings.push(comment);
      byParent.set(comment.parentId, siblings);
    } else {
      roots.push(comment);
    }
  }

  const result: BlogComment[] = [];

  function walk(comment: BlogComment) {
    result.push(comment);
    const children = byParent.get(comment.id);
    if (children) {
      for (const child of children) {
        walk(child);
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return result;
}

export function CommentList({ comments, onReply }: CommentListProps) {
  const visibleComments = comments.filter((c) => !c.isHidden);

  if (visibleComments.length === 0) {
    return <p className="text-text-tertiary">{LABEL_NO_COMMENTS}</p>;
  }

  const flat = flattenComments(visibleComments);

  return (
    <section aria-label={LABEL_COMMENTS}>
      <Title level={3}>{LABEL_COMMENTS}</Title>

      <div className="flex flex-col gap-4">
        {flat.map((comment) => {
          const indentLevel = Math.min(comment.nestingLevel, MAX_NESTING_LEVEL);
          return (
            <div key={comment.id} className="blog-comment-indent" style={{ '--blog-indent-level': indentLevel } as React.CSSProperties}>
              <CommentItem comment={comment} onReply={onReply} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
