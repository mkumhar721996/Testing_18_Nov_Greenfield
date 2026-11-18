import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { CurrentEmployee } from '../auth/current-employee.decorator';
import { LeaveBalancesResponse } from './leave-balances.dto';
import { LeaveBalancesService } from './leave-balances.service';

@Controller('leave-balances')
@UseGuards(AuthenticatedGuard)
export class LeaveBalancesController {
  constructor(private readonly service: LeaveBalancesService) {}

  @Get('me')
  getMine(@CurrentEmployee() employeeId: string): Promise<LeaveBalancesResponse> {
    return this.service.getForEmployee(employeeId);
  }
}
