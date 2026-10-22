import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import { E2E_DB } from './constants'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
} catch {
  // No .env file: fall back to the variables already in the environment.
}

// Never reuse a running server: it could be pointing at the development database,
// and a dev web server has no Content-Security-Policy to test.
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start -w @adlin/api',
      cwd: repoRoot,
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: false,
      env: { MONGODB_DB: E2E_DB, PORT: '4000', WEB_ORIGIN: 'http://localhost:3000', LOG_LEVEL: 'warn' },
    },
    {
      command: 'npm run build -w @adlin/web && node apps/web/.output/server/index.mjs',
      cwd: repoRoot,
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { PORT: '3000', NUXT_PUBLIC_API_BASE: 'http://localhost:4000/api' },
    },
  ],
})
