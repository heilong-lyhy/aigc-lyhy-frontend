// src/features/blog/infrastructure/files-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { deleteBlogFile, fetchBlogFiles, mapBlogFile } from './files-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogFileObjectType 响应 ──

const sampleFileDTO = {
  id: 1,
  originalName: 'photo.png',
  storedName: 'abc123.png',
  mimeType: 'image/png',
  fileSize: 102400,
  storagePath: '/uploads/abc123.png',
  fileType: 'IMAGE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const sampleFileListResponse = {
  list: [sampleFileDTO],
  current: 1,
  pageSize: 10,
  total: 1,
};

describe('files-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mapBlogFile', () => {
    it('应正确映射后端 DTO 到前端实体', () => {
      const result = mapBlogFile(sampleFileDTO);

      expect(result.id).toBe('1'); // number → string
      expect(result.originalName).toBe('photo.png');
      expect(result.storedName).toBe('abc123.png');
      expect(result.mimeType).toBe('image/png');
      expect(result.fileSize).toBe(102400);
      expect(result.storagePath).toBe('/uploads/abc123.png');
      expect(result.fileType).toBe('IMAGE');
    });
  });

  describe('fetchBlogFiles', () => {
    it('应调用 blogFiles 查询并映射分页结果', async () => {
      mockExecute.mockResolvedValueOnce({ blogFiles: sampleFileListResponse });

      const result = await fetchBlogFiles({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].originalName).toBe('photo.png');
      expect(result.total).toBe(1);
      expect(result.current).toBe(1);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.page).toBe(1);
      expect(variables.limit).toBe(10);
      expect(options?.authMode).toBe('required');
    });

    it('应传递 fileType 筛选参数', async () => {
      mockExecute.mockResolvedValueOnce({ blogFiles: { list: [], current: 1, pageSize: 10, total: 0 } });

      await fetchBlogFiles({ page: 1, pageSize: 10 }, { fileType: 'IMAGE' });

      const variables = mockExecute.mock.calls[0][1];
      expect(variables.fileType).toBe('IMAGE');
    });
  });

  describe('deleteBlogFile', () => {
    it('应删除文件', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogFile: true });

      const result = await deleteBlogFile(1);

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe(1);
      expect(options?.authMode).toBe('required');
    });
  });
});
