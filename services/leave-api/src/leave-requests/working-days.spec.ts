import { describe, expect, it } from 'vitest';
import { countWorkingDays, isValidIsoDate } from './working-days';

describe('isValidIsoDate', () => {
  it('accepts a whole-day ISO date', () => {
    expect(isValidIsoDate('2026-12-08')).toBe(true);
  });

  it.each(['2026-12-08T12:00', '2026-12-08 AM', '2026-02-30', '08/12/2026', ''])('rejects %j', (value) => {
    expect(isValidIsoDate(value)).toBe(false);
  });
});

describe('countWorkingDays', () => {
  it('counts Monday to Sunday as five days', () => {
    expect(countWorkingDays('2026-12-07', '2026-12-13', new Set())).toBe(5);
  });

  it('excludes company holidays', () => {
    expect(countWorkingDays('2026-12-23', '2026-12-25', new Set(['2026-12-25']))).toBe(2);
  });

  it('counts a single weekday as one day and a weekend day as none', () => {
    expect(countWorkingDays('2026-12-08', '2026-12-08', new Set())).toBe(1);
    expect(countWorkingDays('2026-12-12', '2026-12-12', new Set())).toBe(0);
  });
});
