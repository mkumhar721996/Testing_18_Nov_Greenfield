import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

const MIGRATIONS_DIR = join(__dirname, '../../migrations');

/** Applies every not-yet-applied migrations/*.sql in name order; returns the names applied. */
export async function applyMigrations(db: Queryable, dir = MIGRATIONS_DIR): Promise<string[]> {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await db.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    await db.query('BEGIN');
    try {
      await db.query(readFileSync(join(dir, file), 'utf8'));
      await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
    applied.push(file);
  }
  return applied;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  // One connection so BEGIN/COMMIT wrap the same session.
  const client = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const applied = await applyMigrations(client);
    console.log(`applied ${applied.length} migration(s)`);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
