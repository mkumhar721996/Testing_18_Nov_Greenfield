import { Inject, Injectable } from '@nestjs/common';
import { PROVIDERS_DATA, Provider } from './providers.data';

export interface ProviderListing {
  id: string;
  name: string;
  services: string[];
  towns: string[];
  averageRating: number | null;
  reviewCount: number;
}

const isRated = (p: Provider) => p.rating !== null && p.rating.count > 0;

// Best rated first; equal ratings (and all unrated providers) A-Z; unrated providers after every rated one.
export function compareProviders(a: Provider, b: Provider): number {
  const ratedA = isRated(a);
  const ratedB = isRated(b);
  if (ratedA !== ratedB) return ratedA ? -1 : 1;
  if (ratedA && ratedB && a.rating!.average !== b.rating!.average) return b.rating!.average - a.rating!.average;
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
}

@Injectable()
export class ProvidersService {
  constructor(@Inject(PROVIDERS_DATA) private readonly providers: Provider[]) {}

  list(): { providers: ProviderListing[] } {
    // Explicit mapping: a stray field in the data (e.g. a price or availability) never reaches the response.
    return {
      providers: [...this.providers].sort(compareProviders).map((p) => ({
        id: p.id,
        name: p.name,
        services: [...p.services],
        towns: [...p.towns],
        averageRating: isRated(p) ? p.rating!.average : null,
        reviewCount: isRated(p) ? p.rating!.count : 0,
      })),
    };
  }
}
