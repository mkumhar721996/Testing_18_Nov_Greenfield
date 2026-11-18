import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OFFER_ELIGIBILITY_REPOSITORY, OfferEligibilityRepository } from './offers.types';

/**
 * Placeholder binding until the customer record store lands (another story): nobody is
 * marked eligible, so no offer is shown. Replace with the real repository implementation.
 */
const noEligibilityYet: OfferEligibilityRepository = {
  findEligibleOffers: async () => [],
};

@Module({
  controllers: [OffersController],
  providers: [OffersService, { provide: OFFER_ELIGIBILITY_REPOSITORY, useValue: noEligibilityYet }],
})
export class OffersModule {}
