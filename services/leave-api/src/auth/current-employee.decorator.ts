import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PrincipalRequest } from './authenticated.guard';

/** The calling employee's id, taken only from the authenticated principal. */
export const CurrentEmployee = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<PrincipalRequest>().principal?.employeeId;
});
