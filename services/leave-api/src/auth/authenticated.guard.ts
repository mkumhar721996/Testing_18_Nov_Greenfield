import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

/** The authentication layer (Sign-in & Access Control) is expected to set `request.principal`. */
export interface Principal {
  employeeId: string;
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ principal?: Principal }>();
    if (!request.principal?.employeeId) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
