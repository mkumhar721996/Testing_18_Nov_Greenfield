import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';
import { PG_POOL, PgOrganizationsRepository } from './pg-organizations.repository';

@Module({
  controllers: [OrganizationsController],
  providers: [
    // pg connects lazily, so the API still starts (and /health answers) without a database.
    {
      provide: PG_POOL,
      useFactory: () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        // An error on an idle client would otherwise be an unhandled 'error' event and crash the process.
        pool.on('error', (err) => console.error('pg pool error', err));
        return pool;
      },
    },
    { provide: OrganizationsRepository, useClass: PgOrganizationsRepository },
    OrganizationsService,
  ],
})
export class OrganizationsModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
