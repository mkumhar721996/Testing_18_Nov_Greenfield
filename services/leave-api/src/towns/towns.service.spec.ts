import { describe, expect, it } from 'vitest';
import { TOWNS } from './towns.data';
import { TownsService } from './towns.service';
import { TownsController } from './towns.controller';

describe('TownsService', () => {
  it('lists the shared towns, no more and no fewer (AC6)', () => {
    expect(new TownsService(TOWNS).list().towns.map((t) => t.name)).toEqual([
      'Pune',
      'Mumbai',
      'Chennai',
      'Hyderabad',
      'Bengaluru',
      'Delhi',
      'Kolkata',
      'Ahmedabad',
    ]);
  });

  it('exposes only id and name', () => {
    const extra = [{ id: 'x', name: 'X', secret: 1 } as (typeof TOWNS)[number]];
    expect(new TownsService(extra).list().towns).toEqual([{ id: 'x', name: 'X' }]);
  });
});

describe('TownsController', () => {
  it('serves exactly the shared list with no guard (AC3, AC6)', () => {
    expect(Reflect.getMetadata('__guards__', TownsController)).toBeUndefined();
    expect(new TownsController(new TownsService(TOWNS)).list().towns.map((t) => t.name)).toEqual(
      TOWNS.map((t) => t.name),
    );
  });
});
