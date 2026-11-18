import { expect, test, type Page } from '@playwright/test'

async function stubOffers(page: Page, offers: { type: string }[]) {
  await page.route('**/offers', (route) => route.fulfill({ json: { offers } }))
}

test('eligible for both shows both tiles', async ({ page }) => {
  await stubOffers(page, [{ type: 'personal-loan' }, { type: 'card-upgrade' }])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Personal loan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Platinum card upgrade' })).toBeVisible()
})

test('personal loan only', async ({ page }) => {
  await stubOffers(page, [{ type: 'personal-loan' }])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Personal loan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Platinum card upgrade' })).toHaveCount(0)
})

test('card upgrade only', async ({ page }) => {
  await stubOffers(page, [{ type: 'card-upgrade' }])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Platinum card upgrade' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Personal loan' })).toHaveCount(0)
})

test('neither shows no offers section', async ({ page }) => {
  await stubOffers(page, [])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Web App' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pre-approved for you' })).toHaveCount(0)
})

test('Apply starts the application journey', async ({ page }) => {
  await stubOffers(page, [{ type: 'personal-loan' }])
  await page.goto('/')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page).toHaveURL(/offers-applications\/apply\?offer=personal-loan/)
})

test('Check starts the check journey', async ({ page }) => {
  await stubOffers(page, [{ type: 'card-upgrade' }])
  await page.goto('/')
  await page.getByRole('button', { name: 'Check' }).click()
  await expect(page).toHaveURL(/offers-applications\/check\?offer=card-upgrade/)
})
