import { BadGatewayException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNTS_SOURCE } from './accounts.types';
import type { AccountBalance, AccountsSource, LinkedAccount } from './accounts.types';

@Injectable()
export class AccountsService {
  constructor(@Inject(ACCOUNTS_SOURCE) private readonly source: AccountsSource) {}

  list(customerId: string): Promise<LinkedAccount[]> {
    return this.source.list(customerId);
  }

  async balance(customerId: string, accountId: string): Promise<AccountBalance> {
    let account: AccountBalance | null;
    try {
      account = await this.source.balance(customerId, accountId);
    } catch {
      // Deliberately not logging the cause: it may carry balances or account numbers.
      throw new BadGatewayException('Could not load this account');
    }
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
