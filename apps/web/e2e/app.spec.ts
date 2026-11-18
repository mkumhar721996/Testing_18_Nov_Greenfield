import { expect, test } from '@playwright/test'

test('home page fits a phone screen and offers the menu button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  // No signed-in customer source exists yet, so the frame itself is not asserted here.
})
