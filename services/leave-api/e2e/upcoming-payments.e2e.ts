import { expect, test } from '@playwright/test';

// Nothing sets `req.customerId` until the auth-guard story lands, so every request is unauthenticated;
// the success path (30-day window, `windowDays` ignored) is covered by the service/controller specs.
test('GET /dashboard/upcoming-payments rejects a request with no authenticated customer', async ({ request }) => {
  const res = await request.get('/dashboard/upcoming-payments?windowDays=90');
  expect(res.status()).toBe(401);
});
