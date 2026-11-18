import {
  Controller,
  createParamDecorator,
  ExecutionContext,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { OffersService } from './offers.service';

/** The signed-in customer is set on the request by the sign-in guard; never taken from query/path. */
export function customerIdFromRequest(req: { user?: { id?: string } }): string {
  const id = req.user?.id;
  if (!id) {
    throw new UnauthorizedException();
  }
  return id;
}

export const CustomerId = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  customerIdFromRequest(ctx.switchToHttp().getRequest()),
);

@Controller()
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get('offers')
  list(@CustomerId() customerId: string) {
    return this.offers.listForCustomer(customerId);
  }
}
