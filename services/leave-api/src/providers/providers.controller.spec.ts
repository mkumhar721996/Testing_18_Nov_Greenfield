import { describe, expect, it } from 'vitest';
import { PROVIDERS } from './providers.data';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

describe('ProvidersController', () => {
  it('lists providers for anyone, best rated first', () => {
    const { providers } = new ProvidersController(new ProvidersService(PROVIDERS)).list();
    expect(providers.map((p) => p.name)).toEqual([
      'Asha Plumbing Co.',
      'Bright Spark Electrical',
      'Cedar Home Services',
      'Anand Fix-It',
      'Dev Appliance Care',
    ]);
  });

  it('returns an empty list for empty data', () => {
    expect(new ProvidersController(new ProvidersService([])).list()).toEqual({ providers: [] });
  });
});
