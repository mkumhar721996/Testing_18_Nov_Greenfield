import { describe, expect, it } from 'vitest';
import { PROVIDERS, Provider } from './providers.data';
import { ProvidersService, compareProviders } from './providers.service';

const rated = (name: string, average: number, count = 10): Provider => ({
  id: name.toLowerCase(),
  name,
  services: [],
  towns: [],
  rating: { average, count },
});
const unrated = (name: string, rating: Provider['rating'] = null): Provider => ({
  id: name.toLowerCase(),
  name,
  services: [],
  towns: [],
  rating,
});
const names = (data: Provider[]) => new ProvidersService(data).list().providers.map((p) => p.name);

describe('ProvidersService', () => {
  it('shows name, services, towns and average rating (AC1)', () => {
    const asha = new ProvidersService(PROVIDERS).list().providers[0];
    expect(asha).toEqual({
      id: 'asha-plumbing',
      name: 'Asha Plumbing Co.',
      services: ['Plumbing', 'Water heater repair'],
      towns: ['Pune', 'Pimpri-Chinchwad'],
      averageRating: 4.9,
      reviewCount: 124,
    });
  });

  it('lists the highest-rated provider first (AC2)', () => {
    expect(names([rated('Low', 2), rated('High', 4.8), rated('Mid', 3.5)])).toEqual(['High', 'Mid', 'Low']);
  });

  it('lists each provider separately (AC3)', () => {
    expect(new ProvidersService(PROVIDERS).list().providers).toHaveLength(5);
  });

  it('exposes no price or availability (AC4)', () => {
    const withExtras = [{ ...rated('X', 4), price: 99, availability: 'today' } as Provider];
    expect(Object.keys(new ProvidersService(withExtras).list().providers[0]).sort()).toEqual([
      'averageRating',
      'id',
      'name',
      'reviewCount',
      'services',
      'towns',
    ]);
  });

  it('orders equal ratings A-Z, ignoring case (AC5)', () => {
    expect(names([rated('Cedar Home Services', 4.7), rated('Bright Spark Electrical', 4.7)])).toEqual([
      'Bright Spark Electrical',
      'Cedar Home Services',
    ]);
    expect(names([rated('Bcd', 3), rated('abc', 3)])).toEqual(['abc', 'Bcd']);
    expect(compareProviders(rated('B', 3), rated('A', 3))).toBeGreaterThan(0);
  });

  it('puts every unrated provider after every rated one (AC6)', () => {
    const list = names([unrated('Aaa'), rated('Rated Low', 2), unrated('Bbb', { average: 0, count: 0 })]);
    expect(list.indexOf('Rated Low')).toBeLessThan(list.indexOf('Aaa'));
    expect(list.indexOf('Rated Low')).toBeLessThan(list.indexOf('Bbb'));
  });

  it('reports an unrated provider with a null average and no reviews (AC6)', () => {
    expect(new ProvidersService([unrated('Aaa', { average: 0, count: 0 })]).list().providers[0]).toMatchObject({
      averageRating: null,
      reviewCount: 0,
    });
  });

  it('lists unrated providers A-Z (AC7)', () => {
    expect(names([unrated('Zed'), unrated('Mia'), unrated('Abe')])).toEqual(['Abe', 'Mia', 'Zed']);
  });

  it('returns an empty list for empty data', () => {
    expect(new ProvidersService([]).list()).toEqual({ providers: [] });
  });
});
