// src/entities/blog/pagination.spec.ts

import { describe, expect, it } from 'vitest';

import { isEmptyPage, toCurrentPage, toEffectiveTotal, toPaginationInput } from './pagination';

describe('toCurrentPage', () => {
  it('returns 1 for offset 0', () => {
    expect(toCurrentPage({ offset: 0, limit: 10 })).toBe(1);
  });

  it('returns 2 for offset 10 with limit 10', () => {
    expect(toCurrentPage({ offset: 10, limit: 10 })).toBe(2);
  });

  it('returns 3 for offset 20 with limit 10', () => {
    expect(toCurrentPage({ offset: 20, limit: 10 })).toBe(3);
  });
});

describe('toPaginationInput', () => {
  it('converts page 1 to offset 0', () => {
    expect(toPaginationInput(1, 10)).toEqual({ offset: 0, limit: 10 });
  });

  it('converts page 3 with limit 6 to offset 12', () => {
    expect(toPaginationInput(3, 6)).toEqual({ offset: 12, limit: 6 });
  });
});

describe('toEffectiveTotal', () => {
  it('returns total as-is when hasMore is false', () => {
    expect(toEffectiveTotal(42, false)).toBe(42);
  });

  it('returns total + 1 when hasMore is true', () => {
    expect(toEffectiveTotal(42, true)).toBe(43);
  });
});

describe('isEmptyPage', () => {
  const emptyData = { items: [] as readonly unknown[], total: 0, offset: 0, limit: 10, hasMore: false };
  const nonEmptyData = { items: [{ id: '1' }], total: 1, offset: 0, limit: 10, hasMore: false };

  it('returns true when data has no items and not loading', () => {
    expect(isEmptyPage(emptyData, false, null)).toBe(true);
  });

  it('returns false when data has items', () => {
    expect(isEmptyPage(nonEmptyData, false, null)).toBe(false);
  });

  it('returns false when data is null', () => {
    expect(isEmptyPage(null, false, null)).toBe(false);
  });

  it('returns false when loading', () => {
    expect(isEmptyPage(emptyData, true, null)).toBe(false);
  });

  it('returns false when there is an error', () => {
    expect(isEmptyPage(emptyData, false, 'Error')).toBe(false);
  });
});
