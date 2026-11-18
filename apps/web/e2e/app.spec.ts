import { expect, test } from '@playwright/test'

// The e2e build seeds a signed-in customer (VITE_E2E, see src/main.tsx) so the dashboard actually renders.
test('home page fits a phone screen and offers the menu button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
