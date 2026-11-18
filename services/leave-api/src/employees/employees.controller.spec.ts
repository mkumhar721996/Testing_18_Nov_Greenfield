import 'reflect-metadata';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CallerProvider, RejectingCallerProvider } from './caller.provider';
import { canViewEmployee } from './employee-access.policy';
import type { Caller } from './employee.types';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

const rows = [
  { id: 'm1', displayName: 'Meera', email: null, jobTitle: null, department: null, active: true, managerId: null, managerName: null },
  { id: 'e1', displayName: 'Asha', email: null, jobTitle: null, department: null, active: true, managerId: 'm1', managerName: 'Meera' },
  { id: 'e2', displayName: 'Ravi', email: null, jobTitle: null, department: null, active: true, managerId: null, managerName: null },
];

class FakeRepository extends EmployeesRepository {
  async list() {
    return rows;
  }
  async findById(id: string) {
    const employee = rows.find((r) => r.id === id);
    return employee ? { employee, approvals: [] } : null;
  }
}

const controllerFor = (caller: Caller) =>
  new EmployeesController(new EmployeesService(new FakeRepository()), {
    getCaller: async () => caller,
  } as CallerProvider);

describe('EmployeesController', () => {
  it('AC6/AC7: exposes only GET handlers, so no route can change a name or manager', () => {
    const proto = EmployeesController.prototype;
    const handlers = Object.getOwnPropertyNames(proto).filter((n) => n !== 'constructor');
    expect(handlers.length).toBeGreaterThan(0);
    for (const name of handlers) {
      // RequestMethod.GET === 0
      expect(Reflect.getMetadata('method', proto[name as keyof typeof proto])).toBe(0);
    }
  });

  it('filters the list to what the caller may see', async () => {
    const asManager = await controllerFor({ employeeId: 'm1', isHr: false }).list({});
    expect(asManager.map((e) => e.id)).toEqual(['m1', 'e1']);
    const asHr = await controllerFor({ employeeId: 'hr', isHr: true }).list({});
    expect(asHr).toHaveLength(3);
  });

  it('rejects an unrelated caller on a record', async () => {
    await expect(controllerFor({ employeeId: 'e2', isHr: false }).get({}, 'e1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects an invalid status', async () => {
    await expect(controllerFor({ employeeId: 'x', isHr: true }).list({}, 'bogus')).rejects.toThrow('invalid status');
  });

  it('the default caller provider rejects with 401', async () => {
    await expect(new RejectingCallerProvider().getCaller()).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('canViewEmployee', () => {
  const employee = { id: 'e1', manager: { id: 'm1' } };
  it.each([
    [{ employeeId: 'hr', isHr: true }, true],
    [{ employeeId: 'm1', isHr: false }, true],
    [{ employeeId: 'e1', isHr: false }, true],
    [{ employeeId: 'other', isHr: false }, false],
  ])('%j -> %s', (caller, expected) => {
    expect(canViewEmployee(caller, employee)).toBe(expected);
  });
});
