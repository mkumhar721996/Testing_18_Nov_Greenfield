import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

// Public and read-only by design: anyone can browse the catalog without signing in.
@Controller('service-categories')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list() {
    return this.catalog.list();
  }
}
