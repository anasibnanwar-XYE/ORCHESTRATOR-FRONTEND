import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Orchestrator ERP frontend E2E tests.
 *
 * Credentials are never hardcoded here. Pass them as environment variables:
 *
 *   VALIDATION_SUPERADMIN_EMAIL=... \
 *   VALIDATION_ADMIN_EMAIL=... \
 *   VALIDATION_DEALER_EMAIL=... \
 *   VALIDATION_SHARED_PASSWORD=... \
 *   bunx playwright test
 *
 * See AGENTS.md for the full list of validation accounts and their company codes.
 *
 * Worker concurrency defaults to 1 for stateful flows until state isolation is
 * proven across the mission. Override with E2E_WORKERS env var for read-only
 * smoke passes.
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Conservative: one worker by default for stateful flows.
  // See AGENTS.md: "Keep Playwright stateful workflow runs conservative (--workers=1)
  // until state isolation and test-data reset are proven."
  workers: parseInt(process.env.E2E_WORKERS ?? '1', 10),

  // No automatic retries. Transient failures should be investigated, not masked.
  retries: 0,

  // Per-test timeout.
  timeout: 30_000,

  // Reporters: list output for CI, HTML report saved to playwright-report/ (gitignored).
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    // Frontend dev server base URL. Override with E2E_BASE_URL env var if needed.
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3002',

    // Capture screenshots on failure only — keeps the output directory clean.
    screenshot: 'only-on-failure',

    // Capture traces on first retry to aid debugging.
    trace: 'on-first-retry',

    // Video capture disabled by default; enable explicitly when needed.
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Test artifacts saved to playwright-output/ (gitignored).
  outputDir: 'playwright-output',
});
