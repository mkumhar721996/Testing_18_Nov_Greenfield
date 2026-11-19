const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "Mon 8 Dec" for an ISO date (the first ten characters are used). */
export function formatDay(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return `${DAY.format(date)} ${DATE.format(date)}`
}

/** "Mon 8 Dec – Wed 10 Dec", or a single day once. */
export function formatPendingRange(from: string, to: string): string {
  const start = formatDay(from)
  const end = formatDay(to)
  return start === end ? start : `${start} – ${end}`
}

/** "1 day" or "N days". */
export function formatDays(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`
}
