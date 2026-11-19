import { Module } from '@nestjs/common';
import { PROVIDERS, PROVIDERS_DATA } from './providers.data';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  controllers: [ProvidersController],
  providers: [{ provide: PROVIDERS_DATA, useValue: PROVIDERS }, ProvidersService],
})
export class ProvidersModule {}
