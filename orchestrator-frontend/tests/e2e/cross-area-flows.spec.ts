/**
 * Cross-area E2E flow tests — VAL-CROSS-001 through VAL-CROSS-004.
 *
 * These tests verify end-to-end workflows that span multiple admin portal pages
 * and features against the real backend:
 *
 *   1. Full workflow: login → dashboard → Users → create user → Approvals → Dashboard → sign out
 *   2. Theme persistence across navigation and page reload
 *   3. Mobile full flow at 375px viewport
 *   4. User lifecycle: create → edit → suspend → unsuspend → force reset → delete
 *
 * Credentials are read from environment variables and never hardcoded.
 * Tests are automatically skipped when env vars are absent.
 *
 *   VALIDATION_ADMIN_EMAIL=... \
 *   VALIDATION_SHARED_PASSWORD=... \
 *   bunx playwright test tests/e2e/cross-area-flows.spec.ts --workers=1
 */

import { test, expect, type Page } from '@playwright/test';
import { resolveCredentials } from './helpers/auth';
import type { ValidationCredentials } from './helpers/auth';
import { SMALL_PHONE_VIEWPORT } from './helpers/workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Login helpers — uses actual form labels ("Email", "Password", "Company code")
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fill and submit the login form using the actual label text.
 * The login page uses <label><span>Email</span><input/></label> etc.
 */
async function fillLoginForm(page: Page, creds: ValidationCredentials): Promise<void> {
  await page.getByLabel('Email').fill(creds.email);
  // Password field: the label says "Password" but the show/hide toggle button
  // also contains "password" in its aria-label. Use the textbox with placeholder.
  await page.getByPlaceholder('Enter your password').fill(creds.password);
  await page.getByLabel('Company code').fill(creds.companyCode);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

/**
 * Navigate to /login and log in. Returns the final pathname after login.
 */
async function loginAs(page: Page, creds: ValidationCredentials): Promise<string> {
  await page.goto('/login');
  await fillLoginForm(page, creds);
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  return new URL(page.url()).pathname;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a unique email for test user creation. */
function uniqueEmail(): string {
  return `val-e2e-${Date.now()}@test.com`;
}

/** Generate a unique display name for test user creation. */
function uniqueDisplayName(): string {
  return `E2E Cross ${Date.now()}`;
}

/**
 * Create a test user via the UI and return their display name.
 * Assumes page is on /admin/users.
 */
async function createTestUser(
  page: import('@playwright/test').Page,
  email: string,
  displayName: string
): Promise<void> {
  // Click Add User
  await page.getByRole('button', { name: 'Add User' }).click();
  await page.getByRole('dialog', { name: 'Create User' }).waitFor({ state: 'visible' });

  // Fill form
  await page.getByRole('dialog').getByLabel('Email').fill(email);
  await page.getByRole('dialog').getByLabel('Display Name').fill(displayName);

  // Select Sales role via JS (RoleSelector uses div[role="checkbox"])
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const roleCards = dialog.querySelectorAll('[role="checkbox"]');
    // Pick Sales (index 3: Admin=0, Accounting=1, Factory=2, Sales=3, Dealer=4)
    if (roleCards.length > 3) (roleCards[3] as HTMLElement).click();
  });

  // Select company
  const companySelect = page.getByRole('dialog').locator('select');
  const options = await companySelect.locator('option:not([disabled])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) await companySelect.selectOption(value);
  }

  // Submit
  await page.getByRole('dialog').getByRole('button', { name: 'Create User' }).click();

  // Wait for toast and dialog close
  await expect(page.getByText('User created')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('dialog', { name: 'Create User' })).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Open the actions dropdown for a user and click an action by text.
 * Uses JS evaluation because dropdown menu items are portaled.
 */
async function clickUserAction(
  page: import('@playwright/test').Page,
  userDisplayName: string,
  actionText: string
): Promise<void> {
  // Find the user row and its actions button
  const row = page.getByRole('row', { name: new RegExp(userDisplayName) });
  const actionsBtn = row.locator('button').last();
  await actionsBtn.click();

  // Wait for dropdown to appear and click the action
  await page.waitForTimeout(500);
  await page.evaluate((text) => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === text && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }, actionText);
}

// ─────────────────────────────────────────────────────────────────────────────
// VAL-CROSS-001: Full admin workflow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('VAL-CROSS-001: Full admin workflow', () => {
  test.setTimeout(90_000);

  test('login → dashboard → Users → create user → Approvals → Dashboard → sign out', async ({ page }) => {
    const creds = resolveCredentials('admin');
    if (!creds) {
      test.skip(true, 'Skipped: VALIDATION_ADMIN_EMAIL or VALIDATION_SHARED_PASSWORD not set');
      return;
    }

    // 1. Login
    const destination = await loginAs(page, creds);
    expect(destination).toBe('/hub');

    // 2. Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });

    // 3. Navigate to Users via sidebar
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    // 4. Create a test user
    const email = uniqueEmail();
    const displayName = uniqueDisplayName();
    await createTestUser(page, email, displayName);

    // Search for new user to find it (may be on page 2 if many users exist)
    await page.getByPlaceholder('Search by name or email').fill(displayName);
    await page.waitForTimeout(1000);
    await expect(page.getByRole('grid').getByText(displayName)).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('Search by name or email').clear();

    // 5. Navigate to Approvals
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Approvals' }).click();
    await expect(page).toHaveURL(/\/admin\/approvals/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible();

    // 6. Navigate back to Dashboard
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });

    // 7. Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Verify session cleared (localStorage tokens removed)
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(accessToken).toBeNull();

    // Clean up: log back in and delete the test user
    await fillLoginForm(page, creds);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Delete via actions dropdown
    await clickUserAction(page, displayName, 'Delete');
    await page.waitForTimeout(500);
    const confirmBtn = page.getByRole('alertdialog').getByRole('button', { name: 'Delete' });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VAL-CROSS-002: Theme persistence across navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('VAL-CROSS-002: Theme persistence', () => {
  test.setTimeout(60_000);

  test('dark mode persists across navigation and page reload', async ({ page }) => {
    const creds = resolveCredentials('admin');
    if (!creds) {
      test.skip(true, 'Skipped: credentials not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Toggle dark mode
    await page.getByRole('button', { name: /dark mode/i }).click();
    await page.waitForTimeout(500);

    // Verify dark class on html
    let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Navigate to /admin/users
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Navigate to /admin/finance
    await page.goto('/admin/finance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Reload page — dark mode should persist
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // Restore light mode for subsequent tests
    await page.getByRole('button', { name: /light mode/i }).click();
    await page.waitForTimeout(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VAL-CROSS-003: Mobile full flow at 375px
// ─────────────────────────────────────────────────────────────────────────────

test.describe('VAL-CROSS-003: Mobile full flow', () => {
  test.use({ viewport: SMALL_PHONE_VIEWPORT });
  test.setTimeout(60_000);

  test('drawer nav, card layouts, single-column forms at 375px', async ({ page }) => {
    const creds = resolveCredentials('admin');
    if (!creds) {
      test.skip(true, 'Skipped: credentials not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify hamburger menu is visible (sidebar hidden)
    const hamburger = page.getByRole('button', { name: 'Open menu' });
    await expect(hamburger).toBeVisible({ timeout: 5_000 });

    // Open mobile drawer
    await hamburger.click();
    await page.waitForTimeout(1000);

    // Navigate to Users via drawer — use the sidebar nav link (force click to bypass overlay)
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Users' }).click({ force: true });
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Verify no horizontal overflow on Users page
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);

    // Open create user modal and verify layout
    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(page.getByRole('dialog', { name: 'Create User' })).toBeVisible();

    // Close modal
    await page.getByRole('dialog').getByRole('button', { name: 'Close dialog' }).click();
    await expect(page.getByRole('dialog', { name: 'Create User' })).not.toBeVisible();

    // Open drawer and navigate to Support
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Tickets' }).click({ force: true });
    await expect(page).toHaveURL(/\/admin\/support/, { timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Verify no horizontal overflow on Support page
    const supportOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(supportOverflow).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VAL-CROSS-004: User lifecycle E2E
// ─────────────────────────────────────────────────────────────────────────────

test.describe('VAL-CROSS-004: User lifecycle', () => {
  test.setTimeout(120_000);

  test('create → edit → suspend → unsuspend → force reset → delete', async ({ page }) => {
    const creds = resolveCredentials('admin');
    if (!creds) {
      test.skip(true, 'Skipped: credentials not set');
      return;
    }

    await loginAs(page, creds);
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const email = uniqueEmail();
    const displayName = uniqueDisplayName();
    const updatedName = `${displayName} Updated`;

    // ── Step 1: CREATE ──
    await createTestUser(page, email, displayName);
    // Search for user to ensure it's visible (may be on page 2 if many users)
    await page.getByPlaceholder('Search by name or email').fill(displayName);
    await page.waitForTimeout(1000);
    await expect(page.getByRole('grid').getByText(displayName)).toBeVisible({ timeout: 10_000 });

    // ── Step 2: EDIT (keep search filter active so user is visible) ──
    await clickUserAction(page, displayName, 'Edit');
    await page.waitForTimeout(1000);

    const editDialog = page.getByRole('dialog', { name: 'Edit User' });
    await expect(editDialog).toBeVisible({ timeout: 5_000 });

    await editDialog.getByLabel('Display Name').fill(updatedName);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('User updated')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Re-search with updated name
    await page.getByPlaceholder('Search by name or email').fill(updatedName);
    await page.waitForTimeout(1000);

    // ── Step 3: SUSPEND ──
    await clickUserAction(page, updatedName, 'Suspend');
    await page.waitForTimeout(1000);

    const suspendDialog = page.getByRole('alertdialog', { name: 'Suspend user' });
    await expect(suspendDialog).toBeVisible({ timeout: 5_000 });
    await suspendDialog.getByRole('button', { name: 'Suspend' }).click();
    await expect(page.getByText('User suspended')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Verify status changed to Suspended
    const userRow = page.getByRole('row', { name: new RegExp(updatedName) });
    await expect(userRow.getByText('Suspended')).toBeVisible({ timeout: 5_000 });

    // ── Step 4: UNSUSPEND ──
    await clickUserAction(page, updatedName, 'Unsuspend');
    await page.waitForTimeout(1000);

    const unsuspendDialog = page.getByRole('alertdialog', { name: 'Unsuspend user' });
    await expect(unsuspendDialog).toBeVisible({ timeout: 5_000 });
    await unsuspendDialog.getByRole('button', { name: 'Unsuspend' }).click();
    await expect(page.getByText('User unsuspended')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Verify status back to Active
    await expect(userRow.getByText('Active')).toBeVisible({ timeout: 5_000 });

    // ── Step 5: FORCE RESET PASSWORD ──
    await clickUserAction(page, updatedName, 'Force reset password');
    await page.waitForTimeout(1000);

    const resetDialog = page.getByRole('alertdialog', { name: 'Force reset password' });
    await expect(resetDialog).toBeVisible({ timeout: 5_000 });
    await resetDialog.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Password reset sent')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // ── Step 6: DELETE ──
    await clickUserAction(page, updatedName, 'Delete');
    await page.waitForTimeout(1000);

    const deleteDialog = page.getByRole('alertdialog', { name: 'Delete user' });
    await expect(deleteDialog).toBeVisible({ timeout: 5_000 });
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('User deleted')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Verify user no longer in list
    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 5_000 });
  });
});
