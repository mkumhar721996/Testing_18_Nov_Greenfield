import { Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './clock';
import { EmployeeHeaderGuard } from './current-employee';
import { InMemoryLeavePolicy, LEAVE_POLICY } from './leave-policy.port';
import { LeaveRequestsController } from './leave-requests.controller';
import { InMemoryLeaveRequestRepository, LEAVE_REQUEST_REPOSITORY } from './leave-requests.repository';
import { LeaveRequestsService } from './leave-requests.service';

@Module({
  controllers: [LeaveRequestsController],
  providers: [
    LeaveRequestsService,
    EmployeeHeaderGuard,
    { provide: LEAVE_REQUEST_REPOSITORY, useClass: InMemoryLeaveRequestRepository },
    { provide: LEAVE_POLICY, useClass: InMemoryLeavePolicy },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class LeaveRequestsModule {}
