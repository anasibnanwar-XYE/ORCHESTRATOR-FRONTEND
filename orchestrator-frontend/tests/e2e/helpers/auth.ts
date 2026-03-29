/**
 * Auth helpers for Playwright E2E tests.
 *
 * Credentials are read from environment variables at runtime and never hardcoded.
 * See AGENTS.md for validation account details.
 *
 * Recommended usage:
 *   VALIDATION_SUPERADMIN_EMAIL=... VALIDATION_SHARED_PASSWORD=... \
 *   bunx playwright test tests/e2e/auth-navigation.spec.ts --workers=1
 */

import type { Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Credential types and role map
// ─────────────────────────────────────────────────────────────────────────────

/** A resolved set of credentials needed to log in. */
export interface ValidationCredentials {
  email: string;
  password: string;
  companyCode: string;
}

/** Role keys that map to seeded validation accounts. */
export type ValidationRole =
  | 'superadmin'
  | 'admin'
  | 'accounting'
  | 'sales'
  | 'factory'
  | 'dealer'
  | 'rival_admin'
  | 'rival_dealer';

/**
 * Company codes for each validation role.
 * Sourced from AGENTS.md — do not modify without updating that file.
 */
const COMPANY_CODE_BY_ROLE: Record<ValidationRole, string> = {
  superadmin: 'SKE',
  admin: 'MOCK',
  accounting: 'MOCK',
  sales: 'MOCK',
  factory: 'MOCK',
  dealer: 'MOCK',
  rival_admin: 'RIVAL',
  rival_dealer: 'RIVAL',
};

/**
 * Runtime env var names for each role's email address.
 * Values are never committed. Set them at runtime.
 */
const EMAIL_ENV_BY_ROLE: Record<ValidationRole, string> = {
  superadmin: 'VALIDATION_SUPERADMIN_EMAIL',
  admin: 'VALIDATION_ADMIN_EMAIL',
  accounting: 'VALIDATION_ACCOUNTING_EMAIL',
  sales: 'VALIDATION_SALES_EMAIL',
  factory: 'VALIDATION_FACTORY_EMAIL',
  dealer: 'VALIDATION_DEALER_EMAIL',
  rival_admin: 'VALIDATION_RIVAL_ADMIN_EMAIL',
  rival_dealer: 'VALIDATION_RIVAL_DEALER_EMAIL',
};

// ─────────────────────────────────────────────────────────────────────────────
// Credential resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve runtime validation credentials for a role from environment variables.
 *
 * Returns `null` when the required env vars (`VALIDATION_SHARED_PASSWORD` and
 * the role-specific email var) are not set. Call `test.skip()` in callers when
 * null is returned.
 */
export function resolveCredentials(role: ValidationRole): ValidationCredentials | null {
  const password = process.env.VALIDATION_SHARED_PASSWORD;
  if (!password) return null;

  const email = process.env[EMAIL_ENV_BY_ROLE[role]];
  if (!email) return null;

  return { email, password, companyCode: COMPANY_CODE_BY_ROLE[role] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Login helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fill and submit the login form using visible label text to locate inputs.
 * This mirrors real user interaction rather than querying by implementation detail.
 */
export async function fillLoginForm(
  page: Page,
  credentials: ValidationCredentials
): Promise<void> {
  await page.getByLabel('Work email').fill(credentials.email);
  // Use exact: true to avoid matching the "Show password" toggle button whose
  // aria-label also contains the word "password".
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByLabel('Company code').fill(credentials.companyCode);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

/**
 * Navigate to /login and perform a full login as the given role.
 * Waits for navigation away from /login before returning.
 *
 * @returns The pathname the app navigated to after login.
 */
export async function loginAs(page: Page, credentials: ValidationCredentials): Promise<string> {
  await page.goto('/login');
  await fillLoginForm(page, credentials);
  // Wait until the app leaves /login (MFA, portal, or change-password corridor)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
  return new URL(page.url()).pathname;
}
