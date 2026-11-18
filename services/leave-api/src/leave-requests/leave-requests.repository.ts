import { Injectable } from '@nestjs/common';
import { LeaveRequest } from './leave-request.types';

export interface LeaveRequestRepository {
  insert(request: LeaveRequest): LeaveRequest;
  listByEmployee(employeeId: string): LeaveRequest[];
  findById(id: string): LeaveRequest | undefined;
  update(request: LeaveRequest): LeaveRequest;
}

export const LEAVE_REQUEST_REPOSITORY = Symbol('LEAVE_REQUEST_REPOSITORY');

/** Holds requests in memory until the PostgreSQL adapter lands; requests are lost on restart. */
@Injectable()
export class InMemoryLeaveRequestRepository implements LeaveRequestRepository {
  private readonly requests = new Map<string, LeaveRequest>();

  insert(request: LeaveRequest): LeaveRequest {
    this.requests.set(request.id, { ...request });
    return { ...request };
  }

  listByEmployee(employeeId: string): LeaveRequest[] {
    return [...this.requests.values()].filter((r) => r.employeeId === employeeId).map((r) => ({ ...r }));
  }

  findById(id: string): LeaveRequest | undefined {
    const found = this.requests.get(id);
    return found && { ...found };
  }

  update(request: LeaveRequest): LeaveRequest {
    this.requests.set(request.id, { ...request });
    return { ...request };
  }
}
