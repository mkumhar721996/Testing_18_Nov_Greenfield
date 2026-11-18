import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Param, Query, Req } from '@nestjs/common';
import { CallerProvider } from './caller.provider';
import { canViewEmployee } from './employee-access.policy';
import type { EmployeeDto, EmployeeRecordDto, EmployeeStatusFilter } from './employee.types';
import { EmployeesService } from './employees.service';

const STATUSES: EmployeeStatusFilter[] = ['active', 'inactive', 'all'];

// Read-only on purpose: name and manager are owned by Entra ID, so there is no write route.
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly callers: CallerProvider,
  ) {}

  @Get()
  async list(@Req() req: unknown, @Query('status') status: string = 'active'): Promise<EmployeeDto[]> {
    const caller = await this.callers.getCaller(req);
    if (!STATUSES.includes(status as EmployeeStatusFilter)) throw new BadRequestException('invalid status');
    const all = await this.employees.list(status as EmployeeStatusFilter);
    return all.filter((e) => canViewEmployee(caller, e));
  }

  @Get(':id')
  async get(@Req() req: unknown, @Param('id') id: string): Promise<EmployeeRecordDto> {
    const caller = await this.callers.getCaller(req);
    const record = await this.employees.get(id);
    if (!record) throw new NotFoundException();
    if (!canViewEmployee(caller, record)) throw new ForbiddenException();
    return record;
  }
}
