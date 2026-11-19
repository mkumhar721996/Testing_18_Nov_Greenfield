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

  it('answers a filtered search without credentials (AC3)', () => {
    expect(Reflect.getMetadata('__guards__', ProvidersController)).toBeUndefined();
    expect(Reflect.getMetadata('__guards__', ProvidersController.prototype.list)).toBeUndefined();
    const controller = new ProvidersController(new ProvidersService(PROVIDERS));
    expect(controller.list('Plumbing', 'Pune').providers.length).toBeGreaterThan(0);
    expect(controller.list('Plumbing', 'Kolkata')).toEqual({ providers: [] });
  });

  it('ignores a repeated query parameter beyond the first', () => {
    const controller = new ProvidersController(new ProvidersService(PROVIDERS));
    expect(controller.list(['Plumbing', 'Cleaning'], 'Pune').providers.length).toBe(3);
  });

  it('returns an empty list for empty data', () => {
    expect(new ProvidersController(new ProvidersService([])).list()).toEqual({ providers: [] });
  });
});
