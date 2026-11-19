import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_DATA, ServiceCategory } from './catalog.data';

@Injectable()
export class CatalogService {
  constructor(@Inject(CATALOG_DATA) private readonly categories: ServiceCategory[]) {}

  list(): { categories: ServiceCategory[] } {
    // Explicit mapping: a stray field in the data (e.g. a price) never reaches the response.
    return { categories: this.categories.map(({ id, name, description }) => ({ id, name, description })) };
  }
}
