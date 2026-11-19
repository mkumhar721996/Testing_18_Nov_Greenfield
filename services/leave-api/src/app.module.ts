import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './catalog/catalog.module';
import { ProvidersModule } from './providers/providers.module';
import { TownsModule } from './towns/towns.module';

@Module({
  imports: [CatalogModule, ProvidersModule, TownsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
