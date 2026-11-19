import { Module } from '@nestjs/common';
import { CATALOG_CATEGORIES, CATALOG_DATA } from './catalog.data';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [{ provide: CATALOG_DATA, useValue: CATALOG_CATEGORIES }, CatalogService],
})
export class CatalogModule {}
