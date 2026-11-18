import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OFFER_ELIGIBILITY_REPOSITORY, OfferEligibilityRepository } from './offers.types';

/**
 * Placeholder binding until the customer record store lands (another story): nobody is
 * marked eligible, so no offer is shown. Replace with the real repository implementation.
 *
 * KNOWN GAP: until that store exists, acceptance criteria 1 and 2 (tiles shown for eligible
 * customers) are NOT delivered in a deployed system; they are only exercised against fakes in
 * tests. Criteria 3 and 4 hold trivially.
 */
const noEligibilityYet: OfferEligibilityRepository = {
  findEligibleOffers: async () => [],
};

@Module({
  controllers: [OffersController],
  providers: [OffersService, { provide: OFFER_ELIGIBILITY_REPOSITORY, useValue: noEligibilityYet }],
})
export class OffersModule {}
