import { expect, test } from '@playwright/test'

test('home page renders the My leave requests screen', async ({ page }) => {
  await page.route('**/api/leave-requests**', (route) =>
    route.fulfill({ json: route.request().url().endsWith('/options') ? { leaveTypes: [], holidays: [], approverName: 'Arjun Mehta' } : [] }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'My leave requests' })).toBeVisible()
})
