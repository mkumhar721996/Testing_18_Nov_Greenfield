import { DuePayment } from './select-upcoming';

export const DUE_PAYMENTS_REPOSITORY = Symbol('DUE_PAYMENTS_REPOSITORY');

/** Read-only port over wherever card dues, loan instalments and scheduled bills are stored. */
export interface DuePaymentsRepository {
  listDue(customerId: string): Promise<DuePayment[]>;
}

/**
 * Placeholder binding until the payment-record source exists (open question on the plan).
 * Returns nothing rather than inventing data.
 */
export class NoDuePaymentsRepository implements DuePaymentsRepository {
  async listDue(): Promise<DuePayment[]> {
    return [];
  }
}
