import type { Organization } from './organization';

export abstract class OrganizationsRepository {
  abstract findAll(): Promise<Organization[]>;
}
