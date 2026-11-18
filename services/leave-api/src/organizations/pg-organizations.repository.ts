import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import type { Organization } from './organization';
import { OrganizationsRepository } from './organizations.repository';

export const PG_POOL = 'PG_POOL';

interface OrganizationRow {
  id: string;
  name: string;
  address: string;
  admin_name: string | null;
  admin_email: string | null;
  created_by: string;
  contact_name: string;
  contact_details: string;
}

@Injectable()
export class PgOrganizationsRepository extends OrganizationsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pick<Pool, 'query'>) {
    super();
  }

  async findAll(): Promise<Organization[]> {
    const { rows } = await this.pool.query<OrganizationRow>(
      `select id, name, address, admin_name, admin_email, created_by, contact_name, contact_details
       from organizations order by name, id`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      admin: r.admin_name === null ? null : { name: r.admin_name, email: r.admin_email ?? '' },
      createdBy: r.created_by,
      contact: { name: r.contact_name, details: r.contact_details },
    }));
  }
}
