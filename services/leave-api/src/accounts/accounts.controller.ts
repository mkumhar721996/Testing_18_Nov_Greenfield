import { Controller, Get, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from './accounts.service';

/**
 * DEV-ONLY identity: `x-customer-id` is client-supplied and NOT authenticated. It is a stand-in until
 * Entra ID sign-in (ADR-0005) and role checks (ADR-0010) provide a verified principal behind a guard.
 * Do not wire a real AccountsSource to these endpoints before that guard exists. Requests without
 * the header are rejected (fail closed).
 */
function requireCustomerId(customerId: string | undefined): string {
  const trimmed = customerId?.trim();
  if (!trimmed) throw new UnauthorizedException('Missing caller identity');
  return trimmed;
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@Headers('x-customer-id') customerId: string) {
    return this.accounts.list(requireCustomerId(customerId));
  }

  @Get(':id')
  get(@Headers('x-customer-id') customerId: string, @Param('id') id: string) {
    return this.accounts.balance(requireCustomerId(customerId), id);
  }
}
