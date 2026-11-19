import { describe, expect, it } from 'vitest';
import { CATALOG_CATEGORIES, ServiceCategory } from './catalog.data';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  const service = new CatalogService(CATALOG_CATEGORIES);

  it('lists the four starting categories', () => {
    expect(service.list().categories.map((c) => c.name)).toEqual([
      'Plumbing',
      'Electrical',
      'Cleaning',
      'Appliance repair',
    ]);
  });

  it('gives every category its description', () => {
    for (const c of service.list().categories) expect(c.description.trim().length).toBeGreaterThan(0);
    expect(service.list().categories[0]).toEqual({
      id: 'plumbing',
      name: 'Plumbing',
      description: 'Leaks, blocked drains, taps, toilets, water heaters and pipe repairs.',
    });
  });

  it('lists a category added to the data with no code change', () => {
    const five = [
      ...CATALOG_CATEGORIES,
      { id: 'pest-control', name: 'Pest control', description: 'Ants, cockroaches, rodents and termites.' },
    ];
    expect(new CatalogService(five).list().categories.map((c) => c.id)).toContain('pest-control');
  });

  it('exposes only id, name and description', () => {
    const withPrice = [{ id: 'x', name: 'X', description: 'd', price: 99 } as ServiceCategory];
    expect(Object.keys(new CatalogService(withPrice).list().categories[0]).sort()).toEqual([
      'description',
      'id',
      'name',
    ]);
  });

  it('returns an empty list for empty data', () => {
    expect(new CatalogService([]).list()).toEqual({ categories: [] });
  });
});
