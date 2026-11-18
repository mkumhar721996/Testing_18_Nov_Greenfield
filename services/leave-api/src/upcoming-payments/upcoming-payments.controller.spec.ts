import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { UpcomingPaymentsController } from './upcoming-payments.controller';
import { UpcomingPaymentsService } from './upcoming-payments.service';

describe('UpcomingPaymentsController', () => {
  const makeController = () => {
    const forCustomer = vi.fn().mockResolvedValue({ payments: [] });
    const controller = new UpcomingPaymentsController({ forCustomer } as unknown as UpcomingPaymentsService);
    return { controller, forCustomer };
  };

  it('rejects an unauthenticated request without querying the service', () => {
    const { controller, forCustomer } = makeController();
    expect(() => controller.upcomingPayments({})).toThrow(UnauthorizedException);
    expect(forCustomer).not.toHaveBeenCalled();
  });

  it('rejects an empty customer id', () => {
    const { controller, forCustomer } = makeController();
    expect(() => controller.upcomingPayments({ customerId: '' })).toThrow(UnauthorizedException);
    expect(forCustomer).not.toHaveBeenCalled();
  });

  it('passes the authenticated customer id to the service', async () => {
    const { controller, forCustomer } = makeController();
    await controller.upcomingPayments({ customerId: 'cust-1' });
    expect(forCustomer).toHaveBeenCalledWith('cust-1');
  });
});
