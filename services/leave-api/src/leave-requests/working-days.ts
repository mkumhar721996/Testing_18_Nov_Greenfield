export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

/** True only for a real calendar date written as YYYY-MM-DD: no time of day, no half-day suffix. */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const time = toUtc(value);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Monday-Friday days from start to end inclusive, minus company holidays. */
export function countWorkingDays(start: string, end: string, holidays: ReadonlySet<string>): number {
  let days = 0;
  for (let time = toUtc(start); time <= toUtc(end); time += DAY_MS) {
    const date = new Date(time);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (holidays.has(date.toISOString().slice(0, 10))) continue;
    days += 1;
  }
  return days;
}
