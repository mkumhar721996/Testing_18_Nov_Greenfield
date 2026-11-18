import { expect, test } from '@playwright/test';

test('GET /leave-balances/me returns only the calling employee balances', async ({ request }) => {
  const res = await request.get('/leave-balances/me', {
    headers: { 'x-test-employee-id': 'emp-a' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.balances.map((b: { balanceDays: number }) => b.balanceDays)).toEqual([10, 4]);
  expect(JSON.stringify(body)).not.toContain('99');
});

test('GET /leave-balances/me without a principal is rejected', async ({ request }) => {
  const res = await request.get('/leave-balances/me');
  expect(res.status()).toBe(401);
});
