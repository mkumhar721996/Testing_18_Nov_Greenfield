export type PaymentType = 'card_due' | 'loan_instalment' | 'scheduled_bill';

export interface DuePayment {
  id: string;
  type: PaymentType;
  name: string;
  /** YYYY-MM-DD */
  dueDate: string;
  /** whole INR */
  amount: number;
}

export interface UpcomingPayment extends DuePayment {
  daysUntilDue: number;
}

const MS_PER_DAY = 86_400_000;

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD), by UTC date arithmetic. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Keeps payments due today through day `windowDays` inclusive (day 31 is out), sorted by due date then id. */
export function selectUpcoming(all: DuePayment[], today: string, windowDays: number): UpcomingPayment[] {
  return all
    .map((p) => ({ ...p, daysUntilDue: daysBetween(today, p.dueDate) }))
    .filter((p) => p.daysUntilDue >= 0 && p.daysUntilDue <= windowDays)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}
