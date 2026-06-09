// src/features/blog/infrastructure/url-params.spec.ts

import { describe, expect, it } from 'vitest';

import { applyFilterParams, parseFilterParams } from './url-params';

describe('url-params', () => {
  // ── parseFilterParams ──

  describe('parseFilterParams', () => {
    it('应从空参数返回默认值', () => {
      const result = parseFilterParams(new URLSearchParams());
      expect(result.categoryId).toBeUndefined();
      expect(result.tagId).toBeUndefined();
    });

    it('应解析有效的 categoryId 和 tagId', () => {
      const params = new URLSearchParams('category=5&tag=3');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBe(5);
      expect(result.tagId).toBe(3);
    });

    it('应忽略非数字的参数值', () => {
      const params = new URLSearchParams('category=abc&tag=xyz');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBeUndefined();
      expect(result.tagId).toBeUndefined();
    });

    it('应忽略零和负数', () => {
      const params = new URLSearchParams('category=0&tag=-1');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBeUndefined();
      expect(result.tagId).toBeUndefined();
    });

    it('应忽略小数（取整数部分后不大于 0）', () => {
      const params = new URLSearchParams('category=0.5');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBeUndefined();
    });

    it('应忽略 NaN', () => {
      const params = new URLSearchParams('category=NaN');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBeUndefined();
    });

    it('应忽略 Infinity', () => {
      const params = new URLSearchParams('tag=Infinity');
      const result = parseFilterParams(params);
      expect(result.tagId).toBeUndefined();
    });

    it('应只解析第一个同名参数', () => {
      const params = new URLSearchParams('category=1&category=2');
      const result = parseFilterParams(params);
      expect(result.categoryId).toBe(1);
    });
  });

  // ── applyFilterParams ──

  describe('applyFilterParams', () => {
    it('应设置 categoryId', () => {
      const result = applyFilterParams(new URLSearchParams(), { categoryId: 5 });
      expect(result.get('category')).toBe('5');
    });

    it('应设置 tagId', () => {
      const result = applyFilterParams(new URLSearchParams(), { tagId: 3 });
      expect(result.get('tag')).toBe('3');
    });

    it('应同时设置 categoryId 和 tagId', () => {
      const result = applyFilterParams(new URLSearchParams(), { categoryId: 5, tagId: 3 });
      expect(result.get('category')).toBe('5');
      expect(result.get('tag')).toBe('3');
    });

    it('null 应清除对应参数', () => {
      const prev = new URLSearchParams('category=5&tag=3');
      const result = applyFilterParams(prev, { categoryId: null, tagId: null });
      expect(result.get('category')).toBeNull();
      expect(result.get('tag')).toBeNull();
    });

    it('undefined 应不更新对应参数', () => {
      const prev = new URLSearchParams('category=5&tag=3');
      const result = applyFilterParams(prev, {});
      expect(result.get('category')).toBe('5');
      expect(result.get('tag')).toBe('3');
    });

    it('应保留不相关的参数', () => {
      const prev = new URLSearchParams('other=123');
      const result = applyFilterParams(prev, { categoryId: 1 });
      expect(result.get('other')).toBe('123');
      expect(result.get('category')).toBe('1');
    });

    it('应不修改原始 URLSearchParams', () => {
      const prev = new URLSearchParams('category=5');
      applyFilterParams(prev, { categoryId: 10 });
      expect(prev.get('category')).toBe('5');
    });

    it('应覆盖已有参数值', () => {
      const prev = new URLSearchParams('category=5');
      const result = applyFilterParams(prev, { categoryId: 10 });
      expect(result.get('category')).toBe('10');
    });

    it('categoryId 和 tagId 应互不干扰', () => {
      const prev = new URLSearchParams('tag=3');
      const result = applyFilterParams(prev, { categoryId: 5 });
      expect(result.get('category')).toBe('5');
      expect(result.get('tag')).toBe('3');
    });
  });
});
