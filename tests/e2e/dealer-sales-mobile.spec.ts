/**
 * Dealer and Sales mobile path E2E tests.
 *
 * These tests verify that Dealer and Sales portals are accessible and render
 * their primary UI correctly on phone-sized viewports.  They distinguish
 * frontend defects (page doesn't render) from backend defects (page renders
 * but data is empty or errored out).
 *
 * Viewport: 390×844 (iPhone 14 equivalent) for all tests in this file.
 *
 * To run with credentials:
 *
 *   VALIDATION_DEALER_EMAIL=<email> \
 *   VALIDATION_SALES_EMAIL=<email> \
 *   VALIDATION_SHARED_PASSWORD=<password> \
 *   bunx playwright test tests/e2e/dealer-sales-mobile.spec.ts --workers=1
 *
 * Tests requiring credentials are automatically skipped when env vars are absent.
 */

import { test, expect } from '@playwright/test';
import { resolveCredentials } from './helpers/auth';
import {
  loginAndNavigate,
  expectPageHeading,
  operateMobileShell,
  PHONE_VIEWPORT,
} from './helpers/workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Dealer mobile paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dealer mobile paths', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('dealer dashboard loads and shows welcome heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer');
    // Dashboard uses a dynamic greeting (Good morning/afternoon/evening) rather
    // than a static heading, so just verify we landed at the right route and
    // the page rendered an h1.
    await expect(page).toHaveURL(/\/dealer/, { timeout: 10_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });

  test('dealer mobile shell opens and closes cleanly', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer');
    await expect(page).toHaveURL(/\/dealer/, { timeout: 10_000 });

    const shellWorked = await operateMobileShell(page);
    // The mobile shell (Open/Close menu) must be present on phone viewports.
    expect(shellWorked).toBe(true);
  });

  test('dealer orders page shows "My Orders" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/orders');
    await expectPageHeading(page, 'My Orders');
    // No horizontal overflow: page width should not exceed viewport width.
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(PHONE_VIEWPORT.width + 4); // 4px tolerance
  });

  test('dealer invoices page shows "My Invoices" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/invoices');
    await expectPageHeading(page, 'My Invoices');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(PHONE_VIEWPORT.width + 4);
  });

  test('dealer ledger page shows "My Ledger" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/ledger');
    await expectPageHeading(page, 'My Ledger');
  });

  test('dealer aging page shows "My Aging" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/aging');
    await expectPageHeading(page, 'My Aging');
  });

  test('dealer credit requests page shows "Credit Requests" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/credit-requests');
    await expectPageHeading(page, 'Credit Requests');
    // The credit request form should be visible — this is a frontend rendering check.
    await expect(
      page.getByText('Request a credit limit increase')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('dealer support tickets page shows "Support Tickets" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/dealer/support');
    await expectPageHeading(page, 'Support Tickets');
  });

  test('dealer navigates between pages via mobile menu without losing context', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Start on orders page.
    await loginAndNavigate(page, creds, '/dealer/orders');
    await expectPageHeading(page, 'My Orders');

    // Open the mobile menu.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Close menu' }).waitFor({ state: 'visible' });

    // Navigate to invoices via the menu link.
    await page.getByRole('link', { name: /invoices/i }).first().click();

    // Menu should close after navigation and the new heading should load.
    await page.waitForURL(/\/dealer\/invoices/, { timeout: 10_000 });
    await expectPageHeading(page, 'My Invoices');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sales mobile paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sales mobile paths', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('sales dashboard loads and shows heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales');
    await expect(page).toHaveURL(/\/sales/, { timeout: 10_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });

  test('sales mobile shell opens and closes cleanly', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales');
    await expect(page).toHaveURL(/\/sales/, { timeout: 10_000 });

    const shellWorked = await operateMobileShell(page);
    expect(shellWorked).toBe(true);
  });

  test('sales orders page shows "Sales Orders" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(PHONE_VIEWPORT.width + 4);
  });

  test('sales dealers page shows "Dealers" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/dealers');
    await expectPageHeading(page, 'Dealers');
  });

  test('sales credit requests page shows "Credit Requests" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/credit-requests');
    await expectPageHeading(page, 'Credit Requests');
  });

  test('sales invoices page shows "Invoices" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/invoices');
    await expectPageHeading(page, 'Invoices');
  });

  test('sales dispatch page shows "Dispatch" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/dispatch');
    await expectPageHeading(page, 'Dispatch');
  });

  test('sales returns page shows "Returns" heading on phone', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/returns');
    await expectPageHeading(page, 'Returns');
  });

  test('sales navigates between pages via mobile menu without losing context', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Start on orders page.
    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');

    // Open the mobile menu.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Close menu' }).waitFor({ state: 'visible' });

    // Navigate to dealers via the menu link.
    await page.getByRole('link', { name: /dealers/i }).first().click();

    // Menu should close after navigation and the new heading should load.
    await page.waitForURL(/\/sales\/dealers/, { timeout: 10_000 });
    await expectPageHeading(page, 'Dealers');
  });
});
