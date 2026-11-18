import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ACCOUNTS_SOURCE } from './accounts.types';
import type { AccountsSource } from './accounts.types';

// No account store exists yet, so no account is linked until a real AccountsSource replaces this.
const noLinkedAccounts: AccountsSource = {
  list: async () => [],
  balance: async () => null,
};

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, { provide: ACCOUNTS_SOURCE, useValue: noLinkedAccounts }],
})
export class AccountsModule {}
