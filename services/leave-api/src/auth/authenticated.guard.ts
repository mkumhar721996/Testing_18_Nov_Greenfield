import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

export interface Principal {
  employeeId: string;
}

export interface PrincipalRequest {
  principal?: Partial<Principal>;
}

/** Requires the authentication layer to have set `request.principal.employeeId`. */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    if (!request.principal?.employeeId) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
