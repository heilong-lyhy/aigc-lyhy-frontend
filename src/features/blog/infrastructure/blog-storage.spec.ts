// @vitest-environment happy-dom
// src/features/blog/infrastructure/blog-storage.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { blogStorage } from './blog-storage';

describe('blogStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Draft ──

  describe('saveDraft / loadDraft / clearDraft', () => {
    it('saves and loads a draft', () => {
      blogStorage.saveDraft({
        title: 'My Draft',
        content: 'Hello',
        categoryId: null,
        tags: ['ts'],
      });

      const draft = blogStorage.loadDraft();

      expect(draft).not.toBeNull();
      expect(draft!.title).toBe('My Draft');
      expect(draft!.content).toBe('Hello');
      expect(draft!.categoryId).toBeNull();
      expect(draft!.tags).toEqual(['ts']);
      expect(draft!.savedAt).toBeTruthy();
    });

    it('returns null when no draft exists', () => {
      expect(blogStorage.loadDraft()).toBeNull();
    });

    it('clears the draft', () => {
      blogStorage.saveDraft({ title: 'x', content: 'y', categoryId: null, tags: [] });
      blogStorage.clearDraft();

      expect(blogStorage.loadDraft()).toBeNull();
    });

    it('returns null when stored draft is invalid JSON', () => {
      localStorage.setItem('blog:draft', '{invalid');

      expect(blogStorage.loadDraft()).toBeNull();
    });
  });

  // ── Search History ──

  describe('getSearchHistory / addSearchHistory / clearSearchHistory', () => {
    it('returns empty array when no history exists', () => {
      expect(blogStorage.getSearchHistory()).toEqual([]);
    });

    it('adds keyword to history and deduplicates', () => {
      blogStorage.addSearchHistory('react');
      blogStorage.addSearchHistory('vue');
      blogStorage.addSearchHistory('react');

      const history = blogStorage.getSearchHistory();

      expect(history).toEqual(['react', 'vue']);
    });

    it('moves existing keyword to front on re-add', () => {
      blogStorage.addSearchHistory('react');
      blogStorage.addSearchHistory('vue');
      blogStorage.addSearchHistory('react');

      expect(blogStorage.getSearchHistory()[0]).toBe('react');
    });

    it('respects maxItems limit', () => {
      for (let i = 0; i < 25; i++) {
        blogStorage.addSearchHistory(`keyword-${i}`, 20);
      }

      const history = blogStorage.getSearchHistory();

      expect(history).toHaveLength(20);
      // Most recent first
      expect(history[0]).toBe('keyword-24');
    });

    it('clears search history', () => {
      blogStorage.addSearchHistory('test');
      blogStorage.clearSearchHistory();

      expect(blogStorage.getSearchHistory()).toEqual([]);
    });

    it('returns empty array when stored history is not an array', () => {
      localStorage.setItem('blog:search-history', '"not-array"');

      expect(blogStorage.getSearchHistory()).toEqual([]);
    });

    it('filters non-string items from stored history', () => {
      localStorage.setItem('blog:search-history', JSON.stringify(['valid', 123, null, 'also-valid']));

      const history = blogStorage.getSearchHistory();

      expect(history).toEqual(['valid', 'also-valid']);
    });
  });

  // ── Admin Preferences ──

  describe('getAdminPreferences / setAdminPreference / clearAdminPreferences', () => {
    it('returns empty object when no preferences exist', () => {
      expect(blogStorage.getAdminPreferences()).toEqual({});
    });

    it('sets and gets a preference', () => {
      blogStorage.setAdminPreference('theme', 'dark');

      expect(blogStorage.getAdminPreferences()).toEqual({ theme: 'dark' });
    });

    it('merges new preference with existing ones', () => {
      blogStorage.setAdminPreference('theme', 'dark');
      blogStorage.setAdminPreference('lang', 'zh');

      expect(blogStorage.getAdminPreferences()).toEqual({ theme: 'dark', lang: 'zh' });
    });

    it('overwrites existing preference key', () => {
      blogStorage.setAdminPreference('theme', 'dark');
      blogStorage.setAdminPreference('theme', 'light');

      expect(blogStorage.getAdminPreferences()).toEqual({ theme: 'light' });
    });

    it('clears all preferences', () => {
      blogStorage.setAdminPreference('theme', 'dark');
      blogStorage.clearAdminPreferences();

      expect(blogStorage.getAdminPreferences()).toEqual({});
    });

    it('returns empty object when stored value is an array', () => {
      localStorage.setItem('blog:admin-preferences', '[1,2,3]');

      expect(blogStorage.getAdminPreferences()).toEqual({});
    });

    it('returns empty object when stored value is invalid JSON', () => {
      localStorage.setItem('blog:admin-preferences', 'not-json');

      expect(blogStorage.getAdminPreferences()).toEqual({});
    });
  });

  // ── Storage unavailable ──

  describe('when localStorage throws', () => {
    it('loadDraft returns null when getItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(blogStorage.loadDraft()).toBeNull();
      spy.mockRestore();
    });

    it('saveDraft does not throw when setItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => blogStorage.saveDraft({ title: 'x', content: 'y', categoryId: null, tags: [] })).not.toThrow();
      spy.mockRestore();
    });

    it('clearDraft does not throw when removeItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => blogStorage.clearDraft()).not.toThrow();
      spy.mockRestore();
    });
  });
});
