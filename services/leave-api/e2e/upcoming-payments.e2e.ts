import { expect, test } from '@playwright/test';

test('GET /dashboard/upcoming-payments ignores a windowDays query', async ({ request }) => {
  const res = await request.get('/dashboard/upcoming-payments?windowDays=90');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.windowDays).toBe(30);
  expect(Array.isArray(body.payments)).toBe(true);
});
