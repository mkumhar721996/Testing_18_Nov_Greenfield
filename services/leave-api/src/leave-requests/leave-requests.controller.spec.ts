import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SystemClock } from './clock';
import { EmployeeHeaderGuard } from './current-employee';
import { InMemoryLeavePolicy } from './leave-policy.port';
import { LeaveRequestsController } from './leave-requests.controller';
import { InMemoryLeaveRequestRepository } from './leave-requests.repository';
import { LeaveRequestsService } from './leave-requests.service';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('EmployeeHeaderGuard', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('puts the x-employee-id header on the request as the principal', () => {
    process.env.NODE_ENV = 'test';
    const request = { headers: { 'x-employee-id': 'emp-a' } };
    expect(new EmployeeHeaderGuard().canActivate(contextFor(request))).toBe(true);
    expect(request).toMatchObject({ employeeId: 'emp-a' });
  });

  it('refuses a request without the header', () => {
    process.env.NODE_ENV = 'test';
    expect(() => new EmployeeHeaderGuard().canActivate(contextFor({ headers: {} }))).toThrow(UnauthorizedException);
  });

  it('refuses every request in production', () => {
    process.env.NODE_ENV = 'production';
    const request = { headers: { 'x-employee-id': 'emp-a' } };
    expect(() => new EmployeeHeaderGuard().canActivate(contextFor(request))).toThrow(UnauthorizedException);
  });
});

describe('LeaveRequestsController', () => {
  let controller: LeaveRequestsController;
  const startDate = () => {
    const d = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  beforeEach(() => {
    controller = new LeaveRequestsController(
      new LeaveRequestsService(new InMemoryLeaveRequestRepository(), new InMemoryLeavePolicy(), new SystemClock()),
    );
  });

  it('AC7: lists only the calling employee’s requests', () => {
    const day = startDate();
    const a = controller.submit('emp-a', { leaveTypeId: 'annual', startDate: day, endDate: day });
    const b = controller.submit('emp-b', { leaveTypeId: 'annual', startDate: day, endDate: day });
    expect(controller.list('emp-a').map((r) => r.id)).toEqual([a.id]);
    expect(controller.list('emp-b').map((r) => r.id)).toEqual([b.id]);
  });

  it('cancels the caller’s own pending request but not another employee’s', () => {
    const day = startDate();
    const b = controller.submit('emp-b', { leaveTypeId: 'annual', startDate: day, endDate: day });
    expect(() => controller.cancel('emp-a', b.id)).toThrowError(expect.objectContaining({ status: 404 }));
    expect(controller.cancel('emp-b', b.id).status).toBe('cancelled');
  });

  it('treats a malformed body as invalid dates, not a server error', () => {
    expect(() => controller.submit('emp-a', {} as never)).toThrowError(
      expect.objectContaining({ response: expect.objectContaining({ code: 'invalid_date' }) }),
    );
  });

  it('returns the form options', () => {
    expect(controller.options('emp-a')).toMatchObject({
      leaveTypes: expect.arrayContaining([expect.objectContaining({ id: 'casual', availableDays: 3 })]),
      approverName: expect.any(String),
    });
  });
});
