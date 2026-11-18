import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SpinsService } from './spins.service';

@Controller('spins')
@UseGuards(RolesGuard)
export class SpinsController {
  constructor(private readonly spinsService: SpinsService) {}

  @Post()
  @Roles('employee')
  spin(@Body() body: { bet?: unknown } | undefined) {
    return this.spinsService.spin(body?.bet);
  }
}
