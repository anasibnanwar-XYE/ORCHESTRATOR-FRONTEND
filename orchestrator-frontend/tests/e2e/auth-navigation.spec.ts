/**
 * Auth and navigation smoke tests — initial E2E harness.
 *
 * These tests verify:
 *   1. The login page loads and shows all expected form fields.
 *   2. Invalid credentials are rejected cleanly and the form stays editable.
 *   3. Each validation role lands in the correct portal after login.
 *
 * Credentials are never hardcoded. To run the role-resolved navigation tests,
 * pass credentials as environment variables:
 *
 *   VALIDATION_SUPERADMIN_EMAIL=<email> \
 *   VALIDATION_ADMIN_EMAIL=<email> \
 *   VALIDATION_DEALER_EMAIL=<email> \
 *   VALIDATION_SHARED_PASSWORD=<password> \
 *   bunx playwright test tests/e2e/auth-navigation.spec.ts --workers=1
 *
 * Tests requiring credentials are automatically skipped when the env vars are
 * absent, so the suite is safe to run in environments that have no credentials.
 */

import { test, expect } from '@playwright/test';
import { resolveCredentials, loginAs } from './helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Login page structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('loads and shows all required form fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Work email')).toBeVisible();
    // Use exact: true to avoid matching the "Show password" toggle button.
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Company code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
  });

  test('invalid credentials show retryable error and keep form editable', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Work email').fill('unknown@notreal.invalid');
    // Use exact: true to avoid matching the "Show password" toggle button.
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123!');
    await page.getByLabel('Company code').fill('FAKE');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The app must stay on /login after bad credentials
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Form must remain editable so the user can correct and retry
    await expect(page.getByLabel('Work email')).toBeEnabled();
    await expect(page.getByLabel('Password', { exact: true })).toBeEnabled();
    await expect(page.getByLabel('Company code')).toBeEnabled();

    // A simple wrong-password attempt must NOT trigger the lockout banner
    await expect(page.getByTestId('lockout-banner')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Role-resolved post-login navigation (requires runtime credentials)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Role-resolved navigation', () => {
  test('superadmin lands on /superadmin after login', async ({ page }) => {
    const creds = resolveCredentials('superadmin');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SUPERADMIN_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    const destination = await loginAs(page, creds);
    expect(destination).toBe('/superadmin');
  });

  test('admin user lands on /hub after login', async ({ page }) => {
    const creds = resolveCredentials('admin');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ADMIN_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    const destination = await loginAs(page, creds);
    // Admin has multiple portals and should be directed to the portal hub
    expect(destination).toBe('/hub');
  });

  test('dealer user lands on /dealer after login', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    const destination = await loginAs(page, creds);
    expect(destination).toMatch(/^\/dealer/);
  });
});
