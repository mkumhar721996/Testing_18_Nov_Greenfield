import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentEmployee, EmployeeHeaderGuard } from './current-employee';
import { LeaveRequest, LeaveRequestOptions, SubmitLeaveRequestInput } from './leave-request.types';
import { LeaveRequestsService } from './leave-requests.service';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

@Controller('leave-requests')
@UseGuards(EmployeeHeaderGuard)
export class LeaveRequestsController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get()
  list(@CurrentEmployee() employeeId: string): LeaveRequest[] {
    return this.service.listOwn(employeeId);
  }

  @Get('options')
  options(@CurrentEmployee() employeeId: string): LeaveRequestOptions {
    return this.service.options(employeeId);
  }

  @Post()
  submit(@CurrentEmployee() employeeId: string, @Body() body: SubmitLeaveRequestInput): LeaveRequest {
    return this.service.submit(employeeId, {
      leaveTypeId: text(body?.leaveTypeId),
      startDate: text(body?.startDate),
      endDate: text(body?.endDate),
      note: text(body?.note).trim() || undefined,
    });
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentEmployee() employeeId: string, @Param('id') id: string): LeaveRequest {
    return this.service.cancel(employeeId, id);
  }
}
