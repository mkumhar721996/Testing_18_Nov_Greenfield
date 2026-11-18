import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

interface PrincipalRequest {
  headers: Record<string, string | string[] | undefined>;
  employeeId?: string;
}

/**
 * TEMPORARY dev/test stand-in for Entra ID sign-in (ADR-0005): trusts the x-employee-id header.
 * Never active in production, where every request is refused. Replace with the Sign-in story's guard.
 */
@Injectable()
export class EmployeeHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const header = request.headers['x-employee-id'];
    if (process.env.NODE_ENV === 'production' || typeof header !== 'string' || header.trim() === '') {
      throw new UnauthorizedException({ code: 'unauthenticated', message: 'Sign in to continue.' });
    }
    request.employeeId = header.trim();
    return true;
  }
}

/** The calling employee, taken only from the request principal, never from the body or query. */
export const CurrentEmployee = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  return context.switchToHttp().getRequest<PrincipalRequest>().employeeId as string;
});
