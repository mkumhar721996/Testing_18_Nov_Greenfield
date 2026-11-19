import { Controller, Get } from '@nestjs/common';
import { TownsService } from './towns.service';

// Public and read-only by design: anyone can see the towns without signing in.
@Controller('towns')
export class TownsController {
  constructor(private readonly towns: TownsService) {}

  @Get()
  list() {
    return this.towns.list();
  }
}
