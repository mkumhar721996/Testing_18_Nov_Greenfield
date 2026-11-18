import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OffersController, customerIdFromRequest } from './offers.controller';
import { OffersService } from './offers.service';

describe('OffersController', () => {
  it('lists offers for the signed-in customer id it is given', async () => {
    const service = { listForCustomer: vi.fn().mockResolvedValue({ offers: [] }) };
    const controller = new OffersController(service as unknown as OffersService);
    expect(await controller.list('c1')).toEqual({ offers: [] });
    expect(service.listForCustomer).toHaveBeenCalledWith('c1');
  });
});

describe('customerIdFromRequest', () => {
  it('reads the id from the signed-in user, ignoring query and params', () => {
    const req = { user: { id: 'c1' }, query: { customerId: 'c2' }, params: { customerId: 'c3' } };
    expect(customerIdFromRequest(req)).toBe('c1');
  });

  it('rejects a request with no signed-in customer', () => {
    expect(() => customerIdFromRequest({ query: { customerId: 'c2' } })).toThrow(
      UnauthorizedException,
    );
  });
});
