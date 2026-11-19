import { expect, test } from '@playwright/test';

test('GET /service-categories is public and lists the categories', async ({ request }) => {
  const res = await request.get('/service-categories');
  expect(res.status()).toBe(200);
  expect((await res.json()).categories).toHaveLength(4);
});

test('the catalog has no write routes', async ({ request }) => {
  for (const method of ['post', 'put', 'patch', 'delete'] as const) {
    const res = await request[method]('/service-categories', { data: {} });
    expect(res.status()).toBe(404);
  }
});
