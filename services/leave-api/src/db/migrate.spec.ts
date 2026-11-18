import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyMigrations, type Queryable } from './migrate';

class FakeDb implements Queryable {
  applied = new Set<string>();
  executed: string[] = [];
  async query(sql: string, params?: unknown[]) {
    if (sql.startsWith('SELECT name FROM schema_migrations')) {
      return { rows: [...this.applied].map((name) => ({ name })) };
    }
    if (sql.startsWith('INSERT INTO schema_migrations')) this.applied.add(String(params?.[0]));
    else this.executed.push(sql);
    return { rows: [] };
  }
}

function dirWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(dir, name), sql);
  return dir;
}

describe('applyMigrations', () => {
  it('applies files in order, skips applied ones and ignores down scripts', async () => {
    const dir = dirWith({
      '0002_b.sql': 'SELECT 2',
      '0001_a.sql': 'SELECT 1',
      '0001_a.down.sql': 'DROP TABLE a',
    });
    const db = new FakeDb();

    expect(await applyMigrations(db, dir)).toEqual(['0001_a.sql', '0002_b.sql']);
    expect(db.executed.filter((s) => s.startsWith('SELECT'))).toEqual(['SELECT 1', 'SELECT 2']);

    expect(await applyMigrations(db, dir)).toEqual([]);
    expect(db.executed.filter((s) => s.startsWith('SELECT'))).toEqual(['SELECT 1', 'SELECT 2']);
  });
});

describe('0001_employees.sql', () => {
  const sql = readFileSync(join(__dirname, '../../migrations/0001_employees.sql'), 'utf8');

  it('declares the three tables', () => {
    for (const table of ['employees', 'leave_approvals', 'entra_sync_runs']) {
      expect(sql).toContain(`CREATE TABLE ${table} (`);
    }
    expect(sql).toContain('entra_object_id text UNIQUE NOT NULL');
  });

  it('AC12: every foreign key to employees is ON DELETE RESTRICT', () => {
    const fks = sql.match(/REFERENCES employees\(id\)[^,\n]*/g) ?? [];
    expect(fks).toHaveLength(3);
    for (const fk of fks) expect(fk).toContain('ON DELETE RESTRICT');
  });
});
