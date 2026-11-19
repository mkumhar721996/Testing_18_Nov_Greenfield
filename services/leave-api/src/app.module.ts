import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './catalog/catalog.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [CatalogModule, ProvidersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
