import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from './roles.decorator';

// Fails closed: the sign-in flow must set `request.caller`; until it does, every guarded call is refused.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ caller?: { role?: Role } }>();
    const caller = request.caller;
    if (!caller?.role) throw new UnauthorizedException();

    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed?.includes(caller.role)) throw new ForbiddenException();
    return true;
  }
}
