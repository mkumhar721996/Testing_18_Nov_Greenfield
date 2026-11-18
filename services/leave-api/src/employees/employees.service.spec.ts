import { describe, expect, it } from 'vitest';
import type { ApprovalRow, EmployeeRow, EmployeeStatusFilter } from './employee.types';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

function row(over: Partial<EmployeeRow> = {}): EmployeeRow {
  return {
    id: 'e1',
    displayName: 'Asha Rao',
    email: null,
    jobTitle: null,
    department: null,
    active: true,
    managerId: null,
    managerName: null,
    ...over,
  };
}

class FakeRepository extends EmployeesRepository {
  constructor(
    private rows: EmployeeRow[],
    private approvals: ApprovalRow[] = [],
  ) {
    super();
  }
  async list(status: EmployeeStatusFilter) {
    return this.rows.filter((r) => status === 'all' || r.active === (status === 'active'));
  }
  async findById(id: string) {
    const employee = this.rows.find((r) => r.id === id);
    return employee ? { employee, approvals: this.approvals } : null;
  }
}

const serviceWith = (rows: EmployeeRow[], approvals: ApprovalRow[] = []) =>
  new EmployeesService(new FakeRepository(rows, approvals));

describe('EmployeesService', () => {
  it('AC1: returns a stored employee in the active list', async () => {
    expect((await serviceWith([row()]).list('active')).map((e) => e.id)).toEqual(['e1']);
  });

  it('AC2: shows the manager', async () => {
    const [dto] = await serviceWith([row({ managerId: 'm1', managerName: 'Meera' })]).list('active');
    expect(dto.manager).toEqual({ id: 'm1', displayName: 'Meera' });
  });

  it('AC10: an inactive employee has status inactive', async () => {
    const dto = await serviceWith([row({ active: false })]).get('e1');
    expect(dto?.status).toBe('inactive');
  });

  it('AC11: lists only active by default filter and only inactive on request', async () => {
    const service = serviceWith([row({ id: 'a' }), row({ id: 'i', active: false })]);
    expect((await service.list('active')).map((e) => e.id)).toEqual(['a']);
    expect((await service.list('inactive')).map((e) => e.id)).toEqual(['i']);
    expect(await service.list('all')).toHaveLength(2);
  });

  it('AC12: an inactive employee keeps their approvals', async () => {
    const approvals = [{ id: 'a1', status: 'approved', routedManagerId: null, createdAt: '2026-01-01' }];
    const dto = await serviceWith([row({ active: false })], approvals).get('e1');
    expect(dto?.approvals).toEqual(approvals);
  });

  it('AC13: an active employee without a manager is flagged', async () => {
    const [dto] = await serviceWith([row()]).list('active');
    expect(dto.flags.noManager).toBe(true);
  });

  it('AC14: no flag with a manager, nor for an inactive employee without one', async () => {
    const service = serviceWith([row({ managerId: 'm1', managerName: 'M' }), row({ id: 'i', active: false })]);
    const dtos = await service.list('all');
    expect(dtos.map((d) => d.flags.noManager)).toEqual([false, false]);
  });

  it('returns null for an unknown id', async () => {
    expect(await serviceWith([]).get('nope')).toBeNull();
  });
});
