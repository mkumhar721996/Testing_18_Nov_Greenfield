import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import type { AccountBalance, AccountsSource, LinkedAccount } from './accounts.types';

const balances: Record<string, AccountBalance[]> = {
  'cust-1': [
    { id: 'sav-1', type: 'savings', displayName: 'Savings account ••4821', currency: 'INR', balanceMinor: 18425000 },
    { id: 'cur-1', type: 'current', displayName: 'Current account ••0937', currency: 'INR', balanceMinor: 6231045 },
    {
      id: 'cc-1',
      type: 'credit_card',
      displayName: 'Credit card ••5510',
      currency: 'INR',
      balanceMinor: 1890500,
      creditLimitMinor: 10000000,
    },
    { id: 'failing-id', type: 'current', displayName: 'Current account ••1111', currency: 'INR', balanceMinor: 0 },
  ],
  'cust-2': [],
};

const source: AccountsSource = {
  async list(customerId): Promise<LinkedAccount[]> {
    return (balances[customerId] ?? []).map(({ id, type, displayName }) => ({ id, type, displayName }));
  },
  async balance(customerId, accountId) {
    if (accountId === 'failing-id') throw new Error('upstream down');
    return (balances[customerId] ?? []).find((a) => a.id === accountId) ?? null;
  },
};

const controller = new AccountsController(new AccountsService(source));

describe('AccountsController', () => {
  it('returns an empty list when no account is linked', async () => {
    expect(await controller.list('cust-2')).toEqual([]);
  });

  it('returns a credit card with its outstanding balance', async () => {
    expect(await controller.get('cust-1', 'cc-1')).toEqual(
      expect.objectContaining({ type: 'credit_card', balanceMinor: 1890500 }),
    );
  });

  it('answers not found for an account that is not the caller’s', async () => {
    await expect(controller.get('cust-1', 'other-customers-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('answers bad gateway when the source fails for that account only', async () => {
    await expect(controller.get('cust-1', 'failing-id')).rejects.toBeInstanceOf(BadGatewayException);
    expect(await controller.list('cust-1')).toHaveLength(4);
  });
});
