# Orchestrator ERP — UAT Test Plan

**Version:** 1.0  
**Date:** March 2026  
**Application:** Orchestrator ERP Frontend  
**Base URL:** `http://localhost:3002` (or deployed URL)  
**Backend API:** `http://100.109.241.47:8081`  

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Accounts](#test-accounts)
3. [Area: Authentication](#area-authentication)
4. [Area: Shell & Navigation](#area-shell--navigation)
5. [Area: Admin Portal](#area-admin-portal)
6. [Area: Superadmin Portal](#area-superadmin-portal)
7. [Area: Accounting Portal](#area-accounting-portal)
8. [Area: Sales Portal](#area-sales-portal)
9. [Area: Factory Portal](#area-factory-portal)
10. [Area: Dealer Portal](#area-dealer-portal)
11. [Cross-Area Flows](#cross-area-flows)
12. [Mobile & Polish](#mobile--polish)

---

## Prerequisites

- Browser: Chrome 120+ or Firefox 120+ (latest stable recommended)
- Mobile testing: iOS Safari 17+ / Chrome on Android 14+
- Dev tools open during testing (Console tab for errors, Network tab for API calls)
- Backend API running at `http://100.109.241.47:8081` (verify: `GET /actuator/health`)
- Frontend running at `http://localhost:3002` (run `bun dev` in `orchestrator-frontend/`)
- Clear `localStorage` before starting a new test session

---

## Test Accounts

Coordinate with your admin to provision the following test users. Record credentials here before testing.

| Role | Email | Password | Company Code | Notes |
|------|-------|----------|--------------|-------|
| Admin (single-role) | | | | Should land directly on `/admin` |
| Admin + Sales (multi-role) | | | | Should see portal hub |
| Superadmin | | | | Isolated — no access to other portals |
| Accounting | | | | |
| Sales | | | | |
| Factory | | | | |
| Dealer | | | | |
| MFA-enabled user | | | | Has TOTP MFA configured |
| Locked/disabled user | | | | `isActive = false` |
| Must-change-password user | | | | `mustChangePassword = true` |
| Multi-company user | | | | Has access to 2+ companies |

---

## Area: Authentication

### TC-AUTH-001: Successful Login
**Assertion ID:** VAL-AUTH-001  
**URL:** `/login`

- [ ] 1. Navigate to `/login`
- [ ] 2. Enter valid email, password, and company code
- [ ] 3. Click "Sign In"
- [ ] 4. Verify redirect to portal hub (multi-role) or portal dashboard (single-role) within 2 seconds
- [ ] 5. Open dev tools > Application > Local Storage and confirm these keys exist:
  - `bbp-orchestrator-access-token`
  - `bbp-orchestrator-refresh-token`
  - `bbp-orchestrator-user`
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-002: Invalid Credentials Error
**Assertion ID:** VAL-AUTH-002  
**URL:** `/login`

- [ ] 1. Navigate to `/login`
- [ ] 2. Enter incorrect email or password
- [ ] 3. Click "Sign In"
- [ ] 4. Verify a toast error appears with a user-friendly message (e.g., "Invalid credentials")
- [ ] 5. Verify the toast does NOT show raw HTTP codes, JSON, or stack traces
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-003: Locked / Disabled Account
**Assertion ID:** VAL-AUTH-003  
**URL:** `/login`

- [ ] 1. Attempt to log in with the locked/disabled test account
- [ ] 2. Verify a specific message appears (e.g., "Your account has been deactivated. Contact your administrator.")
- [ ] 3. Verify it is NOT a generic "Login failed" message
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-004: MFA Challenge Redirect
**Assertion ID:** VAL-AUTH-004  
**URL:** `/login` → `/mfa`

- [ ] 1. Log in with the MFA-enabled test account
- [ ] 2. Verify the API returns HTTP 428
- [ ] 3. Verify the browser redirects to `/mfa`
- [ ] 4. Verify the MFA code input field is visible and focused
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-005: MFA State Survives App Switch (Mobile)
**Assertion ID:** VAL-AUTH-005  
**URL:** `/mfa`

- [ ] 1. On a mobile device, reach the `/mfa` page (TC-AUTH-004)
- [ ] 2. Switch to an authenticator app (e.g., Google Authenticator)
- [ ] 3. Switch back to the browser
- [ ] 4. Verify the MFA page is still displayed with input field intact
- [ ] 5. Verify no re-login is required
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-006: Valid MFA Code Submission
**Assertion ID:** VAL-AUTH-006  
**URL:** `/mfa`

- [ ] 1. On the MFA page, enter the correct 6-digit TOTP code from your authenticator app
- [ ] 2. Submit the code
- [ ] 3. Verify tokens are stored in localStorage (same as TC-AUTH-001 step 5)
- [ ] 4. Verify redirect to portal hub or portal dashboard
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-007: Invalid MFA Code
**Assertion ID:** VAL-AUTH-007  
**URL:** `/mfa`

- [ ] 1. On the MFA page, enter an incorrect 6-digit code (e.g., "000000")
- [ ] 2. Submit the code
- [ ] 3. Verify an error toast appears (e.g., "Invalid verification code")
- [ ] 4. Verify the input field is cleared and re-focused
- [ ] 5. Verify no redirect occurs
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-008: Forced Password Change Gate
**Assertion ID:** VAL-AUTH-008  
**URL:** `/change-password`

- [ ] 1. Log in with the must-change-password test account
- [ ] 2. Verify a full-screen password change form is displayed
- [ ] 3. Try to navigate to any other URL (e.g., `/admin`) via the address bar
- [ ] 4. Verify you are blocked and returned to the password change form
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-009: Password Validation Rules
**Assertion ID:** VAL-AUTH-009  
**URL:** `/change-password` or Profile > Change Password

- [ ] 1. Open any password change form
- [ ] 2. Type "short" — verify at least the length rule is highlighted as unmet
- [ ] 3. Type "abcdefghij" (10 chars, lowercase only) — verify uppercase/digit/special rules unmet
- [ ] 4. Type "Abcdefgh1!" (meets all rules) — verify all rules show as met
- [ ] 5. Verify the submit button is disabled until all 5 rules pass (min 10 chars, uppercase, lowercase, digit, special char)
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-010: Forgot Password
**Assertion ID:** VAL-AUTH-010  
**URL:** `/forgot-password`

- [ ] 1. Navigate to `/forgot-password`
- [ ] 2. Enter a valid email and submit
- [ ] 3. Verify a confirmation message appears (e.g., "If an account exists, a reset link has been sent")
- [ ] 4. Enter a non-existent email and submit
- [ ] 5. Verify the SAME confirmation message appears (no email enumeration)
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-011: Reset Password with Token
**Assertion ID:** VAL-AUTH-011  
**URL:** `/reset-password?token=<token>`

- [ ] 1. Navigate to `/reset-password?token=<valid-token>` (obtain token from forgot-password email)
- [ ] 2. Enter a new password meeting all validation rules
- [ ] 3. Submit
- [ ] 4. Verify redirect to `/login` with a success toast
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-012: Session Persistence Across Refresh
**Assertion ID:** VAL-AUTH-012  
**URL:** Any portal page

- [ ] 1. Log in and navigate to any portal page
- [ ] 2. Press F5 / Cmd+R to refresh the browser
- [ ] 3. Verify the portal loads within 3 seconds without showing the login page
- [ ] 4. Verify no login page "flash" occurs
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-013: Token Refresh on 401
**Assertion ID:** VAL-AUTH-013  
**URL:** Any portal page

- [ ] 1. Log in and use the application until a token expires (or manually delete the access token from localStorage)
- [ ] 2. Perform any action that triggers an API call
- [ ] 3. Open Network tab: verify a single `POST /auth/refresh-token` call fires
- [ ] 4. Verify the original request is retried and succeeds
- [ ] 5. Verify no error toast is shown to the user
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-014: Logout
**Assertion ID:** VAL-AUTH-014  
**URL:** Any portal page → `/login`

- [ ] 1. Click "Sign out" from the profile menu
- [ ] 2. Verify redirect to `/login`
- [ ] 3. Open localStorage and verify ALL of these keys are removed:
  - `bbp-orchestrator-access-token`
  - `bbp-orchestrator-refresh-token`
  - `bbp-orchestrator-user`
  - `bbp-orchestrator-company-code`
  - `bbp-orchestrator-company-id`
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-015: Profile View
**Assertion ID:** VAL-AUTH-015  
**URL:** `/profile`

- [ ] 1. Navigate to `/profile` (or click profile menu > "Profile")
- [ ] 2. Verify the following fields are populated: firstName, lastName, email, role, mfaEnabled, companyCode
- [ ] 3. Open Network tab and compare rendered values with `GET /auth/profile` response
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-016: Profile Update
**Assertion ID:** VAL-AUTH-016  
**URL:** `/profile`

- [ ] 1. Edit firstName or lastName on the profile page
- [ ] 2. Click Save
- [ ] 3. Verify a success toast appears
- [ ] 4. Verify the displayed values update without page reload
- [ ] 5. Verify Network tab shows `PUT /auth/profile` with the changed fields
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-017: MFA Setup — QR Code
**Assertion ID:** VAL-AUTH-017  
**URL:** `/profile` (Security section)

- [ ] 1. On the profile/security page, initiate MFA setup (click "Enable MFA" or similar)
- [ ] 2. Verify a QR code is rendered (scannable image)
- [ ] 3. Verify a manual entry secret is displayed below the QR code
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-018: MFA Activation
**Assertion ID:** VAL-AUTH-018  
**URL:** `/profile`

- [ ] 1. After scanning the QR code (TC-AUTH-017), enter the TOTP code from your authenticator
- [ ] 2. Submit
- [ ] 3. Verify a success message appears
- [ ] 4. Verify the profile now shows MFA as enabled
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-019: MFA Disable
**Assertion ID:** VAL-AUTH-019  
**URL:** `/profile`

- [ ] 1. On the profile page with MFA enabled, click "Disable MFA"
- [ ] 2. Verify a confirmation dialog appears
- [ ] 3. Confirm
- [ ] 4. Verify MFA status reverts to disabled
- [ ] 5. Verify a confirmation toast appears
- [ ] **Pass/Fail:** ____

---

### TC-AUTH-020: Company Switching
**Assertion ID:** VAL-AUTH-020  
**URL:** Any portal page

- [ ] 1. Log in with the multi-company test account
- [ ] 2. Note the current company name and dashboard data
- [ ] 3. Click the company switcher in the header/sidebar
- [ ] 4. Select a different company
- [ ] 5. Verify localStorage keys update: `bbp-orchestrator-company-code`, `bbp-orchestrator-company-id`
- [ ] 6. Verify dashboard data refreshes to show the new company's data
- [ ] 7. Open Network tab and verify subsequent requests use the new `X-Company-Code` header
- [ ] **Pass/Fail:** ____

---

## Area: Shell & Navigation

### TC-SHELL-001: Portal Hub for Multi-Role Users
**Assertion ID:** VAL-SHELL-001  
**URL:** `/hub`

- [ ] 1. Log in with the multi-role test account (e.g., Admin + Sales)
- [ ] 2. Verify you land on `/hub`
- [ ] 3. Verify a card/tile is shown for each accessible portal (matching user roles)
- [ ] 4. Verify no extra portals are shown
- [ ] 5. Click a portal card and verify navigation to that portal
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-002: Direct Portal for Single-Role Users
**Assertion ID:** VAL-SHELL-002  
**URL:** Direct portal route (e.g., `/admin`)

- [ ] 1. Log in with a single-role test account (e.g., Admin only)
- [ ] 2. Verify you skip the hub and land directly on the portal dashboard (e.g., `/admin`)
- [ ] 3. Verify the hub page never flashes
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-003: Superadmin Isolation
**Assertion ID:** VAL-SHELL-003  
**URL:** `/superadmin`

- [ ] 1. Log in as superadmin
- [ ] 2. Try navigating to `/admin` via the address bar — verify blocked/redirected
- [ ] 3. Try `/sales` — verify blocked/redirected
- [ ] 4. Try `/accounting` — verify blocked/redirected
- [ ] 5. Try `/factory` — verify blocked/redirected
- [ ] 6. Try `/dealer` — verify blocked/redirected
- [ ] 7. Verify the sidebar contains NO links to other portals
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-004: Portal Layout
**Assertion ID:** VAL-SHELL-004  
**URL:** Each portal's dashboard

- [ ] 1. Navigate to each portal (Admin, Accounting, Sales, Factory, Dealer, Superadmin)
- [ ] 2. For each, verify three regions are visible:
  - Sidebar (left, ~224px on desktop)
  - Top header bar
  - Main content area
- [ ] 3. Verify no regions overlap or are missing
- [ ] **Pass/Fail per portal:**
  - Admin: ____
  - Accounting: ____
  - Sales: ____
  - Factory: ____
  - Dealer: ____
  - Superadmin: ____

---

### TC-SHELL-005: Dark/Light Mode Toggle
**Assertion ID:** VAL-SHELL-005  
**URL:** Any portal page

- [ ] 1. Click the theme toggle (sun/moon icon in header)
- [ ] 2. Verify the UI switches between dark and light mode
- [ ] 3. Open localStorage and verify `o-theme` is set to `'dark'` or `'light'`
- [ ] 4. Refresh the page (F5)
- [ ] 5. Verify the theme persists with no flash of the wrong theme
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-006: Command Palette
**Assertion ID:** VAL-SHELL-006  
**URL:** Any portal page

- [ ] 1. Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)
- [ ] 2. Verify a modal command palette opens with search input focused
- [ ] 3. Type a page name (e.g., "users")
- [ ] 4. Verify matching results appear
- [ ] 5. Select a result and verify navigation to the correct page
- [ ] 6. Re-open palette and press `Escape` — verify it closes
- [ ] 7. Re-open palette and click outside — verify it closes
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-007: Module Gating — Hidden Nav
**Assertion ID:** VAL-SHELL-007  
**URL:** Any portal sidebar

- [ ] 1. Identify a module that is disabled for the current company/tenant
- [ ] 2. Check the sidebar navigation — verify the disabled module's link is NOT in the DOM (not just hidden)
- [ ] 3. Open the command palette — verify the disabled module does NOT appear in results
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-008: Module Gating — Direct URL
**Assertion ID:** VAL-SHELL-008  
**URL:** Disabled module's route

- [ ] 1. Navigate directly (via address bar) to a route belonging to a disabled module
- [ ] 2. Verify a "Module not available" page is shown (NOT a 404 or blank page)
- [ ] 3. Verify a "Go back" or "Return to home" button works
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-009: Mobile Sidebar
**Assertion ID:** VAL-SHELL-009  
**URL:** Any portal page at mobile viewport

- [ ] 1. Resize browser to < 1024px width (or test on mobile device)
- [ ] 2. Verify the sidebar is hidden by default
- [ ] 3. Tap the hamburger menu button
- [ ] 4. Verify the sidebar slides in as a drawer with a backdrop
- [ ] 5. Tap the backdrop — verify the drawer closes
- [ ] 6. Re-open and tap a nav item — verify the drawer closes and navigation occurs
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-010: Breadcrumb Navigation
**Assertion ID:** VAL-SHELL-010  
**URL:** Any nested page

- [ ] 1. Navigate to a nested page (e.g., `/accounting/journals/123`)
- [ ] 2. Verify breadcrumbs show the path (e.g., "Accounting > Journals > #123")
- [ ] 3. Click a preceding breadcrumb segment — verify it navigates correctly
- [ ] 4. Verify the last segment is not clickable
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-011: Back to Hub Button
**Assertion ID:** VAL-SHELL-011  
**URL:** Any portal (multi-role user)

- [ ] 1. Log in as a multi-role user
- [ ] 2. Navigate to any portal
- [ ] 3. Verify a "Back to Hub" button or portal-switcher icon is visible
- [ ] 4. Click it — verify navigation to `/hub`
- [ ] 5. Log in as a single-role user
- [ ] 6. Verify the "Back to Hub" button is NOT present
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-012: Error Boundary
**Assertion ID:** VAL-SHELL-012  
**URL:** Any portal page

- [ ] 1. If a page throws a rendering error, verify a fallback UI appears ("Something went wrong" with a Reload button)
- [ ] 2. Verify the sidebar and header remain functional
- [ ] 3. Verify clicking "Reload" recovers the page
- [ ] *(Note: This may require a developer to inject a test error, or may be observed naturally if a page crashes)*
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-013: Code Splitting
**Assertion ID:** VAL-SHELL-013  
**URL:** Any portal transition

- [ ] 1. Open Network tab, clear it
- [ ] 2. Navigate from login to a portal
- [ ] 3. Verify separate JS chunk files load on demand (not all portal code in one bundle)
- [ ] 4. Navigate to a different portal — verify a new chunk loads
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-014: Splash Screen
**Assertion ID:** VAL-SHELL-014  
**URL:** `/` (cold start)

- [ ] 1. Clear browser cache and localStorage
- [ ] 2. Navigate to the app URL
- [ ] 3. Verify a branded splash screen appears with the Orchestrator logo
- [ ] 4. Verify it dismisses within ~3 seconds and transitions to login or portal
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-015: Toast Notifications
**Assertion ID:** VAL-SHELL-015  
**URL:** Any page that triggers toasts

- [ ] 1. Trigger a success action (e.g., save settings) — verify a success toast appears top-right and auto-dismisses after ~4-5 seconds
- [ ] 2. Trigger an error (e.g., invalid form submit) — verify an error toast appears and stays until manually closed
- [ ] 3. Verify toast styling matches its type (green for success, red for error, etc.)
- [ ] **Pass/Fail:** ____

---

### TC-SHELL-016: Confirm Dialogs
**Assertion ID:** VAL-SHELL-016  
**URL:** Any destructive action

- [ ] 1. Click "Delete" on any deletable item
- [ ] 2. Verify a confirmation dialog appears with title, description, Cancel, and Confirm buttons
- [ ] 3. For danger actions, verify the Confirm button is red
- [ ] 4. Click Cancel — verify the dialog closes and no action occurs (check Network tab)
- [ ] 5. Re-trigger delete and click Confirm — verify the action executes
- [ ] **Pass/Fail:** ____

---

## Area: Admin Portal

### TC-ADMIN-001: Dashboard KPIs
**Assertion ID:** VAL-ADMIN-001  
**URL:** `/admin`

- [ ] 1. Navigate to `/admin`
- [ ] 2. Verify stat cards display: Total Users, Total Companies, Pending Approvals, Status
- [ ] 3. Verify each card shows a numeric/status value (not empty or "undefined")
- [ ] 4. Click "Pending Approvals" card — verify navigation to `/admin/approvals`
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-002: Dashboard Pipeline
**Assertion ID:** VAL-ADMIN-002  
**URL:** `/admin`

- [ ] 1. On the admin dashboard, locate the pipeline visualization
- [ ] 2. Verify stages are visible (e.g., New, In Progress, Completed)
- [ ] 3. Verify each stage shows a non-negative integer count
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-003: Dashboard HR Pulse
**Assertion ID:** VAL-ADMIN-003  
**URL:** `/admin`

- [ ] 1. On the admin dashboard, locate the "HR Pulse" card
- [ ] 2. Verify it shows headcount and related HR metrics
- [ ] 3. Refresh the page — verify values update
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-004: Users — List
**Assertion ID:** VAL-ADMIN-004  
**URL:** `/admin/users`

- [ ] 1. Navigate to `/admin/users`
- [ ] 2. Verify a paginated table of users is displayed
- [ ] 3. Verify columns: email, display name, role, status (active/suspended)
- [ ] 4. Use the search bar to filter by name or email — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-005: Users — Create
**Assertion ID:** VAL-ADMIN-005  
**URL:** `/admin/users`

- [ ] 1. Click "Add User"
- [ ] 2. Fill in: email, display name, role (dropdown), company (dropdown)
- [ ] 3. Submit
- [ ] 4. Verify a success toast appears
- [ ] 5. Verify the new user appears in the list without page reload
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-006: Users — Update
**Assertion ID:** VAL-ADMIN-006  
**URL:** `/admin/users`

- [ ] 1. Click "Edit" on a user row
- [ ] 2. Change any field and save
- [ ] 3. Verify the updated values are reflected in the table immediately
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-007: Users — Delete
**Assertion ID:** VAL-ADMIN-007  
**URL:** `/admin/users`

- [ ] 1. Click "Delete" on a user row
- [ ] 2. Verify a danger confirmation dialog appears
- [ ] 3. Confirm — verify the user is removed from the list
- [ ] 4. Verify a success toast
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-008: Users — Suspend / Unsuspend
**Assertion ID:** VAL-ADMIN-008  
**URL:** `/admin/users`

- [ ] 1. Click "Suspend" on an active user — verify status changes to "Suspended"
- [ ] 2. Click "Unsuspend" on the suspended user — verify status returns to "Active"
- [ ] 3. Verify Network tab shows the correct PATCH calls
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-009: Users — Force-Disable MFA
**Assertion ID:** VAL-ADMIN-009  
**URL:** `/admin/users`

- [ ] 1. On a user with MFA enabled, click "Disable MFA" (from a menu or action button)
- [ ] 2. Verify a confirmation dialog appears
- [ ] 3. Confirm — verify MFA is disabled for that user
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-010: Roles — List
**Assertion ID:** VAL-ADMIN-010  
**URL:** `/admin/roles`

- [ ] 1. Navigate to `/admin/roles`
- [ ] 2. Verify a table of roles is displayed (key, name, permissions count, system badge)
- [ ] 3. Click a role to view its permissions list
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-011: Roles — Create
**Assertion ID:** VAL-ADMIN-011  
**URL:** `/admin/roles`

- [ ] 1. Click "Create Role"
- [ ] 2. Fill in key, name, description, select permissions
- [ ] 3. Submit — verify the new role appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-012: Companies — List
**Assertion ID:** VAL-ADMIN-012  
**URL:** `/admin/companies`

- [ ] 1. Navigate to `/admin/companies`
- [ ] 2. Verify a table shows: code, name, email, GST number, active status
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-013: Companies — Create
**Assertion ID:** VAL-ADMIN-013  
**URL:** `/admin/companies`

- [ ] 1. Click "Add Company"
- [ ] 2. Fill in code, name, address, phone, email, GST number
- [ ] 3. Submit — verify the new company appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-014: Companies — Update
**Assertion ID:** VAL-ADMIN-014  
**URL:** `/admin/companies`

- [ ] 1. Click "Edit" on a company row
- [ ] 2. Change any field and save
- [ ] 3. Verify changes reflected in the table
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-015: Companies — Delete
**Assertion ID:** VAL-ADMIN-015  
**URL:** `/admin/companies`

- [ ] 1. Click "Delete" on a company — verify danger confirmation dialog
- [ ] 2. Confirm — verify the company is removed
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-016: Settings — View
**Assertion ID:** VAL-ADMIN-016  
**URL:** `/admin/settings`

- [ ] 1. Navigate to `/admin/settings`
- [ ] 2. Verify settings are displayed: companyName, timezone, dateFormat, currency, emailNotifications, autoApproveThreshold
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-017: Settings — Update
**Assertion ID:** VAL-ADMIN-017  
**URL:** `/admin/settings`

- [ ] 1. Change any setting value
- [ ] 2. Click "Save"
- [ ] 3. Verify a success toast
- [ ] 4. Refresh the page — verify changes persisted
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-018: Approvals — List
**Assertion ID:** VAL-ADMIN-018  
**URL:** `/admin/approvals`

- [ ] 1. Navigate to `/admin/approvals`
- [ ] 2. Verify pending approval items are listed with type, reference, summary, status, date
- [ ] 3. If no approvals exist, verify "No pending approvals" message
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-019: Approvals — Approve Credit Request
**Assertion ID:** VAL-ADMIN-019  
**URL:** `/admin/approvals`

- [ ] 1. On a Credit Request approval, click "Approve"
- [ ] 2. Verify confirmation dialog appears
- [ ] 3. Confirm — verify success toast "Approved successfully"
- [ ] 4. Verify the item is removed from the pending list
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-020: Approvals — Reject Credit Request
**Assertion ID:** VAL-ADMIN-020  
**URL:** `/admin/approvals`

- [ ] 1. On a Credit Request, click "Reject"
- [ ] 2. Verify danger confirmation dialog appears
- [ ] 3. Confirm — verify success toast "Rejected successfully"
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-021: Approvals — Payroll
**Assertion ID:** VAL-ADMIN-021  
**URL:** `/admin/approvals`

- [ ] 1. On a Payroll Run approval, click "Approve" — verify it calls the payroll approve endpoint
- [ ] 2. Verify "Reject" for payroll is either disabled or shows an error
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-022: Approvals — Credit Override
**Assertion ID:** VAL-ADMIN-022  
**URL:** `/admin/approvals`

- [ ] 1. On a Credit Override approval, click "Approve" — verify success
- [ ] 2. On another Credit Override, click "Reject" — verify success with reason
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-023: Export Approvals — List
**Assertion ID:** VAL-ADMIN-023  
**URL:** `/admin/export-approvals`

- [ ] 1. Navigate to `/admin/export-approvals`
- [ ] 2. Verify pending export requests are listed with requester, type, date, status
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-024: Export Approvals — Approve / Reject
**Assertion ID:** VAL-ADMIN-024  
**URL:** `/admin/export-approvals`

- [ ] 1. Approve a pending export — verify success
- [ ] 2. Reject a pending export — verify success with reason
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-025: Changelog — Create
**Assertion ID:** VAL-ADMIN-025  
**URL:** `/admin/changelog`

- [ ] 1. Navigate to `/admin/changelog`
- [ ] 2. Click "New Entry"
- [ ] 3. Fill in title, body, version tag, date
- [ ] 4. Submit — verify the entry appears in the changelog list
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-026: What's New Banner
**Assertion ID:** VAL-ADMIN-026  
**URL:** Non-admin portal after changelog publish

- [ ] 1. After publishing a changelog entry (TC-ADMIN-025), log in as a non-admin user
- [ ] 2. Verify a "What's New" banner or badge is visible
- [ ] 3. Click it — verify it links to changelog detail
- [ ] 4. Dismiss it — verify it does not reappear
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-027: Notifications — Send
**Assertion ID:** VAL-ADMIN-027  
**URL:** `/admin/notifications`

- [ ] 1. Navigate to `/admin/notifications`
- [ ] 2. Select a user and enter a message
- [ ] 3. Submit — verify success toast
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-028: Orchestrator — Admin Dashboard
**Assertion ID:** VAL-ADMIN-028  
**URL:** `/admin/orchestrator`

- [ ] 1. Navigate to `/admin/orchestrator`
- [ ] 2. Verify the Admin Dashboard tab renders with aggregate stats
- [ ] 3. Verify data loads within 3 seconds
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-029: Orchestrator — Factory Dashboard
**Assertion ID:** VAL-ADMIN-029  
**URL:** `/admin/orchestrator`

- [ ] 1. Switch to the Factory Dashboard tab
- [ ] 2. Verify production metrics are displayed (active jobs, throughput, etc.)
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-030: Orchestrator — Finance Dashboard
**Assertion ID:** VAL-ADMIN-030  
**URL:** `/admin/orchestrator`

- [ ] 1. Switch to the Finance Dashboard tab
- [ ] 2. Verify financial KPIs are displayed (revenue, COGS, receivables, payables)
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-031: Orchestrator — Dispatch
**Assertion ID:** VAL-ADMIN-031  
**URL:** `/admin/orchestrator`

- [ ] 1. Open a dispatch action against a sales order
- [ ] 2. Verify the DispatchModal pre-populates order line items
- [ ] 3. Submit — verify status updates
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-032: Orchestrator — Order Approval
**Assertion ID:** VAL-ADMIN-032  
**URL:** `/admin/orchestrator`

- [ ] 1. Verify orders requiring approval appear in a queue
- [ ] 2. Approve an order — verify status changes to Fulfillment
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-033: Portal Insights — Dashboard
**Assertion ID:** VAL-ADMIN-033  
**URL:** `/admin/portal-insights`

- [ ] 1. Navigate to `/admin/portal-insights`
- [ ] 2. Verify usage metrics are displayed (sessions, page views, error rates)
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-034: Portal Insights — Operations
**Assertion ID:** VAL-ADMIN-034  
**URL:** `/admin/portal-insights`

- [ ] 1. Switch to the Operations tab
- [ ] 2. Verify API latency and operational metrics are displayed
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-035: Portal Insights — Workforce
**Assertion ID:** VAL-ADMIN-035  
**URL:** `/admin/portal-insights`

- [ ] 1. Switch to the Workforce tab
- [ ] 2. Verify employee engagement data is displayed (attendance rate, headcount, etc.)
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-036: Audit Trail — Business Events
**Assertion ID:** VAL-ADMIN-036  
**URL:** `/admin/audit-trail`

- [ ] 1. Navigate to `/admin/audit-trail`
- [ ] 2. Verify a paginated list of events is displayed (timestamp, actor, action, resource, details)
- [ ] 3. Use filters (date range, action type) — verify results narrow
- [ ] 4. Sort by a column — verify order changes
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-037: Audit Trail — ML Events
**Assertion ID:** VAL-ADMIN-037  
**URL:** `/admin/audit-trail`

- [ ] 1. Switch to ML Events tab/filter
- [ ] 2. Verify ML-related events are displayed with model name, input summary, confidence
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-038: Tenant Runtime
**Assertion ID:** VAL-ADMIN-038  
**URL:** `/admin/tenant-runtime`

- [ ] 1. Navigate to `/admin/tenant-runtime`
- [ ] 2. Verify resource metrics are displayed (API calls, storage, sessions, rate limits)
- [ ] 3. Verify Policy section is visible with session timeout, password complexity, etc.
- [ ] **Pass/Fail:** ____

---

### TC-ADMIN-039: Operations Control
**Assertion ID:** VAL-ADMIN-039  
**URL:** `/admin/operations-control`

- [ ] 1. Navigate to `/admin/operations-control`
- [ ] 2. Verify feature flags, maintenance mode, cache purge controls are visible
- [ ] 3. Toggle a control — verify confirmation dialog appears
- [ ] 4. Confirm — verify the control state updates
- [ ] **Pass/Fail:** ____

---

## Area: Superadmin Portal

### TC-SUPER-001: Dashboard
**Assertion ID:** VAL-SUPER-001  
**URL:** `/superadmin`

- [ ] 1. Navigate to `/superadmin`
- [ ] 2. Verify metrics: total tenants, active tenants, suspended tenants, total users, storage
- [ ] 3. Verify all values load within 3 seconds
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-002: Tenant List
**Assertion ID:** VAL-SUPER-002  
**URL:** `/superadmin/tenants`

- [ ] 1. Navigate to `/superadmin/tenants`
- [ ] 2. Verify tenant table shows: name, company code, status, admin email, created date
- [ ] 3. Search by name or code — verify filtering works
- [ ] 4. Filter by status — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-003: Onboard Tenant
**Assertion ID:** VAL-SUPER-003  
**URL:** `/superadmin/tenants`

- [ ] 1. Click "Onboard Tenant"
- [ ] 2. Fill in company details (name, code, address, GST)
- [ ] 3. Fill in admin user details (email, display name, temp password)
- [ ] 4. Submit
- [ ] 5. Verify success toast with tenant ID and credentials summary
- [ ] 6. Verify the new tenant appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-004: Update Tenant
**Assertion ID:** VAL-SUPER-004  
**URL:** `/superadmin/tenants`

- [ ] 1. Click "Edit" on a tenant
- [ ] 2. Change name or address
- [ ] 3. Save — verify changes reflected in the list
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-005: Activate Tenant
**Assertion ID:** VAL-SUPER-005  
**URL:** `/superadmin/tenants`

- [ ] 1. On a deactivated tenant, click "Activate"
- [ ] 2. Verify confirmation dialog
- [ ] 3. Confirm — verify status changes to "Active"
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-006: Suspend Tenant
**Assertion ID:** VAL-SUPER-006  
**URL:** `/superadmin/tenants`

- [ ] 1. On an active tenant, click "Suspend"
- [ ] 2. Verify warning about user access loss
- [ ] 3. Confirm — verify status changes to "Suspended"
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-007: Deactivate Tenant
**Assertion ID:** VAL-SUPER-007  
**URL:** `/superadmin/tenants`

- [ ] 1. On a suspended tenant, click "Deactivate"
- [ ] 2. Verify danger confirmation dialog with destructive warning
- [ ] 3. Confirm — verify status changes to "Deactivated"
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-008: Admin Password Reset
**Assertion ID:** VAL-SUPER-008  
**URL:** `/superadmin/tenants`

- [ ] 1. Select a tenant, then its admin user
- [ ] 2. Click "Reset Password"
- [ ] 3. Optionally set a temporary password
- [ ] 4. Submit — verify success toast
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-009: Support Warnings
**Assertion ID:** VAL-SUPER-009  
**URL:** `/superadmin/tenants`

- [ ] 1. Click "Send Warning" on a tenant
- [ ] 2. Select severity (info/warning/critical) and enter message
- [ ] 3. Submit — verify success
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-010: Platform Roles
**Assertion ID:** VAL-SUPER-010  
**URL:** `/superadmin/roles`

- [ ] 1. Navigate to `/superadmin/roles`
- [ ] 2. Verify platform-level roles are listed with permissions
- [ ] 3. Create a new platform role — verify it appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-011: Audit Trail
**Assertion ID:** VAL-SUPER-011  
**URL:** `/superadmin/audit`

- [ ] 1. Navigate to `/superadmin/audit`
- [ ] 2. Verify platform events are listed (tenant onboarding, lifecycle changes, resets)
- [ ] 3. Filter by date, action type, actor — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-012: Support Tickets — List
**Assertion ID:** VAL-SUPER-012  
**URL:** `/superadmin/tickets`

- [ ] 1. Navigate to `/superadmin/tickets`
- [ ] 2. Verify all tickets listed: ID, tenant, subject, priority, status, date
- [ ] 3. Search and filter — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-013: Support Tickets — Detail
**Assertion ID:** VAL-SUPER-013  
**URL:** `/superadmin/tickets/:id`

- [ ] 1. Click a ticket row
- [ ] 2. Verify detail view: conversation thread, attachments, notes, status history
- [ ] 3. Add a response — verify it appears in the thread
- [ ] 4. Change priority or status — verify updates
- [ ] **Pass/Fail:** ____

---

### TC-SUPER-014 to TC-SUPER-018: Isolation Tests
**Assertion IDs:** VAL-SUPER-014 through VAL-SUPER-018  
**URL:** Various portal routes while logged in as superadmin

- [ ] 1. While logged in as superadmin, try each portal route:
  - `/admin` — verify blocked/redirected (VAL-SUPER-014)
  - `/accounting` — verify blocked/redirected (VAL-SUPER-015)
  - `/sales` — verify blocked/redirected (VAL-SUPER-016)
  - `/factory` — verify blocked/redirected (VAL-SUPER-017)
  - `/dealer` — verify blocked/redirected (VAL-SUPER-018)
- [ ] 2. For each, verify you are redirected to superadmin dashboard or see "Access Denied"
- [ ] **Pass/Fail per route:**
  - /admin: ____
  - /accounting: ____
  - /sales: ____
  - /factory: ____
  - /dealer: ____

---

## Area: Accounting Portal

### TC-ACCT-001: Dashboard KPIs
**Assertion ID:** VAL-ACCT-001  
**URL:** `/accounting`

- [ ] 1. Navigate to `/accounting`
- [ ] 2. Verify KPI cards: Revenue, Expenses, Net Profit, Outstanding Receivables
- [ ] 3. Verify all values are non-zero and numeric
- [ ] 4. Verify page loads within 3 seconds
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-002: Recent Journals Widget
**Assertion ID:** VAL-ACCT-002  
**URL:** `/accounting`

- [ ] 1. On the dashboard, locate the "Recent Journal Entries" widget
- [ ] 2. Verify it shows the latest 5 journals
- [ ] 3. Click any journal row — verify navigation to `/accounting/journals/:id`
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-003: Tab Groups
**Assertion ID:** VAL-ACCT-003  
**URL:** `/accounting` (sidebar)

- [ ] 1. Expand the sidebar
- [ ] 2. Verify nav items are grouped logically (Transactions, Partners, Inventory, HR & Payroll, Reports, Settings)
- [ ] 3. Verify no orphan or misplaced links
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-004: Search
**Assertion ID:** VAL-ACCT-004  
**URL:** `/accounting`

- [ ] 1. Type a keyword in the search bar (e.g., an account name)
- [ ] 2. Verify results appear within 1 second
- [ ] 3. Verify results include matches from journals, accounts, partners, inventory
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-005: Command Palette (Accounting)
**Assertion ID:** VAL-ACCT-005  
**URL:** `/accounting`

- [ ] 1. Press `Cmd+K` / `Ctrl+K`
- [ ] 2. Type an accounting action (e.g., "journals")
- [ ] 3. Select a result — verify navigation to the correct accounting page
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-006: Chart of Accounts — Tree View
**Assertion ID:** VAL-ACCT-006  
**URL:** `/accounting/chart-of-accounts`

- [ ] 1. Navigate to `/accounting/chart-of-accounts`
- [ ] 2. Verify a hierarchical tree with parent accounts (Assets, Liabilities, Equity, Revenue, Expenses)
- [ ] 3. Expand parents — verify children are indented correctly
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-007: Chart of Accounts — Create
**Assertion ID:** VAL-ACCT-007  
**URL:** `/accounting/chart-of-accounts`

- [ ] 1. Click "New Account"
- [ ] 2. Fill in code, name, type, parent
- [ ] 3. Submit — verify the account appears in the tree without reload
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-008: Account Activity
**Assertion ID:** VAL-ACCT-008  
**URL:** `/accounting/chart-of-accounts` (account detail)

- [ ] 1. Select an account and view its activity tab
- [ ] 2. Verify a paginated ledger: date, reference, debit, credit, running balance
- [ ] 3. Verify running balance arithmetic is correct
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-009: Balance As-Of
**Assertion ID:** VAL-ACCT-009  
**URL:** `/accounting/chart-of-accounts` (account detail)

- [ ] 1. Select an account
- [ ] 2. Enter a past date in the "Balance as of" picker
- [ ] 3. Verify the balance recalculates and differs from current balance
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-010: Journals — List & Search
**Assertion ID:** VAL-ACCT-010  
**URL:** `/accounting/journals`

- [ ] 1. Navigate to `/accounting/journals`
- [ ] 2. Verify columns: Date, Number, Reference, Status, Total
- [ ] 3. Search/filter by keyword or date range — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-011: Journals — Create Balanced
**Assertion ID:** VAL-ACCT-011  
**URL:** `/accounting/journals/new`

- [ ] 1. Click "New Journal Entry"
- [ ] 2. Add lines with balanced debits and credits — submit — verify success
- [ ] 3. Add lines with imbalanced debits/credits — verify validation error and blocked save
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-012: Journals — Reverse
**Assertion ID:** VAL-ACCT-012  
**URL:** `/accounting/journals/:id`

- [ ] 1. Open a posted journal
- [ ] 2. Click "Reverse"
- [ ] 3. Verify a new journal is created with swapped debit/credit amounts
- [ ] 4. Verify both journals show the reversal relationship
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-013: Journals — Cascade Reverse
**Assertion ID:** VAL-ACCT-013  
**URL:** `/accounting/journals/:id`

- [ ] 1. Open a journal with downstream entries
- [ ] 2. Click "Cascade Reverse"
- [ ] 3. Verify all related child journals are reversed
- [ ] 4. Verify affected account balances revert
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-014: Journal Detail
**Assertion ID:** VAL-ACCT-014  
**URL:** `/accounting/journals/:id`

- [ ] 1. Click a journal entry row
- [ ] 2. Verify detail view: header (date, number, status, memo) and line-item table
- [ ] 3. Verify debit total equals credit total in the footer
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-015: Recent Journals Navigate
**Assertion ID:** VAL-ACCT-015  
**URL:** `/accounting` → `/accounting/journals/:id`

- [ ] 1. On dashboard, click a journal in the Recent Journals widget
- [ ] 2. Verify navigation to the correct journal detail page (matching journal ID)
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-016: Periods — List
**Assertion ID:** VAL-ACCT-016  
**URL:** `/accounting/periods`

- [ ] 1. Navigate to `/accounting/periods`
- [ ] 2. Verify all periods listed with Name, Start Date, End Date, Status (Open/Closed/Locked)
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-017: Periods — Close and Lock
**Assertion ID:** VAL-ACCT-017  
**URL:** `/accounting/periods`

- [ ] 1. Close an open period — verify status changes to "Closed"
- [ ] 2. Verify that new journal entries in the closed period's date range are blocked
- [ ] 3. Lock the closed period — verify status changes to "Locked" and all UI actions are disabled
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-018: Periods — Reopen
**Assertion ID:** VAL-ACCT-018  
**URL:** `/accounting/periods`

- [ ] 1. Reopen a closed (not locked) period — verify status changes to "Open"
- [ ] 2. Verify journal entry creation within that period is allowed again
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-019 to TC-ACCT-023: Settlements
**Assertion IDs:** VAL-ACCT-019 through VAL-ACCT-023  
**URL:** `/accounting/settlements`

- [ ] **TC-ACCT-019 — Dealer Receipt:** Create a dealer receipt → verify payment recorded, receivable decreased
- [ ] **TC-ACCT-020 — Hybrid Receipt:** Create hybrid receipt splitting cash/bank → verify GL splits
- [ ] **TC-ACCT-021 — Supplier Payment:** Create supplier payment → verify payable decreased
- [ ] **TC-ACCT-022 — Dealer Settlement:** Run dealer settlement → verify aggregated settlement doc + journal
- [ ] **TC-ACCT-023 — Supplier Settlement:** Run supplier settlement → verify aggregated settlement + journal
- [ ] **Pass/Fail per settlement type:** ____

---

### TC-ACCT-024: Invoices — List
**Assertion ID:** VAL-ACCT-024  
**URL:** `/accounting/invoices`

- [ ] 1. Navigate to `/accounting/invoices`
- [ ] 2. Verify table: Number, Date, Dealer, Amount, Status, Due Date
- [ ] 3. Apply status filter — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-025: Invoice — PDF Download
**Assertion ID:** VAL-ACCT-025  
**URL:** `/accounting/invoices/:id`

- [ ] 1. Click "Download PDF" on an invoice
- [ ] 2. Verify a PDF downloads
- [ ] 3. Open the PDF — verify it contains header, line items, totals, tax breakdown
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-026: Invoice — Email
**Assertion ID:** VAL-ACCT-026  
**URL:** `/accounting/invoices/:id`

- [ ] 1. Click "Email" on an invoice
- [ ] 2. Verify a send dialog opens pre-filled with dealer email
- [ ] 3. Confirm — verify success toast
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-027: Trial Balance
**Assertion ID:** VAL-ACCT-027  
**URL:** `/accounting/reports/trial-balance`

- [ ] 1. Navigate to `/accounting/reports/trial-balance`
- [ ] 2. Select a period
- [ ] 3. Verify all accounts with non-zero balances are listed
- [ ] 4. Verify total debits = total credits
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-028: Profit & Loss
**Assertion ID:** VAL-ACCT-028  
**URL:** `/accounting/reports/pl`

- [ ] 1. Navigate to `/accounting/reports/pl`
- [ ] 2. Verify revenue and expenses in hierarchical tree with subtotals
- [ ] 3. Verify Net Profit/Loss at bottom is correct
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-029: Balance Sheet
**Assertion ID:** VAL-ACCT-029  
**URL:** `/accounting/reports/balance-sheet`

- [ ] 1. Navigate to `/accounting/reports/balance-sheet`
- [ ] 2. Verify Assets, Liabilities, Equity in hierarchy
- [ ] 3. Verify Assets = Liabilities + Equity
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-030: Cash Flow
**Assertion ID:** VAL-ACCT-030  
**URL:** `/accounting/reports/cash-flow`

- [ ] 1. Navigate to `/accounting/reports/cash-flow`
- [ ] 2. Verify Operating, Investing, Financing sections
- [ ] 3. Verify Opening + Net Change = Closing
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-031: Aged Debtors
**Assertion ID:** VAL-ACCT-031  
**URL:** `/accounting/reports/aged-debtors`

- [ ] 1. Navigate to `/accounting/reports/aged-debtors`
- [ ] 2. Verify dealers listed with aging buckets (Current, 30, 60, 90, 120+)
- [ ] 3. Verify row totals match dealer outstanding amounts
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-032: GST Return
**Assertion ID:** VAL-ACCT-032  
**URL:** `/accounting/reports/gst`

- [ ] 1. Navigate to `/accounting/reports/gst`
- [ ] 2. Verify output tax, input tax, net GST payable/refundable
- [ ] 3. Cross-check with GST GL account balances
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-033: Inventory Valuation
**Assertion ID:** VAL-ACCT-033  
**URL:** `/accounting/reports/inventory`

- [ ] 1. Navigate to `/accounting/reports/inventory`
- [ ] 2. Verify products listed with qty, unit cost, total value
- [ ] 3. Verify grand total matches Inventory GL account balance
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-034: Report Export (PDF & CSV)
**Assertion ID:** VAL-ACCT-034  
**URL:** Any report page

- [ ] 1. On any report page, click "Export PDF" — verify a PDF downloads with correct formatting
- [ ] 2. Click "Export CSV" — verify a CSV downloads with correct headers and all rows
- [ ] 3. Open the CSV — verify row count matches the report
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-035: Suppliers — CRUD
**Assertion ID:** VAL-ACCT-035  
**URL:** `/accounting/suppliers`

- [ ] 1. Navigate to `/accounting/suppliers`
- [ ] 2. Create a supplier — verify it appears in the list
- [ ] 3. Edit the supplier — verify changes persist
- [ ] 4. Archive the supplier — verify it's marked archived
- [ ] 5. Try creating without required fields — verify validation errors
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-036 to TC-ACCT-039: Partner Statements & Aging PDFs
**Assertion IDs:** VAL-ACCT-036 through VAL-ACCT-039  
**URL:** `/accounting/dealers` and `/accounting/suppliers`

- [ ] **TC-ACCT-036 — Dealer Statement PDF:** Generate for date range → verify opening + transactions = closing
- [ ] **TC-ACCT-037 — Supplier Statement PDF:** Generate → verify running balance
- [ ] **TC-ACCT-038 — Dealer Aging PDF:** Download → verify buckets match Aged Debtors report
- [ ] **TC-ACCT-039 — Supplier Aging PDF:** Download → verify buckets match ledger
- [ ] **Pass/Fail per type:** ____

---

### TC-ACCT-040: Purchase Orders
**Assertion ID:** VAL-ACCT-040  
**URL:** `/accounting/purchasing/purchase-orders`

- [ ] 1. Navigate to `/accounting/purchasing/purchase-orders`
- [ ] 2. Verify PO list with status
- [ ] 3. Create new PO with line items — verify saved as Draft
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-041: Goods Receipt Notes
**Assertion ID:** VAL-ACCT-041  
**URL:** `/accounting/purchasing/goods-receipts`

- [ ] 1. Create a GRN against a PO
- [ ] 2. Verify received quantities update inventory
- [ ] 3. Verify partial receipt updates PO status
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-042: Raw Material Purchases
**Assertion ID:** VAL-ACCT-042  
**URL:** `/accounting/purchasing/raw-material-purchases`

- [ ] 1. Record a raw material purchase
- [ ] 2. Verify purchase invoice created
- [ ] 3. Verify inventory updated
- [ ] 4. Verify journal posted (debit Raw Materials, credit AP)
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-043: Purchase Returns
**Assertion ID:** VAL-ACCT-043  
**URL:** `/accounting/purchasing/returns`

- [ ] 1. Create a purchase return against a received GRN
- [ ] 2. Verify inventory reduced
- [ ] 3. Verify debit note generated
- [ ] 4. Verify reversal journal posted
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-044: Catalog Products — CRUD
**Assertion ID:** VAL-ACCT-044  
**URL:** `/accounting/catalog`

- [ ] 1. Navigate to `/accounting/catalog`
- [ ] 2. Create a product with SKU — verify it appears
- [ ] 3. Search for the product — verify found
- [ ] 4. Update the product — verify changes persist
- [ ] 5. Try creating a duplicate SKU — verify error
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-045: Bulk Variants
**Assertion ID:** VAL-ACCT-045  
**URL:** `/accounting/catalog`

- [ ] 1. Create a product with bulk variant generation enabled
- [ ] 2. Verify all variant combinations are created as child SKUs
- [ ] 3. Verify prices are editable per variant
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-046: Raw Materials — CRUD
**Assertion ID:** VAL-ACCT-046  
**URL:** `/accounting/raw-materials`

- [ ] 1. Navigate to `/accounting/raw-materials`
- [ ] 2. Create a raw material — verify it appears
- [ ] 3. Update it — verify changes persist
- [ ] 4. Verify the material appears in PO line item dropdowns
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-047: Batches and Intake
**Assertion ID:** VAL-ACCT-047  
**URL:** `/accounting/raw-materials` (detail)

- [ ] 1. Record a batch intake (batch number, quantity, expiry)
- [ ] 2. Verify on-hand quantity increases
- [ ] 3. Verify the batch appears in the batch list
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-048: Inventory Adjustments
**Assertion ID:** VAL-ACCT-048  
**URL:** `/accounting/adjustments`

- [ ] 1. Navigate to `/accounting/adjustments`
- [ ] 2. Create an adjustment with reason memo
- [ ] 3. Verify on-hand quantity changes
- [ ] 4. Verify a journal is posted to the Adjustment GL account
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-049: Opening Stock
**Assertion ID:** VAL-ACCT-049  
**URL:** `/accounting/opening-stock`

- [ ] 1. Navigate to `/accounting/opening-stock`
- [ ] 2. Set opening balances
- [ ] 3. Verify journal posted (debit Inventory, credit Opening Balance Equity)
- [ ] 4. Verify reflected in Inventory Valuation report
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-050: Employees — CRUD
**Assertion ID:** VAL-ACCT-050  
**URL:** `/accounting/employees`

- [ ] 1. Navigate to `/accounting/employees`
- [ ] 2. Create an employee — verify appears in list
- [ ] 3. Search for the employee — verify found
- [ ] 4. Update — verify changes persist
- [ ] 5. Try duplicate employee ID — verify error
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-051: Attendance — Mark Single
**Assertion ID:** VAL-ACCT-051  
**URL:** `/accounting/attendance`

- [ ] 1. Navigate to `/accounting/attendance`
- [ ] 2. Mark a single employee as Present/Absent/Half-Day/Leave
- [ ] 3. Verify the status reflects in the calendar view
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-052: Attendance — Bulk Mark
**Assertion ID:** VAL-ACCT-052  
**URL:** `/accounting/attendance`

- [ ] 1. Use bulk attendance marking for multiple employees
- [ ] 2. Verify all selected employees updated
- [ ] 3. Verify summary reflects changes
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-053: Leave Requests
**Assertion ID:** VAL-ACCT-053  
**URL:** `/accounting/leave`

- [ ] 1. Navigate to `/accounting/leave`
- [ ] 2. Submit a leave request
- [ ] 3. Approve the request
- [ ] 4. Verify the approved leave auto-reflects in attendance calendar
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-054: Attendance Summary
**Assertion ID:** VAL-ACCT-054  
**URL:** `/accounting/attendance`

- [ ] 1. View monthly attendance summary
- [ ] 2. Verify per-employee: Present + Absent + Half-Day + Leave = working days
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-055: Payroll — Create Run
**Assertion ID:** VAL-ACCT-055  
**URL:** `/accounting/payroll`

- [ ] 1. Navigate to `/accounting/payroll`
- [ ] 2. Create a payroll run for a selected period
- [ ] 3. Verify Draft status with listed employees and salary structures
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-056: Payroll — Calculate
**Assertion ID:** VAL-ACCT-056  
**URL:** `/accounting/payroll`

- [ ] 1. On a Draft payroll run, click "Calculate"
- [ ] 2. Verify gross, deductions, net computed per employee
- [ ] 3. Spot-check arithmetic for at least one employee
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-057: Payroll — Approve
**Assertion ID:** VAL-ACCT-057  
**URL:** `/accounting/payroll`

- [ ] 1. Click "Approve" on a calculated payroll
- [ ] 2. Verify status changes to "Approved"
- [ ] 3. Verify edit controls are disabled
- [ ] 4. Verify "Post" and "Mark Paid" buttons are enabled
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-058: Payroll — Post
**Assertion ID:** VAL-ACCT-058  
**URL:** `/accounting/payroll`

- [ ] 1. Click "Post" on an approved payroll
- [ ] 2. Verify salary journal entries are generated (debit Expense, credit Payable/Bank)
- [ ] 3. Verify status changes to "Posted"
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-059: Payroll — Mark Paid
**Assertion ID:** VAL-ACCT-059  
**URL:** `/accounting/payroll`

- [ ] 1. Click "Mark Paid"
- [ ] 2. Verify payment date/method recorded
- [ ] 3. Verify status changes to "Paid"
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-060: Payroll Summary
**Assertion ID:** VAL-ACCT-060  
**URL:** `/accounting/payroll`

- [ ] 1. View payroll summary
- [ ] 2. Verify total gross, deductions, net, department breakdowns
- [ ] 3. Cross-reference with individual calculations
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-061: Month-End Checklist
**Assertion ID:** VAL-ACCT-061  
**URL:** `/accounting/month-end`

- [ ] 1. Navigate to `/accounting/month-end`
- [ ] 2. Verify checklist of required tasks with checkboxes
- [ ] 3. Verify "Close" button is disabled when items are unchecked
- [ ] 4. Check all items — verify "Close" button becomes enabled
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-062: Audit Digest
**Assertion ID:** VAL-ACCT-062  
**URL:** `/accounting/audit-digest`

- [ ] 1. Navigate to `/accounting/audit-digest`
- [ ] 2. Verify transaction summary is displayed
- [ ] 3. Click "Export CSV" — verify download with correct columns
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-063: Config Health Check
**Assertion ID:** VAL-ACCT-063  
**URL:** `/accounting/config-health`

- [ ] 1. Navigate to `/accounting/config-health`
- [ ] 2. Verify diagnostics run (default accounts, tax codes, periods)
- [ ] 3. Verify pass/fail indicators for each check
- [ ] 4. Click a "fix" link — verify navigation to the relevant config page
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-064: Credit/Debit Notes
**Assertion ID:** VAL-ACCT-064  
**URL:** `/accounting/settlements` or invoices

- [ ] 1. Create a credit or debit note linked to an invoice
- [ ] 2. Verify the note adjusts the partner balance
- [ ] 3. Verify a corresponding journal entry is posted
- [ ] **Pass/Fail:** ____

---

### TC-ACCT-065: Default Accounts
**Assertion ID:** VAL-ACCT-065  
**URL:** `/accounting/default-accounts`

- [ ] 1. Navigate to `/accounting/default-accounts`
- [ ] 2. Set GL accounts for AR, AP, Revenue, COGS, Inventory, Tax
- [ ] 3. Save — verify selections persist
- [ ] 4. Perform an action that auto-generates a journal — verify it uses the configured accounts
- [ ] **Pass/Fail:** ____

---

## Area: Sales Portal

### TC-SALES-001: Dashboard
**Assertion ID:** VAL-SALES-001  
**URL:** `/sales`

- [ ] 1. Navigate to `/sales`
- [ ] 2. Verify metric cards: total orders, revenue, outstanding receivables, active dealers, pending dispatches
- [ ] 3. Verify all values are non-null and formatted correctly
- [ ] **Pass/Fail:** ____

---

### TC-SALES-002: Orders — List & Filter
**Assertion ID:** VAL-SALES-002  
**URL:** `/sales/orders`

- [ ] 1. Navigate to `/sales/orders`
- [ ] 2. Verify paginated order table
- [ ] 3. Apply date-range filter — verify results narrow
- [ ] 4. Apply status filter — verify results narrow
- [ ] 5. Search by order number or dealer name — verify results match
- [ ] **Pass/Fail:** ____

---

### TC-SALES-003: Orders — Create (Select Dealer)
**Assertion ID:** VAL-SALES-003  
**URL:** `/sales/orders`

- [ ] 1. Click "Create Order"
- [ ] 2. Search and select a dealer from the dropdown
- [ ] 3. Verify dealer details auto-populate (name, address, credit limit)
- [ ] 4. Verify only active, non-dunning-held dealers appear
- [ ] **Pass/Fail:** ____

---

### TC-SALES-004: Orders — Add Line Items
**Assertion ID:** VAL-SALES-004  
**URL:** `/sales/orders`

- [ ] 1. On the order creation form, add a product line item (product, quantity, price)
- [ ] 2. Verify line total = qty x price
- [ ] 3. Add multiple line items — verify summary updates
- [ ] 4. Remove a line item — verify summary updates
- [ ] **Pass/Fail:** ____

---

### TC-SALES-005: Orders — GST
**Assertion ID:** VAL-SALES-005  
**URL:** `/sales/orders`

- [ ] 1. Create an order with line items
- [ ] 2. Verify GST is auto-calculated per line item
- [ ] 3. Verify breakdown shows either CGST+SGST or IGST (based on dealer state)
- [ ] 4. Verify grand total = subtotal + GST, amounts correct to 2 decimal places
- [ ] **Pass/Fail:** ____

---

### TC-SALES-006: Orders — Update Draft
**Assertion ID:** VAL-SALES-006  
**URL:** `/sales/orders/:id`

- [ ] 1. Open a Draft order
- [ ] 2. Modify dealer/line items/quantities/prices
- [ ] 3. Save — verify changes persist on reload
- [ ] 4. Verify non-Draft orders do NOT show edit option
- [ ] **Pass/Fail:** ____

---

### TC-SALES-007: Orders — Delete Draft
**Assertion ID:** VAL-SALES-007  
**URL:** `/sales/orders`

- [ ] 1. Click "Delete" on a Draft order
- [ ] 2. Verify confirmation dialog
- [ ] 3. Confirm — verify order removed from list
- [ ] 4. Verify non-Draft orders do NOT show delete option
- [ ] **Pass/Fail:** ____

---

### TC-SALES-008: Orders — Confirm
**Assertion ID:** VAL-SALES-008  
**URL:** `/sales/orders/:id`

- [ ] 1. On a Draft order, click "Confirm"
- [ ] 2. Verify status changes to Confirmed
- [ ] 3. Verify edit/delete controls are no longer available
- [ ] **Pass/Fail:** ____

---

### TC-SALES-009: Orders — Cancel
**Assertion ID:** VAL-SALES-009  
**URL:** `/sales/orders/:id`

- [ ] 1. On an order that has NOT been dispatched, click "Cancel"
- [ ] 2. Verify reason/confirmation dialog
- [ ] 3. Confirm — verify status changes to Cancelled
- [ ] **Pass/Fail:** ____

---

### TC-SALES-010: Order Lifecycle Stepper
**Assertion ID:** VAL-SALES-010  
**URL:** `/sales/orders/:id`

- [ ] 1. Open an order detail page
- [ ] 2. Verify lifecycle stages visible: Draft → Confirmed → Dispatched → Invoiced → Settled → Closed
- [ ] 3. Verify the current stage is highlighted
- [ ] **Pass/Fail:** ____

---

### TC-SALES-011: Dealers — List
**Assertion ID:** VAL-SALES-011  
**URL:** `/sales/dealers`

- [ ] 1. Navigate to `/sales/dealers`
- [ ] 2. Verify table: name, code, region, credit limit, outstanding balance, status
- [ ] **Pass/Fail:** ____

---

### TC-SALES-012: Dealers — Create
**Assertion ID:** VAL-SALES-012  
**URL:** `/sales/dealers`

- [ ] 1. Click "Add Dealer"
- [ ] 2. Fill in required fields (name, contact, address, GST, credit limit, region)
- [ ] 3. Submit — verify dealer appears in list
- [ ] 4. Submit with missing required fields — verify validation errors
- [ ] **Pass/Fail:** ____

---

### TC-SALES-013: Dealers — Search
**Assertion ID:** VAL-SALES-013  
**URL:** `/sales/dealers`

- [ ] 1. Type in the search field — verify list filters by name or code
- [ ] 2. Clear search — verify full list restores
- [ ] **Pass/Fail:** ____

---

### TC-SALES-014: Dealers — Update
**Assertion ID:** VAL-SALES-014  
**URL:** `/sales/dealers`

- [ ] 1. Click "Edit" on a dealer
- [ ] 2. Change details — save
- [ ] 3. Verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-SALES-015: Dealers — Aging Report
**Assertion ID:** VAL-SALES-015  
**URL:** `/sales/dealers` (dealer detail)

- [ ] 1. Select a dealer → navigate to Aging tab
- [ ] 2. Verify aging buckets: Current, 30, 60, 90, 120+
- [ ] 3. Verify bucket totals sum to outstanding balance
- [ ] **Pass/Fail:** ____

---

### TC-SALES-016: Dealers — Dunning Hold
**Assertion ID:** VAL-SALES-016  
**URL:** `/sales/dealers`

- [ ] 1. Place a dealer on dunning hold
- [ ] 2. Verify status shows "Dunning Hold"
- [ ] 3. Try to create a new order with this dealer — verify it fails
- [ ] 4. Release the hold — verify order creation works again
- [ ] **Pass/Fail:** ____

---

### TC-SALES-017: Dealers — Ledger
**Assertion ID:** VAL-SALES-017  
**URL:** `/sales/dealers` (dealer detail)

- [ ] 1. Navigate to dealer's Ledger tab
- [ ] 2. Verify chronological transactions with running balance
- [ ] 3. Verify final balance matches outstanding balance on the list page
- [ ] **Pass/Fail:** ____

---

### TC-SALES-018: Dealers — Invoices
**Assertion ID:** VAL-SALES-018  
**URL:** `/sales/dealers` (dealer detail)

- [ ] 1. Navigate to dealer's Invoices tab
- [ ] 2. Verify all invoices listed: number, date, amount, status, balance due
- [ ] 3. Click an invoice — verify navigation to detail
- [ ] **Pass/Fail:** ____

---

### TC-SALES-019: Credit Requests — List
**Assertion ID:** VAL-SALES-019  
**URL:** `/sales/credit-requests`

- [ ] 1. Navigate to `/sales/credit-requests`
- [ ] 2. Verify list: request ID, dealer, amount, status, date
- [ ] **Pass/Fail:** ____

---

### TC-SALES-020: Credit Requests — Create
**Assertion ID:** VAL-SALES-020  
**URL:** `/sales/credit-requests`

- [ ] 1. Click "New Request"
- [ ] 2. Select dealer, enter amount, provide justification
- [ ] 3. Submit — verify created in Pending status
- [ ] 4. Submit with empty fields — verify validation errors
- [ ] **Pass/Fail:** ____

---

### TC-SALES-021: Credit Requests — Approve/Reject
**Assertion ID:** VAL-SALES-021  
**URL:** `/sales/credit-requests`

- [ ] 1. Approve a pending request — verify status changes to Approved + dealer credit limit updated
- [ ] 2. Reject another request with reason — verify status changes to Rejected
- [ ] **Pass/Fail:** ____

---

### TC-SALES-022: Credit Override Requests — List
**Assertion ID:** VAL-SALES-022  
**URL:** `/sales/credit-overrides`

- [ ] 1. Navigate to `/sales/credit-overrides`
- [ ] 2. Verify list: ID, dealer, original limit, requested limit, status, date
- [ ] **Pass/Fail:** ____

---

### TC-SALES-023: Credit Override — Create
**Assertion ID:** VAL-SALES-023  
**URL:** `/sales/credit-overrides`

- [ ] 1. Create a credit override request (dealer, new limit, justification)
- [ ] 2. Verify created in Pending status
- [ ] **Pass/Fail:** ____

---

### TC-SALES-024: Credit Override — Approve/Reject
**Assertion ID:** VAL-SALES-024  
**URL:** `/sales/credit-overrides`

- [ ] 1. Approve — verify dealer credit limit updated to override value
- [ ] 2. Reject — verify reason recorded, limit unchanged
- [ ] **Pass/Fail:** ____

---

### TC-SALES-025: Promotions — List
**Assertion ID:** VAL-SALES-025  
**URL:** `/sales/promotions`

- [ ] 1. Navigate to `/sales/promotions`
- [ ] 2. Verify list: name, discount type, value, dates, status
- [ ] 3. Verify active vs. expired are distinguishable
- [ ] **Pass/Fail:** ____

---

### TC-SALES-026: Promotions — Create
**Assertion ID:** VAL-SALES-026  
**URL:** `/sales/promotions`

- [ ] 1. Create a promotion (name, type, value, start/end date)
- [ ] 2. Verify it appears in the list
- [ ] 3. Try end date before start date — verify validation error
- [ ] **Pass/Fail:** ____

---

### TC-SALES-027: Promotions — Update
**Assertion ID:** VAL-SALES-027  
**URL:** `/sales/promotions`

- [ ] 1. Edit a promotion — change name/discount/dates
- [ ] 2. Save — verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-SALES-028: Promotions — Delete
**Assertion ID:** VAL-SALES-028  
**URL:** `/sales/promotions`

- [ ] 1. Delete a promotion — verify confirmation dialog
- [ ] 2. Confirm — verify removed from list
- [ ] **Pass/Fail:** ____

---

### TC-SALES-029: Sales Targets — List
**Assertion ID:** VAL-SALES-029  
**URL:** `/sales/targets`

- [ ] 1. Navigate to `/sales/targets`
- [ ] 2. Verify: name, period, target amount, achieved, progress %
- [ ] **Pass/Fail:** ____

---

### TC-SALES-030: Sales Targets — Create
**Assertion ID:** VAL-SALES-030  
**URL:** `/sales/targets`

- [ ] 1. Create target (name, period, amount)
- [ ] 2. Verify it appears in list
- [ ] **Pass/Fail:** ____

---

### TC-SALES-031: Sales Targets — Update
**Assertion ID:** VAL-SALES-031  
**URL:** `/sales/targets`

- [ ] 1. Edit a target — verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-SALES-032: Sales Targets — Delete
**Assertion ID:** VAL-SALES-032  
**URL:** `/sales/targets`

- [ ] 1. Delete a target — verify confirmation and removal
- [ ] **Pass/Fail:** ____

---

### TC-SALES-033: Dispatch — Confirm
**Assertion ID:** VAL-SALES-033  
**URL:** `/sales/dispatch`

- [ ] 1. Navigate to `/sales/dispatch`
- [ ] 2. On a Confirmed order, click "Confirm Dispatch"
- [ ] 3. Verify status changes to Dispatched
- [ ] 4. Verify a dispatch slip/reference is generated
- [ ] **Pass/Fail:** ____

---

### TC-SALES-034: Dispatch — Reconcile
**Assertion ID:** VAL-SALES-034  
**URL:** `/sales/dispatch`

- [ ] 1. After dispatch, view reconciliation
- [ ] 2. Verify packed vs. dispatched quantities are compared
- [ ] 3. Verify discrepancies are highlighted
- [ ] **Pass/Fail:** ____

---

### TC-SALES-035: Invoices
**Assertion ID:** VAL-SALES-035  
**URL:** `/sales/invoices`

- [ ] 1. Navigate to `/sales/invoices`
- [ ] 2. Verify list: number, order ref, dealer, date, amount, GST, total, payment status
- [ ] 3. Click an invoice — verify detail view with line items
- [ ] **Pass/Fail:** ____

---

### TC-SALES-036: Returns
**Assertion ID:** VAL-SALES-036  
**URL:** `/sales/returns`

- [ ] 1. Navigate to `/sales/returns`
- [ ] 2. Initiate a return against an invoiced order
- [ ] 3. Specify return quantities per line item and reason
- [ ] 4. Submit — verify return record created
- [ ] 5. Verify dealer balance adjusted or credit note generated
- [ ] **Pass/Fail:** ____

---

## Area: Factory Portal

### TC-FACT-001: Dashboard
**Assertion ID:** VAL-FACT-001  
**URL:** `/factory`

- [ ] 1. Navigate to `/factory`
- [ ] 2. Verify metrics: production efficiency %, completed plans, active batches, alerts
- [ ] 3. Verify all values are non-null
- [ ] **Pass/Fail:** ____

---

### TC-FACT-002: Production Plans — List
**Assertion ID:** VAL-FACT-002  
**URL:** `/factory/production/plans`

- [ ] 1. Navigate to `/factory/production/plans`
- [ ] 2. Verify table: plan number, product, quantity, date, status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-003: Production Plans — Create
**Assertion ID:** VAL-FACT-003  
**URL:** `/factory/production/plans`

- [ ] 1. Click "Create Plan"
- [ ] 2. Fill in plan number, product, quantity, date
- [ ] 3. Submit — verify created in Draft/Pending status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-004: Production Plans — Update
**Assertion ID:** VAL-FACT-004  
**URL:** `/factory/production/plans`

- [ ] 1. Edit a plan in editable status
- [ ] 2. Change product/quantity/date
- [ ] 3. Save — verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-FACT-005: Production Plans — Delete
**Assertion ID:** VAL-FACT-005  
**URL:** `/factory/production/plans`

- [ ] 1. Delete a Draft plan — verify confirmation and removal
- [ ] 2. Verify active/completed plans cannot be deleted
- [ ] **Pass/Fail:** ____

---

### TC-FACT-006: Production Plans — Status Change
**Assertion ID:** VAL-FACT-006  
**URL:** `/factory/production/plans`

- [ ] 1. Advance a plan through lifecycle (Draft → Scheduled → In Progress → Completed)
- [ ] 2. Verify status badge updates at each step
- [ ] 3. Verify available actions change per status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-007: Production Logs — List
**Assertion ID:** VAL-FACT-007  
**URL:** `/factory/production/logs`

- [ ] 1. Navigate to `/factory/production/logs`
- [ ] 2. Verify list: log ID, brand/product, batch size, date, status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-008: Production Logs — Create
**Assertion ID:** VAL-FACT-008  
**URL:** `/factory/production/logs`

- [ ] 1. Create a log (brand/product, materials, batch size, costs)
- [ ] 2. Verify it appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-FACT-009: Production Logs — Detail
**Assertion ID:** VAL-FACT-009  
**URL:** `/factory/production/logs` (detail)

- [ ] 1. Click a production log
- [ ] 2. Verify all fields populated: brand, materials with quantities, batch size, costs, timestamps
- [ ] **Pass/Fail:** ____

---

### TC-FACT-010: Production Batches — List
**Assertion ID:** VAL-FACT-010  
**URL:** `/factory/production/batches`

- [ ] 1. Navigate to `/factory/production/batches`
- [ ] 2. Verify list: batch number, product, quantity, status, date
- [ ] **Pass/Fail:** ____

---

### TC-FACT-011: Production Batches — Create
**Assertion ID:** VAL-FACT-011  
**URL:** `/factory/production/batches`

- [ ] 1. Create a batch (product, quantity, associated plan)
- [ ] 2. Verify it appears in initial status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-012: Packing Queue
**Assertion ID:** VAL-FACT-012  
**URL:** `/factory/packing`

- [ ] 1. Navigate to `/factory/packing`
- [ ] 2. Verify only unpacked batches appear in the queue
- [ ] 3. Verify packed batches are NOT in the queue
- [ ] **Pass/Fail:** ____

---

### TC-FACT-013: Packing — Record
**Assertion ID:** VAL-FACT-013  
**URL:** `/factory/packing`

- [ ] 1. Select a batch and click "Record Packing"
- [ ] 2. Specify package sizes, quantities, material
- [ ] 3. Submit — verify batch packing status updates
- [ ] **Pass/Fail:** ____

---

### TC-FACT-014: Packing — Bulk Pack
**Assertion ID:** VAL-FACT-014  
**URL:** `/factory/packing`

- [ ] 1. On a bulk batch, split into size-specific packages (e.g., 1L, 4L, 20L)
- [ ] 2. Verify total packed = bulk batch quantity
- [ ] 3. Try to overpack beyond batch quantity — verify error
- [ ] **Pass/Fail:** ____

---

### TC-FACT-015: Packing — Complete
**Assertion ID:** VAL-FACT-015  
**URL:** `/factory/packing`

- [ ] 1. Click "Complete Packing" on a batch
- [ ] 2. Verify batch leaves the packing queue
- [ ] 3. Verify batch appears in finished goods
- [ ] **Pass/Fail:** ____

---

### TC-FACT-016: Packing History
**Assertion ID:** VAL-FACT-016  
**URL:** `/factory/packing` (history tab)

- [ ] 1. View packing history
- [ ] 2. Verify entries: batch number, product, sizes, quantities, date, operator
- [ ] 3. Filter by date range — verify results narrow
- [ ] **Pass/Fail:** ____

---

### TC-FACT-017: Packaging Mappings — List
**Assertion ID:** VAL-FACT-017  
**URL:** `/factory/config/packaging`

- [ ] 1. Navigate to `/factory/config/packaging`
- [ ] 2. Verify list: product, package type, size, unit count
- [ ] **Pass/Fail:** ____

---

### TC-FACT-018: Packaging Mappings — Create
**Assertion ID:** VAL-FACT-018  
**URL:** `/factory/config/packaging`

- [ ] 1. Create a mapping (product, package type, size, unit count)
- [ ] 2. Verify it appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-FACT-019: Packaging Mappings — Update
**Assertion ID:** VAL-FACT-019  
**URL:** `/factory/config/packaging`

- [ ] 1. Edit a mapping — verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-FACT-020: Packaging Mappings — Delete
**Assertion ID:** VAL-FACT-020  
**URL:** `/factory/config/packaging`

- [ ] 1. Delete a mapping — verify confirmation and removal
- [ ] **Pass/Fail:** ____

---

### TC-FACT-021: Factory Tasks — List
**Assertion ID:** VAL-FACT-021  
**URL:** `/factory/config/tasks`

- [ ] 1. Navigate to `/factory/config/tasks`
- [ ] 2. Verify list: task ID, description, assignee, priority, status, due date
- [ ] **Pass/Fail:** ____

---

### TC-FACT-022: Factory Tasks — Create
**Assertion ID:** VAL-FACT-022  
**URL:** `/factory/config/tasks`

- [ ] 1. Create a task (description, assignee, priority, due date)
- [ ] 2. Verify it appears in initial status
- [ ] **Pass/Fail:** ____

---

### TC-FACT-023: Factory Tasks — Update
**Assertion ID:** VAL-FACT-023  
**URL:** `/factory/config/tasks`

- [ ] 1. Update a task (description, assignee, priority, status, due date)
- [ ] 2. Verify changes persist on reload
- [ ] **Pass/Fail:** ____

---

### TC-FACT-024: Cost Allocation
**Assertion ID:** VAL-FACT-024  
**URL:** `/factory/cost-allocation`

- [ ] 1. Navigate to `/factory/cost-allocation`
- [ ] 2. Verify cost breakdowns: raw material, labor, overheads, total per unit
- [ ] 3. Verify values are formatted to 2 decimal places
- [ ] 4. Manually recalculate a total — verify correctness
- [ ] **Pass/Fail:** ____

---

### TC-FACT-025: Dispatch — Pending Slips
**Assertion ID:** VAL-FACT-025  
**URL:** `/factory/dispatch`

- [ ] 1. Navigate to `/factory/dispatch`
- [ ] 2. Verify pending dispatch slips: order ref, product, quantity, dealer, destination
- [ ] **Pass/Fail:** ____

---

### TC-FACT-026: Dispatch — Confirm
**Assertion ID:** VAL-FACT-026  
**URL:** `/factory/dispatch`

- [ ] 1. Click "Confirm Dispatch" on a pending slip
- [ ] 2. Verify tracking reference assigned
- [ ] 3. Verify status changes to "Dispatched"
- [ ] **Pass/Fail:** ____

---

### TC-FACT-027: Dispatch — Preview Slip
**Assertion ID:** VAL-FACT-027  
**URL:** `/factory/dispatch`

- [ ] 1. Click "Preview" on a dispatch slip
- [ ] 2. Verify all shipment details shown in print-ready format
- [ ] **Pass/Fail:** ____

---

### TC-FACT-028: Dispatch — Slip Status
**Assertion ID:** VAL-FACT-028  
**URL:** `/factory/dispatch`

- [ ] 1. Verify each slip has a visible status (Pending, Dispatched, Delivered, Cancelled)
- [ ] 2. Open a slip detail — verify status history/timeline with timestamps
- [ ] **Pass/Fail:** ____

---

### TC-FACT-029: Dispatch — Cancel Backorder
**Assertion ID:** VAL-FACT-029  
**URL:** `/factory/dispatch`

- [ ] 1. On a backorder dispatch slip, click "Cancel"
- [ ] 2. Verify reason required and confirmation dialog shown
- [ ] 3. Confirm — verify status changes to "Cancelled"
- [ ] 4. Verify quantities returned to available stock
- [ ] **Pass/Fail:** ____

---

### TC-FACT-030: Finished Goods — List
**Assertion ID:** VAL-FACT-030  
**URL:** `/factory/inventory/finished-goods`

- [ ] 1. Navigate to `/factory/inventory/finished-goods`
- [ ] 2. Verify list: product, SKU, available stock, packed qty, location
- [ ] **Pass/Fail:** ____

---

### TC-FACT-031: Finished Goods — Create
**Assertion ID:** VAL-FACT-031  
**URL:** `/factory/inventory/finished-goods`

- [ ] 1. Create a finished goods entry (product, quantity, batch ref, location)
- [ ] 2. Verify it appears in the list
- [ ] **Pass/Fail:** ____

---

### TC-FACT-032: Finished Goods — Stock Summary
**Assertion ID:** VAL-FACT-032  
**URL:** `/factory/inventory/finished-goods`

- [ ] 1. View stock summary
- [ ] 2. Verify aggregated totals: available, reserved, dispatched
- [ ] 3. Verify totals are consistent with individual batch records
- [ ] **Pass/Fail:** ____

---

### TC-FACT-033: Finished Goods — Low-Stock Alerts
**Assertion ID:** VAL-FACT-033  
**URL:** `/factory/inventory/finished-goods`

- [ ] 1. Verify products below threshold show low-stock indicator
- [ ] 2. Apply low-stock filter — verify only flagged items shown
- [ ] **Pass/Fail:** ____

---

### TC-FACT-034: Finished Goods — Batches
**Assertion ID:** VAL-FACT-034  
**URL:** `/factory/inventory/finished-goods` (detail)

- [ ] 1. Open a finished goods batch detail
- [ ] 2. Verify parent bulk batch and child size-specific batches
- [ ] 3. Verify child quantities sum to parent total
- [ ] **Pass/Fail:** ____

---

### TC-FACT-035: Raw Materials — Stock Overview
**Assertion ID:** VAL-FACT-035  
**URL:** `/factory/inventory/raw-materials`

- [ ] 1. Navigate to `/factory/inventory/raw-materials`
- [ ] 2. Verify list: name, current qty, unit, reorder level, last intake date
- [ ] **Pass/Fail:** ____

---

### TC-FACT-036: Raw Materials — Batches
**Assertion ID:** VAL-FACT-036  
**URL:** `/factory/inventory/raw-materials` (detail)

- [ ] 1. View raw material batches: batch number, supplier, received date, qty, expiry, remaining
- [ ] 2. Filter/sort — verify working
- [ ] **Pass/Fail:** ____

---

### TC-FACT-037: Raw Materials — Intake
**Assertion ID:** VAL-FACT-037  
**URL:** `/factory/inventory/raw-materials`

- [ ] 1. Record intake: material, supplier, batch number, quantity, date
- [ ] 2. Verify stock level increases
- [ ] 3. Verify new batch appears in batch list
- [ ] **Pass/Fail:** ____

---

## Area: Dealer Portal

### TC-DEALER-001: Dashboard
**Assertion ID:** VAL-DEALER-001  
**URL:** `/dealer`

- [ ] 1. Log in as a dealer user
- [ ] 2. Navigate to `/dealer`
- [ ] 3. Verify metrics: total orders, outstanding balance, last payment date, available credit, pending requests
- [ ] 4. Verify all values are specific to the logged-in dealer
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-002: My Orders
**Assertion ID:** VAL-DEALER-002  
**URL:** `/dealer/orders`

- [ ] 1. Navigate to `/dealer/orders`
- [ ] 2. Verify paginated list of dealer's own orders: number, date, status, total, payment status
- [ ] 3. Verify orders from other dealers are NOT visible
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-003: My Invoices
**Assertion ID:** VAL-DEALER-003  
**URL:** `/dealer/invoices`

- [ ] 1. Navigate to `/dealer/invoices`
- [ ] 2. Verify list: invoice number, date, amount, GST, total, payment status
- [ ] 3. Verify all invoices belong to the logged-in dealer
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-004: Invoice PDF Download
**Assertion ID:** VAL-DEALER-004  
**URL:** `/dealer/invoices`

- [ ] 1. Click "Download PDF" on an invoice
- [ ] 2. Verify a PDF file downloads
- [ ] 3. Open it — verify correct dealer details, line items, GST breakdown, total
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-005: My Ledger
**Assertion ID:** VAL-DEALER-005  
**URL:** `/dealer/ledger`

- [ ] 1. Navigate to `/dealer/ledger`
- [ ] 2. Verify chronological transactions: date, description, debit, credit, running balance
- [ ] 3. Verify final balance matches outstanding balance on dashboard
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-006: My Aging
**Assertion ID:** VAL-DEALER-006  
**URL:** `/dealer/aging`

- [ ] 1. Navigate to `/dealer/aging`
- [ ] 2. Verify aging buckets: Current, 30, 60, 90, 120+ days
- [ ] 3. Verify bucket amounts sum to total outstanding balance
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-007: Credit Request
**Assertion ID:** VAL-DEALER-007  
**URL:** `/dealer/credit-requests`

- [ ] 1. Navigate to `/dealer/credit-requests`
- [ ] 2. Click "New Request"
- [ ] 3. Enter amount and justification
- [ ] 4. Submit — verify created in Pending status
- [ ] 5. Submit with empty fields — verify validation errors
- [ ] **Pass/Fail:** ____

---

### TC-DEALER-008: Support Ticket
**Assertion ID:** VAL-DEALER-008  
**URL:** `/dealer/support`

- [ ] 1. Navigate to `/dealer/support`
- [ ] 2. Click "New Ticket"
- [ ] 3. Enter subject, category, description
- [ ] 4. Submit — verify ticket created with reference number in Open status
- [ ] 5. Verify the ticket appears in the tickets list
- [ ] **Pass/Fail:** ____

---

## Cross-Area Flows

### TC-CROSS-001: Auth Gates All Portals
**Assertion ID:** VAL-CROSS-001  
**URL:** All portal roots

- [ ] 1. Clear localStorage (log out completely)
- [ ] 2. Try navigating to each portal URL while unauthenticated:
  - `/admin` — verify redirect to `/login`
  - `/accounting` — verify redirect to `/login`
  - `/sales` — verify redirect to `/login`
  - `/factory` — verify redirect to `/login`
  - `/dealer` — verify redirect to `/login`
  - `/superadmin` — verify redirect to `/login`
- [ ] 3. Log in — verify redirect to the originally intended URL
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-002: First-Visit Flow
**Assertion ID:** VAL-CROSS-002  
**URL:** `/login` → various gates

- [ ] 1. Log in as a new user (first time login)
- [ ] 2. Verify the following gate sequence (if applicable):
  - Login → MFA setup (if enforced) → Password change (if mustChangePassword) → Portal hub (multi-role) or portal (single-role)
- [ ] 3. Verify each gate blocks progression until completed
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-003: Company Switch Refreshes Data
**Assertion ID:** VAL-CROSS-003  
**URL:** Any portal page

- [ ] 1. Log in as multi-company user
- [ ] 2. Note current dashboard data
- [ ] 3. Switch company
- [ ] 4. Verify all visible data refreshes (dashboard, lists, navigation)
- [ ] 5. Verify no page reload is needed
- [ ] 6. Check Network tab — verify `X-Company-Code` header changes
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-004: Navigation Between Portals
**Assertion ID:** VAL-CROSS-004  
**URL:** `/hub` and portal routes

- [ ] 1. Log in as multi-role user
- [ ] 2. Navigate to Admin portal
- [ ] 3. Return to hub
- [ ] 4. Navigate to Accounting portal
- [ ] 5. Verify layout, sidebar, and data context change correctly each time
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-005: Error Codes Display Friendly Messages
**Assertion ID:** VAL-CROSS-005  
**URL:** Various pages

- [ ] 1. Trigger various error scenarios across the app
- [ ] 2. Verify error messages are human-readable (not raw codes like "AUTH_001")
- [ ] 3. Verify error toasts for auth errors, inline messages for validation errors
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-006: Consistent Design Across Portals
**Assertion ID:** VAL-CROSS-006  
**URL:** Multiple portals

- [ ] 1. Open 3 different portals
- [ ] 2. Compare the same component types: Button, DataTable, Modal
- [ ] 3. Verify identical styling: font sizes, colors, spacing, border radius, shadows
- [ ] 4. Verify no portal uses competing component variants
- [ ] **Pass/Fail:** ____

---

### TC-CROSS-007: Responsive Across Portals
**Assertion ID:** VAL-CROSS-007  
**URL:** All portals at 375px, 768px, 1280px

- [ ] 1. Test each portal at three viewports: 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] 2. Verify sidebars collapse appropriately
- [ ] 3. Verify tables transform to cards on mobile
- [ ] 4. Verify touch targets are at least 44px on mobile
- [ ] **Pass/Fail per portal and viewport:** ____

---

## Mobile & Polish

### TC-MOBILE-001: Touch Targets
**Assertion ID:** VAL-MOBILE-001  
**URL:** Any portal at 375px viewport

- [ ] 1. Set viewport to 375px width
- [ ] 2. Check 10 representative interactive elements (buttons, links, form controls, nav items, table rows)
- [ ] 3. Measure each — verify minimum 44x44px touch target
- [ ] **Pass/Fail:** ____

---

### TC-MOBILE-002: Tables to Cards
**Assertion ID:** VAL-MOBILE-002  
**URL:** Table pages at 375px viewport

- [ ] 1. Open a page with a data table at 1280px — verify table layout
- [ ] 2. Resize to 375px — verify transformation to card-based layout
- [ ] 3. Verify essential fields are readable in card format
- [ ] 4. Test on at least 3 different portal table pages
- [ ] **Pass/Fail:** ____

---

### TC-MOBILE-003: MFA App Switch Resilience
**Assertion ID:** VAL-MOBILE-003  
**URL:** `/mfa` on mobile

- [ ] 1. On mobile, reach the MFA page
- [ ] 2. Switch to authenticator app
- [ ] 3. Return to browser
- [ ] 4. Verify page state preserved (input visible, no re-login)
- [ ] 5. Enter code — verify submission succeeds
- [ ] **Pass/Fail:** ____

---

### TC-MOBILE-004: Forms on Mobile
**Assertion ID:** VAL-MOBILE-004  
**URL:** Any form page at 375px viewport

- [ ] 1. Open a form page at 375px viewport
- [ ] 2. Tap input fields — verify virtual keyboard doesn't obscure the active input
- [ ] 3. Fill and submit the form via touch
- [ ] 4. Verify form submission works correctly
- [ ] **Pass/Fail:** ____

---

### TC-MOBILE-005: PDF Download on Mobile
**Assertion ID:** VAL-MOBILE-005  
**URL:** Invoice/report pages on mobile

- [ ] 1. On mobile viewport, trigger a PDF download (e.g., invoice PDF)
- [ ] 2. Verify the file downloads or opens in a new tab
- [ ] 3. Verify the PDF content is readable
- [ ] **Pass/Fail:** ____

---

## Summary Scorecard

| Area | Total Tests | Passed | Failed | Blocked | Notes |
|------|------------|--------|--------|---------|-------|
| Authentication | 20 | | | | |
| Shell & Navigation | 16 | | | | |
| Admin Portal | 39 | | | | |
| Superadmin Portal | 18 | | | | |
| Accounting Portal | 65 | | | | |
| Sales Portal | 36 | | | | |
| Factory Portal | 37 | | | | |
| Dealer Portal | 8 | | | | |
| Cross-Area Flows | 7 | | | | |
| Mobile & Polish | 5 | | | | |
| **TOTAL** | **251** | | | | |

---

**Tester:** ________________________  
**Date Completed:** ________________________  
**Environment/Build:** ________________________  
**Overall Result:** PASS / FAIL  
**Sign-off:** ________________________
