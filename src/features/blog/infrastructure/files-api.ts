// src/features/blog/infrastructure/files-api.ts

import type { BlogFile } from '@/entities/blog';

import { executeGraphQL } from '@/shared/graphql';

// ── DTO：后端原始响应类型，只允许停留在 infrastructure ──

interface BlogFileDTO {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
  readonly createdAt: string;
}

interface UploadBlogFileResultDTO {
  readonly file: BlogFileDTO;
}

// ── Mapper：防腐层，DTO → 前端实体类型 ──

function mapBlogFile(raw: BlogFileDTO): BlogFile {
  return {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    mimeType: raw.mimeType,
    size: raw.size,
    createdAt: raw.createdAt,
  };
}

// ── GraphQL Documents ──

const UPLOAD_FILE_MUTATION = `
  mutation UploadBlogFile($input: UploadBlogFileInput!) {
    uploadBlogFile(input: $input) {
      file { id name url mimeType size createdAt }
    }
  }
`;

const DELETE_FILE_MUTATION = `
  mutation DeleteBlogFile($id: ID!) {
    deleteBlogFile(id: $id)
  }
`;

// ── API 函数 ──

export async function uploadBlogFile(input: Readonly<{ file: File }>): Promise<BlogFile> {
  const data = await executeGraphQL<
    { uploadBlogFile: UploadBlogFileResultDTO },
    Record<string, unknown>
  >(UPLOAD_FILE_MUTATION, { input }, { authMode: 'required' });

  return mapBlogFile(data.uploadBlogFile.file);
}

export async function deleteBlogFile(id: string): Promise<boolean> {
  const data = await executeGraphQL<{ deleteBlogFile: boolean }, { id: string }>(
    DELETE_FILE_MUTATION,
    { id },
    { authMode: 'required' },
  );

  return data.deleteBlogFile;
}
