import { expect, test } from '@playwright/test'

const categories = [
  { id: 'plumbing', name: 'Plumbing', description: 'Leaks and pipes.' },
  { id: 'electrical', name: 'Electrical', description: 'Wiring and lighting.' },
  { id: 'cleaning', name: 'Cleaning', description: 'Home and office cleaning.' },
  { id: 'appliance-repair', name: 'Appliance repair', description: 'Washing machines and fridges.' },
]

test('catalog lists the categories on a phone without sign-in', async ({ page }) => {
  await page.route('**/service-categories', (route) => route.fulfill({ json: { categories } }))
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/#/catalog')
  for (const c of categories) await expect(page.getByRole('heading', { level: 3, name: c.name })).toBeVisible()
  await expect(page.getByText(/sign in/i)).toHaveCount(0)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
