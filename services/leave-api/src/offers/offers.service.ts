import { Inject, Injectable } from '@nestjs/common';
import {
  EligibleOffer,
  OFFER_ELIGIBILITY_REPOSITORY,
  OfferEligibilityRepository,
  OfferType,
} from './offers.types';

const OFFER_ORDER: OfferType[] = ['personal-loan', 'card-upgrade'];

@Injectable()
export class OffersService {
  constructor(
    @Inject(OFFER_ELIGIBILITY_REPOSITORY)
    private readonly eligibility: OfferEligibilityRepository,
  ) {}

  async listForCustomer(customerId: string): Promise<{ offers: EligibleOffer[] }> {
    const found = await this.eligibility.findEligibleOffers(customerId);
    const offers = OFFER_ORDER.flatMap((type) => {
      const offer = found.find((o) => o.type === type);
      return offer ? [offer] : [];
    });
    return { offers };
  }
}
