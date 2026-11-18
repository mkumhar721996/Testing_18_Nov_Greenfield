import { Controller, Get, Headers, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';

// The caller is identified by `x-customer-id` until Entra ID sign-in (ADR-0005) provides a principal.
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@Headers('x-customer-id') customerId: string) {
    return this.accounts.list(customerId);
  }

  @Get(':id')
  get(@Headers('x-customer-id') customerId: string, @Param('id') id: string) {
    return this.accounts.balance(customerId, id);
  }
}
