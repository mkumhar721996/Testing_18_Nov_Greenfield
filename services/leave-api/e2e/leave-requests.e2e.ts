import { expect, test } from '@playwright/test';

function weekdayAhead(days: number): string {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const as = (id: string) => ({ headers: { 'x-employee-id': id } });

test('submit, list, cancel and isolation', async ({ request }) => {
  const day = weekdayAhead(30);
  const created = await request.post('/leave-requests', {
    ...as('e2e-a'),
    data: { leaveTypeId: 'annual', startDate: day, endDate: day },
  });
  expect(created.status()).toBe(201);
  const mine = await created.json();
  expect(mine.status).toBe('pending');

  const other = await request.post('/leave-requests', {
    ...as('e2e-b'),
    data: { leaveTypeId: 'annual', startDate: day, endDate: day },
  });
  const theirs = await other.json();

  const listed = await (await request.get('/leave-requests', as('e2e-a'))).json();
  expect(listed.map((r: { id: string }) => r.id)).toEqual([mine.id]);

  expect((await request.post(`/leave-requests/${theirs.id}/cancel`, as('e2e-a'))).status()).toBe(404);

  const overlap = await request.post('/leave-requests', {
    ...as('e2e-a'),
    data: { leaveTypeId: 'annual', startDate: day, endDate: day },
  });
  expect(overlap.status()).toBe(422);
  expect((await overlap.json()).code).toBe('overlap');

  const cancelled = await request.post(`/leave-requests/${mine.id}/cancel`, as('e2e-a'));
  expect((await cancelled.json()).status).toBe('cancelled');
});

test('refuses a request without the caller principal', async ({ request }) => {
  expect((await request.get('/leave-requests')).status()).toBe(401);
});
