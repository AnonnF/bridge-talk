import { defineConfig, devices } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'npm run dev -- --mode e2e --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://bridge-talk-e2e.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'bridge-talk-e2e-anon-key',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
