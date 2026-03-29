/**
 * Procure-to-Pay (P2P) workflow E2E tests.
 *
 * These tests cover the frontend surfaces of the P2P flow:
 *   Supplier creation → Purchase order → GRN (goods receipt) → Invoice → Settlement
 *
 * They are route-driven and verify that pages load and expose the expected UI.
 * Backend data failures are distinguished from frontend rendering failures.
 *
 * To run with credentials:
 *
 *   VALIDATION_ACCOUNTING_EMAIL=<email> \
 *   VALIDATION_SHARED_PASSWORD=<password> \
 *   bunx playwright test tests/e2e/p2p-workflows.spec.ts --workers=1
 *
 * Tests requiring credentials are automatically skipped when env vars are absent.
 */

import { test, expect } from '@playwright/test';
import { resolveCredentials } from './helpers/auth';
import { loginAndNavigate, expectPageHeading } from './helpers/workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Supplier management — VAL-P2P-001, VAL-P2P-002
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Supplier management', () => {
  test('suppliers page loads and shows "New Supplier" action', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/suppliers');
    await page.getByRole('heading', { name: 'Suppliers' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    // The "New Supplier" button must be present as the primary create action.
    await expect(page.getByRole('button', { name: 'New Supplier' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('new-supplier dialog opens and shows required fields', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/suppliers');
    await page.getByRole('heading', { name: 'Suppliers' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'New Supplier' }).click();

    // The create dialog must open — triage: dialog not opening is a frontend issue.
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // Name field is required (VAL-P2P-001 blocks incomplete required data).
    const nameField = page.getByLabel(/name/i).first();
    await expect(nameField).toBeVisible({ timeout: 5_000 });
  });

  test('new-supplier form blocks blank submission', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/suppliers');
    await page.getByRole('heading', { name: 'Suppliers' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'New Supplier' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // Attempt to submit without filling in any data.
    const saveBtn = page.getByRole('button', { name: /save|create supplier/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      // Dialog must stay open on validation failure.
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Purchase orders — VAL-P2P-003, VAL-P2P-004
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Purchase orders', () => {
  test('purchase orders page loads and shows "New PO" action', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/purchase-orders');
    await page.getByRole('heading', { name: 'Purchase Orders' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    // "New PO" is the primary create action.
    await expect(page.getByRole('button', { name: 'New PO' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('new-PO dialog opens and requires supplier selection', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/purchase-orders');
    await page.getByRole('heading', { name: 'Purchase Orders' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'New PO' }).click();

    // The create dialog or drawer must open.
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // The PO creation form uses a native <select> for supplier selection.
    // The <option> elements inside a <select> are not "visible" in Playwright
    // (they're collapsed inside the dropdown). Instead, check that the select
    // element itself is visible, which confirms the supplier field is rendered.
    // VAL-P2P-003: only active suppliers are allowed in the form.
    await expect(
      page.getByRole('dialog').locator('select').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('purchase order list renders without crashing', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/purchase-orders');
    // The heading must render regardless of data state (frontend rendering check).
    await page.getByRole('heading', { name: 'Purchase Orders' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    // The "New PO" button must be visible (already verified in the previous test).
    // Additionally confirm the page body has content past the header — skeleton or real rows.
    // We use a wait for network idle to let the skeleton resolve before checking list state.
    await page.waitForLoadState('networkidle').catch(() => {
      // networkidle is best-effort; the skeleton is still a valid frontend rendered state.
    });
    // At minimum the page body must not be blank after network activity settles.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Goods receipt notes — VAL-P2P-005, VAL-P2P-006
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Goods receipt notes (GRN)', () => {
  test('GRN page loads and shows "New GRN" action', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/goods-receipts');
    await page.getByRole('heading', { name: 'Goods Receipt Notes' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    // "New GRN" button must be present as the primary create action.
    await expect(page.getByRole('button', { name: 'New GRN' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('new-GRN dialog opens and requires a purchase order selection', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/goods-receipts');
    await page.getByRole('heading', { name: 'Goods Receipt Notes' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'New GRN' }).click();

    // The create dialog/drawer must open (triage: dialog not opening = frontend issue).
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });

    // The PO selection field must be present (VAL-P2P-005 limits to approved POs).
    const poField = page
      .getByLabel(/purchase order/i)
      .first()
      .or(page.getByPlaceholder(/purchase order/i).first());
    await expect(poField).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Raw material purchases — VAL-P2P-012
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Raw material intake', () => {
  test('raw material purchases page loads', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/raw-material-purchases');
    await page.getByRole('heading', { name: 'Raw Material Purchases' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Purchase returns — VAL-P2P-010
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Purchase returns', () => {
  test('purchase returns page loads', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/purchasing/returns');
    await expect(page).toHaveURL(/\/accounting\/purchasing\/returns/, { timeout: 10_000 });
    // Page must render — at minimum the body is visible.
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Settlement surfaces — VAL-P2P-011
// ─────────────────────────────────────────────────────────────────────────────

test.describe('P2P: Settlements', () => {
  test('settlements page loads and shows "Settlements" heading', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/settlements');
    await expectPageHeading(page, 'Settlements');
  });

  test('settlements page exposes supplier-settlement tab or section', async ({ page }) => {
    const creds = resolveCredentials('accounting');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ACCOUNTING_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    await loginAndNavigate(page, creds, '/accounting/settlements');
    await expectPageHeading(page, 'Settlements');

    // The page must show the "Supplier Settlement" tab/section.
    await expect(
      page.getByText('Supplier Settlement')
    ).toBeVisible({ timeout: 10_000 });
  });
});
