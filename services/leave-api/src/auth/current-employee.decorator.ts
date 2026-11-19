import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Principal } from './authenticated.guard';

/** The signed-in employee's id, taken only from the authenticated principal. */
export const CurrentEmployee = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<{ principal: Principal }>();
  return request.principal.employeeId;
});
