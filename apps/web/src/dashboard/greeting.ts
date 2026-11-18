export type DayPart = 'morning' | 'afternoon' | 'evening'

// Local device time: morning before 12:00, afternoon before 17:00, evening after.
export function dayPartFor(date: Date): DayPart {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function greetingFor(firstName: string, date: Date): string {
  return `Good ${dayPartFor(date)}, ${firstName}`
}
