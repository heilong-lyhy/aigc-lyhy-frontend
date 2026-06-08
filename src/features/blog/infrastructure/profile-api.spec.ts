// src/features/blog/infrastructure/profile-api.spec.ts
// 契约测试：验证前端 DTO → Entity 映射与后端 GraphQL 响应结构对齐

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import { fetchBlogProfile, mapBlogProfile, updateBlogProfile } from './profile-api';

const mockExecute = vi.mocked(executeGraphQL);

// ── 模拟后端 BlogProfileObjectType 响应 ──

const sampleProfileDTO = {
  id: 1,
  nickname: '博主',
  bio: '全栈开发者',
  avatarUrl: 'https://example.com/avatar.png',
  socialLinks: { github: 'https://github.com/example', twitter: 'https://twitter.com/example' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('profile-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mapBlogProfile', () => {
    it('应正确映射后端 DTO 到前端实体', () => {
      const result = mapBlogProfile(sampleProfileDTO);

      expect(result.id).toBe('1'); // number → string
      expect(result.nickname).toBe('博主');
      expect(result.bio).toBe('全栈开发者');
      expect(result.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result.socialLinks).toEqual({
        github: 'https://github.com/example',
        twitter: 'https://twitter.com/example',
      });
    });

    it('avatarUrl 为 null 时应保留 null', () => {
      const result = mapBlogProfile({ ...sampleProfileDTO, avatarUrl: null });
      expect(result.avatarUrl).toBeNull();
    });

    it('socialLinks 为 null 时应保留 null', () => {
      const result = mapBlogProfile({ ...sampleProfileDTO, socialLinks: null });
      expect(result.socialLinks).toBeNull();
    });
  });

  describe('fetchBlogProfile', () => {
    it('应调用 blogProfile 查询', async () => {
      mockExecute.mockResolvedValueOnce({ blogProfile: sampleProfileDTO });

      const result = await fetchBlogProfile();

      expect(result).not.toBeNull();
      expect(result!.nickname).toBe('博主');

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('未设置 profile 时应返回 null', async () => {
      mockExecute.mockResolvedValueOnce({ blogProfile: null });

      const result = await fetchBlogProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateBlogProfile', () => {
    it('应使用 input 对象更新 profile', async () => {
      mockExecute.mockResolvedValueOnce({ updateBlogProfile: { ...sampleProfileDTO, nickname: '新博主' } });

      const result = await updateBlogProfile({ nickname: '新博主' });

      expect(result.nickname).toBe('新博主');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.nickname).toBe('新博主');
      expect(options?.authMode).toBe('required');
    });
  });
});
