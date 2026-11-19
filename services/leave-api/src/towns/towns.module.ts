import { Module } from '@nestjs/common';
import { TOWNS, TOWNS_DATA } from './towns.data';
import { TownsController } from './towns.controller';
import { TownsService } from './towns.service';

@Module({
  controllers: [TownsController],
  providers: [{ provide: TOWNS_DATA, useValue: TOWNS }, TownsService],
})
export class TownsModule {}
