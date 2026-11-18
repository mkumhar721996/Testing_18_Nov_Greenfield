import { describe, expect, it } from 'vitest';
import { DuePayment, selectUpcoming } from './select-upcoming';

const card = (dueDate: string): DuePayment => ({ id: `card-${dueDate}`, type: 'card_due', name: 'Card', dueDate, amount: 945 });
const loan = (dueDate: string): DuePayment => ({ id: `loan-${dueDate}`, type: 'loan_instalment', name: 'Loan', dueDate, amount: 32450 });
const bill = (dueDate: string): DuePayment => ({ id: `bill-${dueDate}`, type: 'scheduled_bill', name: 'Bill', dueDate, amount: 1179 });

describe('selectUpcoming', () => {
  it('lists card, loan and bill dues and includes exactly day 30', () => {
    const r = selectUpcoming([bill('2026-12-18'), card('2026-11-24'), loan('2026-12-01'), bill('2026-12-05')], '2026-11-18', 30);
    expect(r.map((p) => p.type)).toEqual(['card_due', 'loan_instalment', 'scheduled_bill', 'scheduled_bill']);
    expect(r[3].daysUntilDue).toBe(30);
  });

  it('drops a payment due 31 days out', () => {
    expect(selectUpcoming([bill('2026-12-19')], '2026-11-18', 30)).toEqual([]);
  });

  it('drops overdue items and keeps today', () => {
    const r = selectUpcoming([bill('2026-11-17'), bill('2026-11-18')], '2026-11-18', 30);
    expect(r.map((p) => p.daysUntilDue)).toEqual([0]);
  });

  it('honours a custom window', () => {
    expect(selectUpcoming([bill('2026-12-08')], '2026-11-18', 14)).toEqual([]);
  });

  it('sorts by due date then id', () => {
    const a = { ...bill('2026-11-20'), id: 'b' };
    const b = { ...bill('2026-11-20'), id: 'a' };
    expect(selectUpcoming([a, b], '2026-11-18', 30).map((p) => p.id)).toEqual(['a', 'b']);
  });
});
