import { Body, Controller, Post } from '@nestjs/common';
import { SpinsService } from './spins.service';

@Controller('spins')
export class SpinsController {
  constructor(private readonly spinsService: SpinsService) {}

  @Post()
  spin(@Body() body: { bet?: unknown } | undefined) {
    return this.spinsService.spin(body?.bet);
  }
}
