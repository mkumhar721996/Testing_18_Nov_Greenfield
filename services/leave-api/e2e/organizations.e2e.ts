import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { Pool } from 'pg';

// Requires DATABASE_URL pointing at a migrated database (`pnpm migrate`).
test.skip(!process.env.DATABASE_URL, 'DATABASE_URL is not set');

test('GET /organizations lists the seeded organizations', async ({ request }) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Only touch rows this test created, so it is safe against a shared database.
  const prefix = `e2e-${randomUUID()}`;
  const names = ['A', 'B', 'C'].map((n) => `${prefix} Org ${n}`);
  try {
    for (const name of names) {
      await pool.query(
        `insert into organizations (id, name, address, created_by, contact_name, contact_details)
         values (gen_random_uuid(), $1, '1 Main St', 'Test Creator', 'Test Contact', 'contact details')`,
        [name],
      );
    }
    const res = await request.get('/organizations');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { name: string }[];
    expect(body.map((o) => o.name).filter((n) => n.startsWith(prefix))).toEqual(names);
  } finally {
    await pool.query('delete from organizations where name like $1', [`${prefix}%`]);
    await pool.end();
  }
});
