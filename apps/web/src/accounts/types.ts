export type AccountType = 'savings' | 'current' | 'credit_card'

export interface LinkedAccount {
  id: string
  type: AccountType
  displayName: string
}

export interface AccountBalance extends LinkedAccount {
  currency: string
  /** Savings/current: the balance. Credit card: the outstanding amount owed. Minor units. */
  balanceMinor: number
  /** Credit card only, minor units. */
  creditLimitMinor?: number
}
