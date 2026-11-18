import { Injectable } from '@nestjs/common';
import type { EmployeeDto, EmployeeRecordDto, EmployeeRow, EmployeeStatusFilter } from './employee.types';
import { EmployeesRepository } from './employees.repository';

function toDto(row: EmployeeRow): EmployeeDto {
  const manager = row.managerId ? { id: row.managerId, displayName: row.managerName ?? '' } : null;
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department,
    status: row.active ? 'active' : 'inactive',
    manager,
    // Only active people need a manager; HR fixes it in Entra ID.
    flags: { noManager: row.active && manager === null },
  };
}

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  async list(status: EmployeeStatusFilter): Promise<EmployeeDto[]> {
    return (await this.repository.list(status)).map(toDto);
  }

  async get(id: string): Promise<EmployeeRecordDto | null> {
    const found = await this.repository.findById(id);
    return found ? { ...toDto(found.employee), approvals: found.approvals } : null;
  }
}
