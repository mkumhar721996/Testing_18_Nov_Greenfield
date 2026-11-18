export type OfferType = 'personal-loan' | 'card-upgrade';

export interface EligibleOffer {
  type: OfferType;
  headline?: string;
}

export interface OfferEligibilityRepository {
  findEligibleOffers(customerId: string): Promise<EligibleOffer[]>;
}

export const OFFER_ELIGIBILITY_REPOSITORY = Symbol('OFFER_ELIGIBILITY_REPOSITORY');
