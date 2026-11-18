import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { UpcomingPaymentsResult, UpcomingPaymentsService } from './upcoming-payments.service';

/** `customerId` is set on the request by the authentication guard (separate story); never taken from the client. */
interface AuthenticatedRequest {
  customerId?: string;
}

@Controller('dashboard')
export class UpcomingPaymentsController {
  constructor(private readonly service: UpcomingPaymentsService) {}

  @Get('upcoming-payments')
  upcomingPayments(@Req() req: AuthenticatedRequest): Promise<UpcomingPaymentsResult> {
    if (!req.customerId) {
      throw new UnauthorizedException();
    }
    return this.service.forCustomer(req.customerId);
  }
}
