const parts = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function dateParts(isoDate: string) {
  const byType = Object.fromEntries(
    parts.formatToParts(new Date(`${isoDate}T00:00:00Z`)).map((p) => [p.type, p.value]),
  )
  return { weekday: byType.weekday, day: byType.day, month: byType.month, year: byType.year }
}

/** "Mon 8 Dec" */
export function formatDay(isoDate: string): string {
  const { weekday, day, month } = dateParts(isoDate)
  return `${weekday} ${day} ${month}`
}

/** "Wed 18 Nov 2026" */
export function formatFullDate(isoDate: string): string {
  return `${formatDay(isoDate)} ${dateParts(isoDate).year}`
}

/** "Mon 8 Dec – Wed 10 Dec", or a single day when the range is one day. */
export function formatPendingRange(from: string, to: string): string {
  return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`
}

/** "1 day" or "N days" */
export function formatDays(days: number): string {
  return days === 1 ? '1 day' : `${days} days`
}
