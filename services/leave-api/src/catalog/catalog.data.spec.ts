import { describe, expect, it } from 'vitest';
import { CATALOG_CATEGORIES } from './catalog.data';

describe('catalog release data', () => {
  it('has unique ids', () => {
    const ids = CATALOG_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every entry a name and description', () => {
    for (const c of CATALOG_CATEGORIES) {
      expect(c.name.trim()).not.toBe('');
      expect(c.description.trim()).not.toBe('');
    }
  });
});
