import { describe, expect, it, vi } from 'vitest';
import { OffersService } from './offers.service';
import { EligibleOffer, OfferEligibilityRepository } from './offers.types';

function setup(found: EligibleOffer[]) {
  const repo = { findEligibleOffers: vi.fn().mockResolvedValue(found) };
  const service = new OffersService(repo as OfferEligibilityRepository);
  return { repo, service };
}

describe('OffersService', () => {
  it('returns the personal loan offer when eligible', async () => {
    const { repo, service } = setup([{ type: 'personal-loan' }]);
    expect(await service.listForCustomer('c1')).toEqual({ offers: [{ type: 'personal-loan' }] });
    expect(repo.findEligibleOffers).toHaveBeenCalledWith('c1');
  });

  it('returns the card upgrade offer when eligible', async () => {
    const { service } = setup([{ type: 'card-upgrade' }]);
    expect(await service.listForCustomer('c1')).toEqual({ offers: [{ type: 'card-upgrade' }] });
  });

  it('omits personal loan when not eligible', async () => {
    const { service } = setup([{ type: 'card-upgrade' }]);
    const result = await service.listForCustomer('c1');
    expect(result.offers.map((o) => o.type)).not.toContain('personal-loan');
  });

  it('omits card upgrade when not eligible', async () => {
    const { service } = setup([{ type: 'personal-loan' }]);
    const result = await service.listForCustomer('c1');
    expect(result.offers.map((o) => o.type)).not.toContain('card-upgrade');
  });

  it('returns no offers when eligible for neither', async () => {
    const { service } = setup([]);
    expect(await service.listForCustomer('c1')).toEqual({ offers: [] });
  });

  it('de-duplicates and orders personal loan before card upgrade', async () => {
    const { service } = setup([
      { type: 'card-upgrade' },
      { type: 'personal-loan' },
      { type: 'card-upgrade' },
    ]);
    const result = await service.listForCustomer('c1');
    expect(result.offers.map((o) => o.type)).toEqual(['personal-loan', 'card-upgrade']);
  });
});
