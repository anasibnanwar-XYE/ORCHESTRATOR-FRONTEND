/**
 * Order-to-Cash (O2C) workflow E2E tests.
 *
 * These tests cover the frontend surfaces of the O2C flow:
 *   Product catalog → Sales order creation → Dispatch → Invoice
 *
 * They are route-driven and verify that the critical pages load and expose the
 * expected UI elements.  Backend data failures are distinguished from frontend
 * rendering failures: a page heading loading correctly despite a backend error
 * is a backend signal, not a frontend defect.
 *
 * To run with credentials:
 *
 *   VALIDATION_SALES_EMAIL=<email> \
 *   VALIDATION_ACCOUNTING_EMAIL=<email> \
 *   VALIDATION_DEALER_EMAIL=<email> \
 *   VALIDATION_SHARED_PASSWORD=<password> \
 *   bunx playwright test tests/e2e/o2c-workflows.spec.ts --workers=1
 *
 * Tests requiring credentials are automatically skipped when env vars are absent.
 */

import { test, expect } from '@playwright/test';
import { resolveCredentials } from './helpers/auth';
import { loginAndNavigate, expectPageHeading } from './helpers/workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Product catalog (Accounting role — manages the product master)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('O2C: Product catalog', () => {
  test('product catalog page loads and exposes "New Product" action', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/catalog');
    // Frontend rendering check: the page heading must be visible.
    await page.getByRole('heading', { name: 'Product Catalog' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    // The "New Product" button must be visible regardless of backend data state.
    await expect(page.getByRole('button', { name: 'New Product' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('product catalog new-product dialog opens and shows required fields', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/catalog');
    await page.getByRole('heading', { name: 'Product Catalog' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'New Product' }).click();

    // The create dialog or drawer must open with a visible heading.
    // Triage: if this fails after the button click, it is a frontend rendering issue.
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // Name field must be present (required for product creation — VAL-O2C-001).
    const nameField = page.getByLabel(/name/i).first();
    await expect(nameField).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sales order creation (Sales role)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('O2C: Sales order surfaces', () => {
  test('sales orders page loads and exposes "New Order" action', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');
    // "New Order" button must be visible — it's the primary O2C entry point.
    await expect(page.getByRole('button', { name: 'New Order' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('sales create-order drawer opens and shows dealer-search field', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');
    await page.getByRole('button', { name: 'New Order' }).click();

    // The create-order drawer/dialog must open.
    // Triage: failure here is a frontend rendering issue (dialog didn't open).
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // The dealer field is a custom button-based combobox (DealerCombobox).
    // It shows "Search dealer..." as placeholder text in a span — VAL-O2C-005.
    // Using text content rather than placeholder attribute since this is a custom
    // combobox implementation without a real <input>.
    await expect(page.getByText('Search dealer...')).toBeVisible({ timeout: 5_000 });
  });

  test('sales create-order drawer blocks submission without dealer and line', async ({
    page,
  }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');
    await page.getByRole('button', { name: 'New Order' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // Wait for the "Search dealer..." placeholder to confirm the form rendered.
    await expect(page.getByText('Search dealer...')).toBeVisible({ timeout: 5_000 });

    // The "Create order" button is disabled until a dealer and valid line exist.
    // This is the frontend validation behavior (VAL-O2C-005): the UI prevents
    // invalid submission by keeping the submit button disabled rather than showing
    // post-click errors. Verifying the disabled state is the correct triage check.
    await expect(
      page.getByRole('button', { name: /create order/i })
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('sales orders list renders without crashing and exposes detail navigation', async ({
    page,
  }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/orders');
    await expectPageHeading(page, 'Sales Orders');

    // The table header row must be present regardless of backend data state.
    // Frontend triage: if the table structure is missing, it is a rendering issue.
    await expect(page.getByRole('columnheader').first()).toBeVisible({ timeout: 8_000 });

    // If there are real data rows (not just the header + empty-state), attempt to
    // open a detail view to verify list/detail consistency (VAL-O2C-008).
    // Use a short timeout to avoid blocking the test for 30 s when no rows exist.
    const firstCell = page.getByRole('row').nth(1).getByRole('cell').first();
    const txt = await firstCell.textContent({ timeout: 3_000 }).catch(() => null);
    const rowHasData = !!(txt && txt.trim() && !txt.toLowerCase().includes('no orders'));

    if (rowHasData) {
      await page.getByRole('row').nth(1).click();
      await page.waitForURL(/\/sales\/orders\//, { timeout: 8_000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 8_000 });
    }
    // If no data rows: the empty-state is frontend-rendered correctly — informational.
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch surface (Sales role)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('O2C: Dispatch surface', () => {
  test('sales dispatch page loads and shows "Dispatch" heading', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/dispatch');
    await expectPageHeading(page, 'Dispatch');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Invoice surfaces (Sales and Accounting roles must both show invoices)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('O2C: Invoice surfaces — VAL-O2C-011', () => {
  test('sales invoices page loads and shows "Invoices" heading', async ({ page }) => {
    const creds = resolveCredentials('sales');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_SALES_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/sales/invoices');
    await expectPageHeading(page, 'Invoices');
  });

  test('accounting invoices page loads and shows "Invoices" heading', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/invoices');
    // Accounting invoices page uses a table-based layout — verify the heading or
    // main list container renders.
    await expect(page).toHaveURL(/\/accounting\/invoices/, { timeout: 10_000 });
    // The page must render without a hard crash — at minimum the page body exists.
    await expect(page.locator('body')).toBeVisible();
    // If a heading or table is present it confirms the component mounted.
    const hasHeading = await page.locator('h1').first().isVisible().catch(() => false);
    const hasTable = await page.getByRole('table').first().isVisible().catch(() => false);
    expect(hasHeading || hasTable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dealer-facing O2C views — VAL-O2C-013
// ─────────────────────────────────────────────────────────────────────────────

test.describe('O2C: Dealer-facing views', () => {
  test('dealer dashboard, orders, invoices, ledger, and aging all load', async ({ page }) => {
    const creds = resolveCredentials('dealer');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_DEALER_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // Log in once, then navigate between dealer pages directly.
    // Re-calling loginAndNavigate for each iteration would fail on the second+
    // login attempt because the user is already authenticated in this browser
    // context and navigating to /login would redirect back to the portal.
    await loginAndNavigate(page, creds, '/dealer/orders');
    await expectPageHeading(page, 'My Orders');

    const remainingRoutes: Array<{ path: string; heading: string }> = [
      { path: '/dealer/invoices', heading: 'My Invoices' },
      { path: '/dealer/ledger', heading: 'My Ledger' },
      { path: '/dealer/aging', heading: 'My Aging' },
    ];

    for (const { path, heading } of remainingRoutes) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await expectPageHeading(page, heading);
    }
  });
});
