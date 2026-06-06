// src/features/blog/infrastructure/profile-api.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/graphql', () => ({
  executeGraphQL: vi.fn(),
}));

import { executeGraphQL } from '@/shared/graphql';

import {
  fetchBlogProfile,
  mapBlogProfile,
  mapSocialLink,
  updateBlogProfile,
} from './profile-api';

const mockExecute = vi.mocked(executeGraphQL);

const sampleSocialLinkDTO = {
  platform: 'github',
  url: 'https://github.com/test',
  icon: null,
};

const sampleProfileDTO = {
  id: 'prof-1',
  nickname: 'TestUser',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Hello world',
  socialLinks: [sampleSocialLinkDTO],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

describe('profile-api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── mapSocialLink ──

  describe('mapSocialLink', () => {
    it('maps DTO to domain entity', () => {
      const result = mapSocialLink(sampleSocialLinkDTO);

      expect(result.platform).toBe('github');
      expect(result.url).toBe('https://github.com/test');
      expect(result.icon).toBeNull();
    });

    it('converts undefined icon to null', () => {
      const result = mapSocialLink({ ...sampleSocialLinkDTO, icon: undefined as unknown as null });
      expect(result.icon).toBeNull();
    });
  });

  // ── mapBlogProfile ──

  describe('mapBlogProfile', () => {
    it('maps DTO to domain entity with social links', () => {
      const result = mapBlogProfile(sampleProfileDTO);

      expect(result.id).toBe('prof-1');
      expect(result.nickname).toBe('TestUser');
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
      expect(result.bio).toBe('Hello world');
      expect(result.socialLinks).toHaveLength(1);
      expect(result.socialLinks[0].platform).toBe('github');
    });

    it('converts undefined avatar to null', () => {
      const result = mapBlogProfile({ ...sampleProfileDTO, avatar: undefined as unknown as null });
      expect(result.avatar).toBeNull();
    });

    it('maps empty social links', () => {
      const result = mapBlogProfile({ ...sampleProfileDTO, socialLinks: [] });
      expect(result.socialLinks).toEqual([]);
    });
  });

  // ── fetchBlogProfile ──

  describe('fetchBlogProfile', () => {
    it('fetches and maps profile without auth', async () => {
      mockExecute.mockResolvedValueOnce({
        blogProfile: sampleProfileDTO,
      });

      const result = await fetchBlogProfile();

      expect(result.id).toBe('prof-1');
      expect(result.nickname).toBe('TestUser');

      const [, , options] = mockExecute.mock.calls[0];
      expect(options?.authMode).toBe('none');
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Server error'));

      await expect(fetchBlogProfile()).rejects.toThrow('Server error');
    });
  });

  // ── updateBlogProfile ──

  describe('updateBlogProfile', () => {
    it('updates profile with auth required and returns mapped entity', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogProfile: { ...sampleProfileDTO, nickname: 'Updated' },
      });

      const result = await updateBlogProfile({ nickname: 'Updated' });

      expect(result.nickname).toBe('Updated');

      const [, variables, options] = mockExecute.mock.calls[0];
      expect(variables.input.nickname).toBe('Updated');
      expect(options?.authMode).toBe('required');
    });

    it('passes socialLinks in input', async () => {
      mockExecute.mockResolvedValueOnce({
        updateBlogProfile: sampleProfileDTO,
      });

      await updateBlogProfile({
        socialLinks: [{ platform: 'twitter', url: 'https://x.com/test', icon: null }],
      });

      expect(mockExecute.mock.calls[0][1].input.socialLinks).toEqual([
        { platform: 'twitter', url: 'https://x.com/test', icon: null },
      ]);
    });

    it('propagates errors from executeGraphQL', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(updateBlogProfile({ nickname: 'x' })).rejects.toThrow('Unauthorized');
    });
  });
});
