import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { LeaveBalancesController } from './leave-balances.controller';
import type { LeaveBalancesService } from './leave-balances.service';

function ctx(request: object): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('LeaveBalancesController', () => {
  it('passes the principal’s employee id and nothing else (AC3)', async () => {
    const service = { getForEmployee: vi.fn().mockResolvedValue({ asOf: '2026-11-18', balances: [] }) };
    const controller = new LeaveBalancesController(service as unknown as LeaveBalancesService);
    await controller.getMine('emp-a');
    expect(service.getForEmployee).toHaveBeenCalledWith('emp-a');
    expect(service.getForEmployee).not.toHaveBeenCalledWith('emp-b');
  });
});

describe('AuthenticatedGuard', () => {
  const guard = new AuthenticatedGuard();

  it('rejects a request without a principal', () => {
    expect(() => guard.canActivate(ctx({}))).toThrow(UnauthorizedException);
  });

  it('allows a request with a principal', () => {
    expect(guard.canActivate(ctx({ principal: { employeeId: 'emp-a' } }))).toBe(true);
  });
});
