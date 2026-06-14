// src/pages/admin/admin-comment-manager-page.tsx

import { useCallback, useState } from 'react';

import { useAdminComments } from '@/features/blog';

import type { BlogCommentStatus, PaginationInput } from '@/entities/blog';

import { CommentManager } from './comment-manager';

export function AdminCommentManagerPage() {
  const [commentPagination, setCommentPagination] = useState<PaginationInput>({ page: 1, pageSize: 10 });
  const [commentStatusFilter, setCommentStatusFilter] = useState<BlogCommentStatus | undefined>(undefined);

  const { data, isLoading, updateStatus, remove, reply, hide, unhide } = useAdminComments({
    pagination: commentPagination,
    status: commentStatusFilter,
    autoLoad: true,
  });

  const handleApprove = useCallback((id: string) => {
    void updateStatus(Number(id), 'approved');
  }, [updateStatus]);

  const handleReject = useCallback((id: string) => {
    void updateStatus(Number(id), 'rejected');
  }, [updateStatus]);

  const handleMarkSpam = handleReject;

  const handleDelete = useCallback((id: string) => {
    void remove(Number(id));
  }, [remove]);

  const handleReply = useCallback((commentId: string, content: string) => {
    const comment = data?.items.find((c) => c.id === commentId);
    if (!comment) return;
    void reply({
      postId: comment.postId,
      content,
      parentId: comment.parentId ?? Number(commentId),
      replyToId: Number(commentId),
    });
  }, [reply, data]);

  const handleHide = useCallback((id: string) => {
    void hide(Number(id));
  }, [hide]);

  const handleUnhide = useCallback((id: string) => {
    void unhide(Number(id));
  }, [unhide]);

  const handleBatchApprove = useCallback((ids: readonly string[]) => {
    void Promise.all(ids.map((id) => updateStatus(Number(id), 'approved')));
  }, [updateStatus]);

  const handleBatchReject = useCallback((ids: readonly string[]) => {
    void Promise.all(ids.map((id) => updateStatus(Number(id), 'rejected')));
  }, [updateStatus]);

  return (
    <CommentManager
      data={data}
      isLoading={isLoading}
      pagination={commentPagination}
      statusFilter={commentStatusFilter}
      onPaginationChange={setCommentPagination}
      onStatusFilterChange={setCommentStatusFilter}
      onApprove={handleApprove}
      onReject={handleReject}
      onMarkSpam={handleMarkSpam}
      onDelete={handleDelete}
      onReply={handleReply}
      onHide={handleHide}
      onUnhide={handleUnhide}
      onBatchApprove={handleBatchApprove}
      onBatchReject={handleBatchReject}
    />
  );
}
