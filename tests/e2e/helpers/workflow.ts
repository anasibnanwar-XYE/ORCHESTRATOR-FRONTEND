/**
 * Shared workflow helpers for Playwright E2E tests.
 *
 * These helpers provide:
 *   - Post-login navigation to portal pages
 *   - Reusable triage utilities for frontend-vs-backend fault isolation
 *   - Mobile viewport presets
 *
 * Credentials are never hardcoded. Pass them via environment variables at
 * runtime — see AGENTS.md for the full list of validation accounts.
 */

import type { Page } from '@playwright/test';
import { loginAs } from './auth';
import type { ValidationCredentials } from './auth';
export type { ValidationCredentials };

// ─────────────────────────────────────────────────────────────────────────────
// Mobile viewport presets
// ─────────────────────────────────────────────────────────────────────────────

/** Standard phone viewport used across mobile E2E scenarios. */
export const PHONE_VIEWPORT = { width: 390, height: 844 };

/** Smaller phone for tight-layout checks. */
export const SMALL_PHONE_VIEWPORT = { width: 375, height: 667 };

// ─────────────────────────────────────────────────────────────────────────────
// Portal navigation after login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login and then navigate to a specific portal path.
 *
 * Returns the final URL pathname after navigation settles.
 */
export async function loginAndNavigate(
  page: Page,
  credentials: ValidationCredentials,
  targetPath: string
): Promise<string> {
  await loginAs(page, credentials);
  await page.goto(targetPath);
  // Wait for the page to settle — either the requested route or a redirect.
  await page.waitForLoadState('domcontentloaded');
  return new URL(page.url()).pathname;
}

// ─────────────────────────────────────────────────────────────────────────────
// Triage helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Portal names used in this repo. */
export type PortalName = 'dealer' | 'sales' | 'accounting' | 'admin' | 'superadmin' | 'factory';

/**
 * Wait for a page's primary heading to become visible.
 *
 * Used as the canonical "page loaded" signal in workflow tests, so we know the
 * component mounted successfully.  If the heading is absent, the test fails
 * cleanly: the absence is a clear frontend rendering signal, not a backend
 * data problem.
 */
export async function expectPageHeading(page: Page, expectedText: string): Promise<void> {
  await page.getByRole('heading', { name: expectedText }).waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Check whether a network response indicates a backend error vs a frontend
 * rendering problem.
 *
 * Returns `true` when the page rendered the heading despite an error response
 * (backend issue), `false` when the heading is absent (possible frontend issue).
 */
export async function headingVisibleDespiteError(
  page: Page,
  headingText: string
): Promise<boolean> {
  try {
    await page.getByRole('heading', { name: headingText }).waitFor({
      state: 'visible',
      timeout: 8_000,
    });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Button / action presence helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assert that a named action button is present and visible.
 *
 * This is a frontend assertion — the button must be in the DOM and visible
 * regardless of whether backend data loaded successfully.
 */
export async function expectActionButton(page: Page, name: string | RegExp): Promise<void> {
  await page.getByRole('button', { name }).waitFor({ state: 'visible', timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile shell helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check that on phone viewport the mobile menu trigger is present (meaning the
 * mobile shell rendered), then open and close it.
 *
 * Returns `true` when the mobile shell is present and operated successfully.
 *
 * The Dealer, Sales, and Accounting layouts all use aria-label="Open menu" for
 * the hamburger trigger and aria-label="Close menu" for the close button.
 * The trigger uses the `lg:hidden` CSS class so it is only visible on viewports
 * narrower than the `lg` breakpoint (1024px).
 *
 * NOTE: This function waits up to `waitMs` milliseconds for the trigger to
 * appear, so it is safe to call immediately after navigation without an
 * explicit prior wait.
 */
export async function operateMobileShell(page: Page, waitMs = 10_000): Promise<boolean> {
  const trigger = page.getByRole('button', { name: 'Open menu' });
  try {
    await trigger.waitFor({ state: 'visible', timeout: waitMs });
  } catch {
    return false;
  }

  await trigger.click();
  // After opening, the close button must be visible (it replaces the open button).
  await page
    .getByRole('button', { name: 'Close menu' })
    .waitFor({ state: 'visible', timeout: 5_000 });
  // Close the menu.
  await page.getByRole('button', { name: 'Close menu' }).click();
  // Open button must come back.
  await trigger.waitFor({ state: 'visible', timeout: 5_000 });
  return true;
}
