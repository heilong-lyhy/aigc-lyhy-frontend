// src/features/blog/infrastructure/files-api.ts

import type { BlogFile } from '@/entities/blog';

import { executeGraphQL, getGraphQLRuntimeConfig } from '@/shared/graphql';
import { getGraphQLEndpoint } from '@/shared/env';

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

/** 文件列表查询结果 */
export type BlogFileListResult = {
  readonly items: readonly BlogFile[];
  readonly total: number;
  readonly current: number;
  readonly pageSize: number;
};

/** 管理端：查询文件列表 */
export async function fetchBlogFiles(
  pagination: { page: number; pageSize: number },
  filters?: { readonly fileType?: string },
): Promise<BlogFileListResult> {
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

/** 管理端：上传文件（使用原生 fetch + FormData 绕过 Apollo Client，支持 GraphQL Upload） */
export async function uploadBlogFile(input: Readonly<{ file: File }>): Promise<BlogFile> {
  const endpoint = getGraphQLEndpoint();
  const accessToken = getGraphQLRuntimeConfig().getAccessToken?.() ?? null;

  const operations = JSON.stringify({
    query: UPLOAD_FILE_MUTATION.trim(),
    variables: { input: { file: null } },
  });

  const map = JSON.stringify({ '0': ['variables.input.file'] });

  const formData = new FormData();
  formData.append('operations', operations);
  formData.append('map', map);
  formData.append('0', input.file);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    body: formData,
    headers,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`文件上传请求失败：${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? '文件上传失败');
  }

  return mapBlogFile(json.data.uploadBlogFile);
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
