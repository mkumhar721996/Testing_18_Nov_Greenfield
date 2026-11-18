import { expect, test } from '@playwright/test';

test('GET /offers rejects a request with no signed-in customer', async ({ request }) => {
  const res = await request.get('/offers?customerId=someone-else');
  expect(res.status()).toBe(401);
});
