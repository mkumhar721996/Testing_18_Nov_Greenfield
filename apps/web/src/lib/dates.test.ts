import { countWorkingDays, formatDate, formatRange, heldHolidays } from './dates'

describe('dates', () => {
  it('writes a date out', () => {
    expect(formatDate('2026-12-08')).toBe('Tue 8 Dec')
    expect(formatDate('2026-12-08', true)).toBe('Tue 8 Dec 2026')
  })

  it('writes a range, adding the year outside the current year', () => {
    const now = new Date('2026-11-18T00:00:00Z')
    expect(formatRange('2026-12-08', '2026-12-10', now)).toBe('Tue 8 Dec – Thu 10 Dec')
    expect(formatRange('2027-03-08', '2027-03-10', now)).toBe('Mon 8 Mar 2027 – Wed 10 Mar 2027')
    expect(formatRange('2026-12-08', '2026-12-08', now)).toBe('Tue 8 Dec')
  })

  it('counts weekdays only, minus holidays', () => {
    const holidays = new Set(['2026-12-25'])
    expect(countWorkingDays('2026-12-07', '2026-12-13', holidays)).toBe(5)
    expect(countWorkingDays('2026-12-23', '2026-12-25', holidays)).toBe(2)
  })

  it('lists the holidays that fall on a weekday inside the range', () => {
    const holidays = [
      { date: '2026-12-25', name: 'Christmas Day' },
      { date: '2026-12-26', name: 'Boxing Day' },
    ]
    expect(heldHolidays('2026-12-23', '2026-12-28', holidays).map((h) => h.name)).toEqual(['Christmas Day'])
  })
})
