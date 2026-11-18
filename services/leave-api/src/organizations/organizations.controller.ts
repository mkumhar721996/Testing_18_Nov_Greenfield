import { Controller, Get } from '@nestjs/common';
import type { Organization } from './organization';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list(): Promise<Organization[]> {
    return this.service.list();
  }
}
