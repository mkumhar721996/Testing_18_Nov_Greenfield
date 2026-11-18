import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/pool.provider';
import type { ApprovalRow, EmployeeRow, EmployeeStatusFilter } from './employee.types';

export abstract class EmployeesRepository {
  abstract list(status: EmployeeStatusFilter): Promise<EmployeeRow[]>;
  abstract findById(id: string): Promise<{ employee: EmployeeRow; approvals: ApprovalRow[] } | null>;
}

const SELECT = `
  SELECT e.id, e.display_name AS "displayName", e.email, e.job_title AS "jobTitle", e.department, e.active,
         e.manager_id AS "managerId", m.display_name AS "managerName"
    FROM employees e LEFT JOIN employees m ON m.id = e.manager_id`;

@Injectable()
export class PgEmployeesRepository extends EmployeesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {
    super();
  }

  async list(status: EmployeeStatusFilter): Promise<EmployeeRow[]> {
    const where = status === 'all' ? '' : 'WHERE e.active = $1';
    const res = await this.pool.query(`${SELECT} ${where} ORDER BY e.display_name`, status === 'all' ? [] : [status === 'active']);
    return res.rows;
  }

  async findById(id: string) {
    const res = await this.pool.query(`${SELECT} WHERE e.id = $1`, [id]);
    if (res.rows.length === 0) return null;
    const approvals = await this.pool.query(
      `SELECT id, status, routed_manager_id AS "routedManagerId", created_at AS "createdAt"
         FROM leave_approvals WHERE employee_id = $1 ORDER BY created_at DESC`,
      [id],
    );
    return { employee: res.rows[0], approvals: approvals.rows };
  }
}
