import type { OfferType } from './offersApi'

export type Journey = 'apply' | 'check'

export interface OfferCopy {
  title: string
  description: string
  journey: Journey
  action: string
  buttonClass: 'btn-primary' | 'btn-secondary'
  wfId: string
}

export const OFFER_ORDER: OfferType[] = ['personal-loan', 'card-upgrade']

export const OFFER_COPY: Record<OfferType, OfferCopy> = {
  'personal-loan': {
    title: 'Personal loan',
    description: 'Instant approval. Choose your amount and term when you apply.',
    journey: 'apply',
    action: 'Apply',
    buttonClass: 'btn-primary',
    wfId: 'apply-personal-loan',
  },
  'card-upgrade': {
    title: 'Platinum card upgrade',
    description: 'Based on your spend. Check your upgrade terms before you decide.',
    journey: 'check',
    action: 'Check',
    buttonClass: 'btn-secondary',
    wfId: 'check-card-upgrade',
  },
}
