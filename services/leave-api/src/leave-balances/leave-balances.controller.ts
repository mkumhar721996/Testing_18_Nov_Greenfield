import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { CurrentEmployee } from '../auth/current-employee.decorator';
import type { LeaveBalancesResponse } from './leave-balances.dto';
import { LeaveBalancesService } from './leave-balances.service';

@Controller('leave-balances')
export class LeaveBalancesController {
  constructor(private readonly service: LeaveBalancesService) {}

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  getMine(@CurrentEmployee() employeeId: string): Promise<LeaveBalancesResponse> {
    return this.service.getForEmployee(employeeId);
  }
}
