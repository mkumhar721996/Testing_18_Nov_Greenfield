import { expect, test } from '@playwright/test'

test('home page renders the leave balances heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'My leave balances' })).toBeVisible()
})
