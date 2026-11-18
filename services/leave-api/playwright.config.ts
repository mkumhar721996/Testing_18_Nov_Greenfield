import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: 'pnpm build && node dist/main',
    url: `http://127.0.0.1:${port}/health`,
    // The pool connects lazily and these specs are rejected before any query, so no database is needed;
    // the placeholder only satisfies the API's fail-fast check.
    env: {
      PORT: String(port),
      HOST: '127.0.0.1',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://localhost:5432/e2e_unused',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
