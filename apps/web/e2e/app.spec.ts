import { expect, test } from '@playwright/test'

const txn = (id: string, postedOn: string) => ({
  id,
  description: `Txn ${id}`,
  postedOn,
  category: 'Food',
  accountName: 'Current account ••0937',
  amount: -100,
})

test('home shows 4 recent transactions and View all', async ({ page }) => {
  const five = [
    txn('1', '2026-11-17'),
    txn('2', '2026-11-16'),
    txn('3', '2026-11-15'),
    txn('4', '2026-11-14'),
    txn('5', '2026-11-01'),
  ]
  await page.route('**/api/transactions', (r) => r.fulfill({ json: five }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Recent transactions' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(4)
  await page.getByRole('button', { name: 'View all' }).click()
  await expect(page.getByRole('status')).toContainText('not available yet')
})
