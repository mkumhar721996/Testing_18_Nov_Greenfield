import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AuthenticatedGuard } from './authenticated.guard';

const contextFor = (request: object) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AuthenticatedGuard', () => {
  const guard = new AuthenticatedGuard();

  it('lets a request with a principal through', () => {
    expect(guard.canActivate(contextFor({ principal: { employeeId: 'emp-a' } }))).toBe(true);
  });

  it('rejects a request without a principal with 401', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(UnauthorizedException);
  });

  it('rejects a principal without an employee id', () => {
    expect(() => guard.canActivate(contextFor({ principal: {} }))).toThrow(UnauthorizedException);
  });
});
