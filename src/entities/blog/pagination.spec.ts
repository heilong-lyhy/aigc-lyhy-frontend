// src/entities/blog/pagination.spec.ts

import { describe, expect, it } from 'vitest';

import { isEmptyPage, toCurrentPage, toEffectiveTotal, toPaginationInput } from './pagination';

describe('toCurrentPage', () => {
  it('returns page directly from pagination', () => {
    expect(toCurrentPage({ page: 1, pageSize: 10 })).toBe(1);
  });

  it('returns page 2', () => {
    expect(toCurrentPage({ page: 2, pageSize: 10 })).toBe(2);
  });

  it('returns page 3', () => {
    expect(toCurrentPage({ page: 3, pageSize: 10 })).toBe(3);
  });
});

describe('toPaginationInput', () => {
  it('creates pagination input from page and pageSize', () => {
    expect(toPaginationInput(1, 10)).toEqual({ page: 1, pageSize: 10 });
  });

  it('creates pagination input for page 3 with pageSize 6', () => {
    expect(toPaginationInput(3, 6)).toEqual({ page: 3, pageSize: 6 });
  });
});

describe('toEffectiveTotal', () => {
  it('returns total as-is', () => {
    expect(toEffectiveTotal(42)).toBe(42);
  });

  it('returns 0 for 0', () => {
    expect(toEffectiveTotal(0)).toBe(0);
  });
});

describe('isEmptyPage', () => {
  const emptyData = { items: [] as readonly unknown[], total: 0, current: 1, pageSize: 10 };
  const nonEmptyData = { items: [{ id: '1' }], total: 1, current: 1, pageSize: 10 };

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
