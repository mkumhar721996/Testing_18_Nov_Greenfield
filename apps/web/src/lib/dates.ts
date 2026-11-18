import type { Holiday } from '../api/leaveApi'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_MS = 24 * 60 * 60 * 1000

const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

export function formatDate(iso: string, withYear = false): string {
  const date = new Date(toUtc(iso))
  const base = `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return withYear ? `${base} ${date.getUTCFullYear()}` : base
}

/** "Mon 3 Mar – Fri 7 Mar", with the year added when the range ends outside the current year. */
export function formatRange(start: string, end: string, now: Date = new Date()): string {
  const withYear = new Date(toUtc(end)).getUTCFullYear() !== now.getUTCFullYear()
  return start === end
    ? formatDate(start, withYear)
    : `${formatDate(start, withYear)} – ${formatDate(end, withYear)}`
}

export function plural(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`
}

function weekdays(start: string, end: string): string[] {
  const days: string[] = []
  for (let time = toUtc(start); time <= toUtc(end); time += DAY_MS) {
    const date = new Date(time)
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) days.push(date.toISOString().slice(0, 10))
  }
  return days
}

/** Preview only: the Leave API is the authority on the day count (ADR-0001). */
export function countWorkingDays(start: string, end: string, holidays: ReadonlySet<string>): number {
  return weekdays(start, end).filter((day) => !holidays.has(day)).length
}

export function heldHolidays(start: string, end: string, holidays: Holiday[]): Holiday[] {
  const days = new Set(weekdays(start, end))
  return holidays.filter((holiday) => days.has(holiday.date))
}
