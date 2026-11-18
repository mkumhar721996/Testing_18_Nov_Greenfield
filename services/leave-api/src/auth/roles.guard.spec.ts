import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { SpinsController } from '../spins/spins.controller';

function contextFor(request: object, handler: () => void = () => undefined) {
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  class Probe {
    @Roles('employee')
    open() {}
  }
  const handler = Probe.prototype.open;

  it('rejects a request with no signed-in caller', () => {
    expect(() => guard.canActivate(contextFor({}, handler))).toThrow(UnauthorizedException);
  });

  it('rejects a caller whose role is not allowed', () => {
    expect(() => guard.canActivate(contextFor({ caller: { role: 'unknown' } }, handler))).toThrow(
      ForbiddenException,
    );
  });

  it('allows a caller with an allowed role', () => {
    expect(guard.canActivate(contextFor({ caller: { role: 'employee' } }, handler))).toBe(true);
  });

  it('denies a handler that declares no roles', () => {
    expect(() => guard.canActivate(contextFor({ caller: { role: 'employee' } }))).toThrow(
      ForbiddenException,
    );
  });

  it('is applied to POST /spins', () => {
    const guards = Reflect.getMetadata('__guards__', SpinsController) as unknown[];
    expect(guards).toContain(RolesGuard);
    expect(Reflect.getMetadata('roles', SpinsController.prototype.spin)).toEqual(['employee']);
  });
});
