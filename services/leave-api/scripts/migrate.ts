import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

// Applies migrations/*.sql in filename order, once each, tracked in schema_migrations.
async function migrate(): Promise<void> {
  // ESM (no "type" field, native strip-types): __dirname does not exist.
  const dir = fileURLToPath(new URL('../migrations', import.meta.url));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // One dedicated session holds an advisory lock so concurrent runners serialise.
  const lock = await pool.connect();
  try {
    await lock.query('select pg_advisory_lock(hashtext($1))', ['schema_migrations']);
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
        // A failed rollback must not mask the original migration error.
        await client.query('rollback').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await lock.query('select pg_advisory_unlock(hashtext($1))', ['schema_migrations']).catch(() => undefined);
    lock.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
