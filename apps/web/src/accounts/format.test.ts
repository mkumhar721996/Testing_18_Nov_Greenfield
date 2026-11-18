import { formatMoney } from './format'

describe('formatMoney', () => {
  it('formats minor units with Indian digit grouping', () => {
    const text = formatMoney(18425000, 'INR')
    expect(text.replace(/\s/g, '')).toBe('₹1,84,250.00')
  })

  it('keeps two decimals', () => {
    expect(formatMoney(6231045, 'INR')).toContain('62,310.45')
  })
})
