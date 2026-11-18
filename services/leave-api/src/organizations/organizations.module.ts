import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';
import { PG_POOL, PgOrganizationsRepository } from './pg-organizations.repository';

@Module({
  controllers: [OrganizationsController],
  providers: [
    // pg connects lazily, so the API still starts (and /health answers) without a database.
    { provide: PG_POOL, useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL }) },
    { provide: OrganizationsRepository, useClass: PgOrganizationsRepository },
    OrganizationsService,
  ],
})
export class OrganizationsModule {}
