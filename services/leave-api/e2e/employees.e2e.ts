import { expect, test } from '@playwright/test';

// Needs DATABASE_URL (the API fails fast without it). No SSO exists yet, so the default
// CallerProvider rejects every employee read with 401.
const id = '00000000-0000-0000-0000-000000000001';

test('AC7: there is no route to change a manager', async ({ request }) => {
  const res = await request.patch(`/employees/${id}/manager`, { data: { managerId: 'other' } });
  expect(res.status()).toBe(404);
});

test('employee reads are rejected until a caller can be identified', async ({ request }) => {
  expect((await request.get('/employees')).status()).toBe(401);
  expect((await request.get(`/employees/${id}`)).status()).toBe(401);
});
