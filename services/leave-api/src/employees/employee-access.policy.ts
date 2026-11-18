import type { Caller } from './employee.types';

/** HR sees everyone, a manager sees their direct reports, an employee sees themself. */
export function canViewEmployee(caller: Caller, employee: { id: string; manager: { id: string } | null }): boolean {
  return caller.isHr || employee.id === caller.employeeId || employee.manager?.id === caller.employeeId;
}
