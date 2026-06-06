// src/features/blog/infrastructure/files-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { deleteBlogFile, mapBlogFile, uploadBlogFile } from './files-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleDTO = {
  id: 'f1',
  name: 'photo.jpg',
  url: 'https://cdn.example.com/photo.jpg',
  mimeType: 'image/jpeg',
  size: 204800,
  createdAt: '2024-06-01T00:00:00Z',
};

describe('files-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── mapBlogFile ──

  describe('mapBlogFile', () => {
    it('maps DTO to domain entity', () => {
      const result = mapBlogFile(sampleDTO);

      expect(result.id).toBe('f1');
      expect(result.name).toBe('photo.jpg');
      expect(result.url).toBe('https://cdn.example.com/photo.jpg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.size).toBe(204800);
      expect(result.createdAt).toBe('2024-06-01T00:00:00Z');
    });
  });

  // ── uploadBlogFile ──

  describe('uploadBlogFile', () => {
    it('uploads a file with auth required and returns mapped entity', async () => {
      mockExecute.mockResolvedValueOnce({
        uploadBlogFile: { file: sampleDTO },
      });

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await uploadBlogFile({ file });

      expect(result.id).toBe('f1');
      expect(result.name).toBe('photo.jpg');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.file).toBe(file);
      expect(options?.authMode).toBe('required');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Upload failed'));

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(uploadBlogFile({ file })).rejects.toThrow('Upload failed');
    });
  });

  // ── deleteBlogFile ──

  describe('deleteBlogFile', () => {
    it('deletes a file with auth required and returns true', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogFile: true });

      const result = await deleteBlogFile('f1');

      expect(result).toBe(true);

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.id).toBe('f1');
      expect(options?.authMode).toBe('required');
    });

    it('returns false when deletion fails on server', async () => {
      mockExecute.mockResolvedValueOnce({ deleteBlogFile: false });

      const result = await deleteBlogFile('f1');

      expect(result).toBe(false);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(deleteBlogFile('f1')).rejects.toThrow('Forbidden');
    });
  });
});
