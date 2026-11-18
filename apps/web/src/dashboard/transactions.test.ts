import {
  formatTxnAmount,
  formatTxnDate,
  selectRecentTransactions,
  type Transaction,
} from './transactions'

const t = (id: string, postedOn: string): Transaction => ({
  id,
  description: id,
  postedOn,
  category: 'Food',
  accountName: 'A',
  amount: -1,
})

const four = [
  t('a', '2026-11-12'),
  t('b', '2026-11-17'),
  t('c', '2026-11-14'),
  t('d', '2026-11-15'),
]
const five = [...four, t('oldest', '2026-10-01')]

describe('selectRecentTransactions', () => {
  it('orders newest first', () => {
    expect(
      selectRecentTransactions([
        t('a', '2026-11-12'),
        t('b', '2026-11-17'),
        t('c', '2026-11-14'),
      ]).map((x) => x.id),
    ).toEqual(['b', 'c', 'a'])
  })

  it('keeps only 4 of 5', () => {
    expect(selectRecentTransactions(five)).toHaveLength(4)
    expect(selectRecentTransactions(five).map((x) => x.id)).not.toContain('oldest')
  })

  it('keeps all 4 when exactly 4', () => {
    expect(selectRecentTransactions(four)).toHaveLength(4)
  })

  it('does not mutate its input', () => {
    const input = [t('a', '2026-11-12'), t('b', '2026-11-17')]
    selectRecentTransactions(input)
    expect(input[0].id).toBe('a')
  })
})

describe('formatting', () => {
  it('formats dates and amounts', () => {
    expect(formatTxnDate('2026-11-17')).toBe('17 Nov')
    expect(formatTxnAmount(-3450)).toBe('−₹3,450')
    expect(formatTxnAmount(12500)).toBe('+₹12,500')
    expect(formatTxnAmount(-642.5)).toBe('−₹642.50')
    expect(formatTxnAmount(-9600000)).toBe('−₹96,00,000')
  })
})
