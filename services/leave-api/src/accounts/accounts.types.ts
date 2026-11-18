export type AccountType = 'savings' | 'current' | 'credit_card';

export interface LinkedAccount {
  id: string;
  type: AccountType;
  displayName: string;
}

export interface AccountBalance extends LinkedAccount {
  /** ISO 4217 code, e.g. "INR". */
  currency: string;
  /** Savings/current: the balance. Credit card: the outstanding amount owed (>= 0). Minor units. */
  balanceMinor: number;
  /** Credit card only, minor units. */
  creditLimitMinor?: number;
}

/**
 * Where linked accounts and balances come from; swappable until the data origin is decided.
 * `customerId` is currently taken from an unauthenticated dev-only header (see AccountsController):
 * an implementation backed by real data must not be wired until it comes from a verified principal.
 */
export interface AccountsSource {
  list(customerId: string): Promise<LinkedAccount[]>;
  /** Resolves to null when the account is not one of the customer's linked accounts. */
  balance(customerId: string, accountId: string): Promise<AccountBalance | null>;
}

export const ACCOUNTS_SOURCE = Symbol('ACCOUNTS_SOURCE');
