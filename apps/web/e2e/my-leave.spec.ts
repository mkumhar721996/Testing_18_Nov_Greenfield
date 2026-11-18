import { expect, test, type Page } from '@playwright/test'

const options = {
  approverName: 'Arjun Mehta',
  leaveTypes: [
    { id: 'annual', name: 'Annual leave', availableDays: 10 },
    { id: 'casual', name: 'Casual leave', availableDays: 3 },
  ],
  holidays: [],
}

async function stubApi(page: Page) {
  let requests: Record<string, unknown>[] = []
  await page.route('**/api/leave-requests**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/options')) return route.fulfill({ json: options })
    if (url.pathname.endsWith('/cancel')) {
      requests = requests.map((r) => ({ ...r, status: 'cancelled' }))
      return route.fulfill({ json: requests[0] })
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON()
      if (body.endDate === '2026-12-31') {
        return route.fulfill({
          status: 422,
          json: { code: 'insufficient_balance', field: 'type', message: 'You have 3 days of Casual leave available.' },
        })
      }
      const created = { id: 'r1', employeeId: 'emp-demo', days: 3, status: 'pending', submittedOn: '2026-11-18', ...body }
      requests = [created]
      return route.fulfill({ status: 201, json: created })
    }
    return route.fulfill({ json: requests })
  })
}

test('request, refusal and cancel', async ({ page }) => {
  await stubApi(page)
  await page.goto('/')
  await expect(page.getByText("You haven't requested any leave yet.")).toBeVisible()

  await page.getByRole('button', { name: 'Request leave' }).first().click()
  await page.getByLabel('Leave type').selectOption('casual')
  await page.getByLabel('First day').fill('2026-12-28')
  await page.getByLabel('Last day').fill('2026-12-31')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByRole('alert')).toContainText('3 days of Casual leave')

  await page.getByLabel('First day').fill('2026-11-30')
  await page.getByLabel('Last day').fill('2026-12-02')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText("You'll be emailed when it's decided.")).toBeVisible()
  await expect(page.getByText('Pending')).toBeVisible()

  await page.getByRole('button', { name: /^Cancel request for/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel request' }).click()
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()
})
