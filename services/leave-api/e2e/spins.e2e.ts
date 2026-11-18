import { expect, test } from '@playwright/test';

test('POST /spins echoes the bet and rejects unknown bets', async ({ request }) => {
  const res = await request.post('/spins', { data: { bet: 25 } });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.bet).toBe(25);
  expect(body.reels).toHaveLength(3);

  const bad = await request.post('/spins', { data: { bet: 7 } });
  expect(bad.status()).toBe(400);
});
