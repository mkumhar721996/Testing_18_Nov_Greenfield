import type { Pool } from 'pg';
import type { EmployeeFields, ExistingEmployee, PendingApproval, SyncPlan } from './plan-sync.js';
import type { RunCounts, RunStatus, SyncStore } from './run-sync.js';

const COLUMN: Record<Exclude<keyof EmployeeFields, 'managerEntraId'>, string> = {
  displayName: 'display_name',
  email: 'email',
  jobTitle: 'job_title',
  department: 'department',
};

export class PgSyncStore implements SyncStore {
  constructor(private readonly pool: Pool) {}

  async load(): Promise<{ employees: ExistingEmployee[]; approvals: PendingApproval[] }> {
    const employees = await this.pool.query(
      `SELECT e.id, e.entra_object_id AS "entraId", e.display_name AS "displayName", e.email,
              e.job_title AS "jobTitle", e.department, m.entra_object_id AS "managerEntraId", e.active
         FROM employees e LEFT JOIN employees m ON m.id = e.manager_id`,
    );
    const approvals = await this.pool.query(
      `SELECT id, employee_id AS "employeeId", status, routed_manager_id AS "routedManagerId"
         FROM leave_approvals WHERE status IN ('pending', 'blocked')`,
    );
    return { employees: employees.rows, approvals: approvals.rows };
  }

  /** One transaction; manager links are set in a second pass so order within the snapshot does not matter. */
  async apply(plan: SyncPlan): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of plan.create) {
        await client.query(
          `INSERT INTO employees (entra_object_id, display_name, email, job_title, department, active, deactivated_at, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN NULL ELSE now() END, now())`,
          [c.entraId, c.displayName, c.email, c.jobTitle, c.department, c.active],
        );
      }
      for (const u of plan.update) {
        for (const [key, column] of Object.entries(COLUMN)) {
          if (key in u.changes) {
            await client.query(`UPDATE employees SET ${column} = $1, synced_at = now() WHERE id = $2`, [
              u.changes[key as keyof typeof COLUMN],
              u.id,
            ]);
          }
        }
      }
      if (plan.reactivate.length > 0) {
        await client.query(
          'UPDATE employees SET active = true, deactivated_at = NULL, synced_at = now() WHERE id = ANY($1::uuid[])',
          [plan.reactivate],
        );
      }
      if (plan.deactivate.length > 0) {
        await client.query(
          'UPDATE employees SET active = false, deactivated_at = now(), synced_at = now() WHERE id = ANY($1::uuid[])',
          [plan.deactivate],
        );
      }
      const links = [
        ...plan.create.filter((c) => c.managerEntraId).map((c) => [c.entraId, c.managerEntraId]),
        ...plan.update.filter((u) => 'managerEntraId' in u.changes).map((u) => [u.entraId, u.changes.managerEntraId ?? null]),
      ];
      for (const [entraId, managerEntraId] of links) {
        await client.query(
          `UPDATE employees SET manager_id = (SELECT id FROM employees WHERE entra_object_id = $2), synced_at = now()
            WHERE entra_object_id = $1`,
          [entraId, managerEntraId],
        );
      }
      for (const a of plan.approvals) {
        await client.query('UPDATE leave_approvals SET status = $2, routed_manager_id = $3 WHERE id = $1', [
          a.id,
          a.status,
          a.routedManagerId,
        ]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async startRun(attempt: number): Promise<string> {
    const res = await this.pool.query(
      "INSERT INTO entra_sync_runs (status, attempt) VALUES ('running', $1) RETURNING id",
      [attempt],
    );
    return String(res.rows[0].id);
  }

  async finishRun(runId: string, status: RunStatus, counts: RunCounts, error: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE entra_sync_runs SET finished_at = now(), status = $2, fetched = $3, created = $4, updated = $5,
              deactivated = $6, skipped = $7, error = $8 WHERE id = $1`,
      [runId, status, counts.fetched, counts.created, counts.updated, counts.deactivated, counts.skipped, error],
    );
  }
}
