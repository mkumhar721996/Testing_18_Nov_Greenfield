import { Controller, Get, Query } from '@nestjs/common';
import { ProvidersService } from './providers.service';

// A repeated query parameter arrives as an array: take the first value; anything but a string is ignored.
const firstString = (value: unknown): string | undefined => {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : undefined;
};

// Public and read-only by design: anyone can browse providers without signing in.
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list(@Query('service') service?: unknown, @Query('town') town?: unknown) {
    return this.providers.list({ service: firstString(service), town: firstString(town) });
  }
}
