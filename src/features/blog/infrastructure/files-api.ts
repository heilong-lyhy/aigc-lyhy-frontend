// src/features/blog/infrastructure/files-api.ts

import type { BlogFile } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogFileDTO {
  readonly id: number;
  readonly originalName: string;
  readonly storedName: string;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly storagePath: string;
  readonly fileType: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface BlogFileListDTO {
  readonly list: readonly BlogFileDTO[];
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

export function mapBlogFile(raw: BlogFileDTO): BlogFile {
  return {
    id: String(raw.id),
    originalName: raw.originalName,
    storedName: raw.storedName,
    mimeType: raw.mimeType,
    fileSize: raw.fileSize,
    storagePath: raw.storagePath,
    fileType: raw.fileType,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── GraphQL Documents ──

const FILE_FRAGMENT = `
  fragment FileFields on BlogFile {
    id originalName storedName mimeType fileSize storagePath fileType createdAt updatedAt
  }
`;

const FETCH_FILES_QUERY = `
  query FetchBlogFiles($page: Int!, $limit: Int!, $sortBy: String, $sortOrder: SortDirection, $fileType: BlogFileType) {
    blogFiles(page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder, fileType: $fileType) {
      list { ...FileFields }
      current pageSize total
    }
  }
  ${FILE_FRAGMENT}
`;

const UPLOAD_FILE_MUTATION = `
  mutation UploadBlogFile($input: UploadBlogFileInput!) {
    uploadBlogFile(input: $input) { ...FileFields }
  }
  ${FILE_FRAGMENT}
`;

const DELETE_FILE_MUTATION = `
  mutation DeleteBlogFile($id: Int!) {
    deleteBlogFile(id: $id)
  }
`;

// ── API 函数 ──

/** 管理端：查询文件列表 */
export async function fetchBlogFiles(
  pagination: { page: number; pageSize: number },
  filters?: { readonly fileType?: string },
): Promise<{
  items: readonly BlogFile[];
  total: number;
  current: number;
  pageSize: number;
}> {
  const data = await executeGraphQL<{ blogFiles: BlogFileListDTO }, Record<string, unknown>>(
    FETCH_FILES_QUERY,
    {
      page: pagination.page,
      limit: pagination.pageSize,
      fileType: filters?.fileType,
    },
    { authMode: 'required' },
  );

  return {
    items: data.blogFiles.list.map(mapBlogFile),
    total: data.blogFiles.total,
    current: data.blogFiles.current,
    pageSize: data.blogFiles.pageSize,
  };
}

/** 管理端：上传文件 */
export async function uploadBlogFile(input: Readonly<{ file: File }>): Promise<BlogFile> {
  const data = await executeGraphQL<{ uploadBlogFile: BlogFileDTO }, Record<string, unknown>>(
    UPLOAD_FILE_MUTATION,
    { input },
    { authMode: 'required' },
  );

  return mapBlogFile(data.uploadBlogFile);
}

/** 管理端：删除文件 */
export async function deleteBlogFile(id: number): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogFile: boolean }, { id: number }>(
    DELETE_FILE_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogFile;
}
