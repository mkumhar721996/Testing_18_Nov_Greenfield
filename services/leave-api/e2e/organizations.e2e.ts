import { expect, test } from '@playwright/test';
import { Pool } from 'pg';

// Requires DATABASE_URL pointing at a migrated database (`pnpm migrate`).
test.skip(!process.env.DATABASE_URL, 'DATABASE_URL is not set');

test('GET /organizations lists the seeded organizations', async ({ request }) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('delete from organizations');
    for (const n of ['A', 'B', 'C']) {
      await pool.query(
        `insert into organizations (id, name, address, created_by, contact_name, contact_details)
         values (gen_random_uuid(), $1, '1 Main St', 'Test Creator', 'Test Contact', 'contact details')`,
        [`Org ${n}`],
      );
    }
    const res = await request.get('/organizations');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveLength(3);
  } finally {
    await pool.end();
  }
});
