import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

// Applies migrations/*.sql in filename order, once each, tracked in schema_migrations.
async function migrate(): Promise<void> {
  const dir = join(__dirname, '..', 'migrations');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('create table if not exists schema_migrations (name text primary key)');
    const done = new Set(
      (await pool.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name),
    );
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(readFileSync(join(dir, file), 'utf8'));
        await client.query('insert into schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query('rollback');
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
