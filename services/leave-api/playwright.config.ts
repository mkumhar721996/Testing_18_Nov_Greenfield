import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: 'pnpm build && node dist/main',
    url: `http://127.0.0.1:${port}/health`,
    env: { PORT: String(port), HOST: '127.0.0.1', DATABASE_URL: process.env.DATABASE_URL ?? '' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
