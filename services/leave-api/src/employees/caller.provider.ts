import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Caller } from './employee.types';

/** Resolves who is calling. The SSO-backed implementation belongs to the Entra sign-in story. */
export abstract class CallerProvider {
  abstract getCaller(request: unknown): Promise<Caller>;
}

/** Until sign-in exists nobody can be identified, so every call is rejected. */
@Injectable()
export class RejectingCallerProvider extends CallerProvider {
  async getCaller(): Promise<Caller> {
    throw new UnauthorizedException();
  }
}
