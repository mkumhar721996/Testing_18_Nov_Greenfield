import { Injectable } from '@nestjs/common';
import type { Organization } from './organization';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly repository: OrganizationsRepository) {}

  list(): Promise<Organization[]> {
    return this.repository.findAll();
  }
}
