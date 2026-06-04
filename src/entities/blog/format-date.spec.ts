// src/entities/blog/format-date.spec.ts

import { describe, expect, it, vi } from 'vitest';

import { formatRelativeDate } from './format-date';

describe('formatRelativeDate', () => {
  it('returns "今天" for today', () => {
    const today = new Date().toISOString();
    expect(formatRelativeDate(today)).toBe('今天');
  });

  it('returns "昨天" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('昨天');
  });

  it('returns "N 天前" for days within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 天前');
  });

  it('returns "N 周前" for days within a month', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 周前');
  });

  it('returns locale date string for dates older than a month', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    vi.setSystemTime(new Date('2024-06-01T00:00:00Z'));
    const result = formatRelativeDate(date.toISOString());
    expect(result).not.toBe('今天');
    expect(result).not.toBe('昨天');
    expect(result).toMatch(/\d/);
    vi.useRealTimers();
  });

  it('returns locale date string for future dates', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const result = formatRelativeDate(tomorrow);
    expect(result).not.toBe('今天');
    expect(result).not.toBe('昨天');
    expect(result).toMatch(/\d/);
  });
});
