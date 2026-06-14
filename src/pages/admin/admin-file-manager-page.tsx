// src/pages/admin/admin-file-manager-page.tsx

import { useAdminFiles } from '@/features/blog';

import { FileManager } from './file-manager';

export function AdminFileManagerPage() {
  const { files, isLoadingFiles, isUploading, isDeleting, error, upload, remove, refetchFiles } = useAdminFiles();

  const fileList = files?.items ?? [];

  return (
    <FileManager
      error={error}
      files={fileList}
      isDeleting={isDeleting}
      isLoading={isLoadingFiles}
      isUploading={isUploading}
      onDelete={(id) => remove(Number(id))}
      onRefetch={() => void refetchFiles()}
      onUpload={upload}
    />
  );
}
