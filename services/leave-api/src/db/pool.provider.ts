import type { Provider } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

export const poolProvider: Provider = {
  provide: PG_POOL,
  useFactory: () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    return new Pool({ connectionString: process.env.DATABASE_URL });
  },
};
