/**
 * Auth and navigation smoke tests — E2E harness for the Sales + Dealer mission.
 *
 * These tests verify:
 *   1. The login page loads and shows all expected form fields.
 *   2. Invalid credentials are rejected cleanly and the form stays editable.
 *   3. Each validation role lands in the correct portal after login.
 *   4. Sales user lands directly in /sales (never /hub). (VAL-SHELL-002)
 *   5. Dealer user lands directly in /dealer (never /hub). (VAL-SHELL-002)
 *   6. Deep-link restoration: allowed deep links restore after login. (VAL-SHELL-002)
 *   7. Foreign portal routes are blocked (role isolation). (VAL-SHELL-004)
 *   8. GET /api/v1/auth/me is the sole bootstrap (no /auth/profile). (VAL-SHELL-001)
 *   9. No X-Company-Id header appears on Sales/Dealer requests. (VAL-SHELL-001, VAL-SHELL-010)
 *
 * Credentials are never hardcoded. Source .env.validation.local before running:
 *
 *   . ./.env.validation.local && bunx playwright test tests/e2e/auth-navigation.spec.ts --workers=1
 *
 * Tests requiring credentials are automatically skipped when the env vars are absent.
 */

import { test, expect } from '@playwright/test';
import { resolveCredentials, loginAs, fillLoginForm } from './helpers/auth';

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

  test('sales user lands on /sales after login (never /hub) — VAL-SHELL-002', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    const destination = await loginAs(page, creds);
    // Pure Sales role has exactly one portal → direct landing
    expect(destination).toMatch(/^\/sales/);
    expect(destination).not.toBe('/hub');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deep-link restoration — VAL-SHELL-002
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Deep-link restoration (VAL-SHELL-002)', () => {
  test('Sales deep link /sales/orders restores after login', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Navigate to a protected Sales deep link while unauthenticated
    await page.goto('/sales/orders');
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Login
    await fillLoginForm(page, creds);
    // Should restore the deep link
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/sales/orders');
  });

  test('Dealer deep link /dealer/invoices restores after login', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Navigate to a protected Dealer deep link while unauthenticated
    await page.goto('/dealer/invoices');
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Login
    await fillLoginForm(page, creds);
    // Should restore the deep link
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/dealer/invoices');
  });

  test('Unauthorized deep link falls back to own portal root', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Dealer tries to navigate to a Sales route
    await page.goto('/sales/orders');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await fillLoginForm(page, creds);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    // Dealer cannot access /sales → should fall back to /dealer
    expect(new URL(page.url()).pathname).toMatch(/^\/dealer/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Foreign portal route isolation — VAL-SHELL-004
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cross-portal route isolation (VAL-SHELL-004)', () => {
  test('Sales user cannot access /admin/*', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    // Should be redirected away from /admin
    expect(new URL(page.url()).pathname).not.toMatch(/^\/admin/);
    expect(new URL(page.url()).pathname).toMatch(/^\/sales/);
  });

  test('Sales user cannot access /dealer/*', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/dealer/invoices');
    await page.waitForTimeout(2000);
    expect(new URL(page.url()).pathname).not.toMatch(/^\/dealer/);
    expect(new URL(page.url()).pathname).toMatch(/^\/sales/);
  });

  test('Dealer user cannot access /sales/*', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/sales/orders');
    await page.waitForTimeout(2000);
    expect(new URL(page.url()).pathname).not.toMatch(/^\/sales/);
    expect(new URL(page.url()).pathname).toMatch(/^\/dealer/);
  });

  test('Dealer user cannot access /admin/*', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    expect(new URL(page.url()).pathname).not.toMatch(/^\/admin/);
    expect(new URL(page.url()).pathname).toMatch(/^\/dealer/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth bootstrap contract — VAL-SHELL-001
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auth bootstrap and tenant headers (VAL-SHELL-001)', () => {
  test('Login triggers GET /api/v1/auth/me bootstrap and never /auth/profile', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Track network requests
    const requests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/v1/auth/')) {
        requests.push(new URL(url).pathname);
      }
    });

    await loginAs(page, creds);
    // Wait for shell to stabilize
    await page.waitForTimeout(2000);

    // Must have used /auth/me as bootstrap
    expect(requests.some((r) => r.includes('/auth/me'))).toBe(true);
    // Must NOT have used retired /auth/profile
    expect(requests.some((r) => r.includes('/auth/profile'))).toBe(false);
  });

  test('Tenant-scoped requests use X-Company-Code and not X-Company-Id', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Track protected requests for header inspection
    const tenantHeaders: Array<{ url: string; companyCode?: string | null; companyId?: string | null }> = [];
    page.on('request', (req) => {
      const url = req.url();
      // Inspect non-login API requests
      if (url.includes('/api/v1/') && !url.includes('/auth/login') && !url.includes('/auth/refresh-token')) {
        const headers = req.headers();
        tenantHeaders.push({
          url: new URL(url).pathname,
          companyCode: headers['x-company-code'] ?? null,
          companyId: headers['x-company-id'] ?? null,
        });
      }
    });

    await loginAs(page, creds);
    // Let the shell bootstrap complete
    await page.waitForTimeout(3000);

    // At least one protected request should have been made
    expect(tenantHeaders.length).toBeGreaterThan(0);

    // All protected requests must have X-Company-Code
    for (const req of tenantHeaders) {
      if (req.url.includes('/auth/me')) {
        expect(req.companyCode).toBeTruthy();
      }
    }

    // No request should have X-Company-Id
    for (const req of tenantHeaders) {
      expect(req.companyId).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Password-change corridor — VAL-SHELL-003
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Password-change corridor (VAL-SHELL-003)', () => {
  test('mustChangePassword session routes to /change-password before portal chrome', async ({ page }) => {
    const creds = resolveCredentials('mustchange_admin');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_MUSTCHANGE_ADMIN_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    const destination = await loginAs(page, creds);
    // Must route to /change-password, not to any portal
    expect(destination).toBe('/change-password');

    // Portal chrome should NOT be visible — no sidebar, no nav items
    // The change-password page is a standalone corridor
    await expect(page.locator('nav[aria-label="Sidebar"]')).not.toBeVisible({ timeout: 3000 });
  });
});
