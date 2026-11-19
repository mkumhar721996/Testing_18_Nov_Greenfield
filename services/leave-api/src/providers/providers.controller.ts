import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';

// Public and read-only by design: anyone can browse providers without signing in.
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list() {
    return this.providers.list();
  }
}
