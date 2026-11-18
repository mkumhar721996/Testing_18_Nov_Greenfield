import { Inject, Injectable } from '@nestjs/common';
import { DUE_PAYMENTS_REPOSITORY, DuePaymentsRepository } from './due-payments.repository';
import { selectUpcoming, UpcomingPayment } from './select-upcoming';

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export interface UpcomingPaymentsResult {
  windowDays: number;
  payments: UpcomingPayment[];
}

@Injectable()
export class UpcomingPaymentsService {
  constructor(@Inject(DUE_PAYMENTS_REPOSITORY) private readonly repository: DuePaymentsRepository) {}

  async forCustomer(customerId: string, now = new Date()): Promise<UpcomingPaymentsResult> {
    const windowDays = this.windowDays();
    const today = this.calendarDate(now);
    const due = await this.repository.listDue(customerId);
    return { windowDays, payments: selectUpcoming(due, today, windowDays) };
  }

  private windowDays(): number {
    const n = Number(process.env.UPCOMING_PAYMENTS_WINDOW_DAYS);
    return Number.isInteger(n) && n > 0 ? n : DEFAULT_WINDOW_DAYS;
  }

  /** Calendar date (YYYY-MM-DD) of `now` in the configured time zone. */
  private calendarDate(now: Date): string {
    const timeZone = process.env.UPCOMING_PAYMENTS_TIMEZONE || DEFAULT_TIMEZONE;
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
}
