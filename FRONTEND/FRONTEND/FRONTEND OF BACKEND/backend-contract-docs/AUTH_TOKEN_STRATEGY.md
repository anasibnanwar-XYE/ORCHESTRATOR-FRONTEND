# Frontend Auth and Token Strategy (Backend-Aligned)

Canonical references:
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/auth/controller/AuthController.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/modules/auth/service/AuthService.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/core/security/SecurityConfig.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/core/security/CompanyContextFilter.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/core/security/JwtTokenService.java`
- `erp-domain/src/main/java/com/bigbrightpaints/erp/core/util/IdempotencyHeaderUtils.java`

## 1) Auth Endpoints

Public endpoints (`permitAll`):
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`

Authenticated endpoints:
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/profile`
- `PUT /api/v1/auth/profile`
- `POST /api/v1/auth/password/change`
- `POST /api/v1/auth/mfa/setup`
- `POST /api/v1/auth/mfa/activate`
- `POST /api/v1/auth/mfa/disable`

## 2) Token Contract

`POST /api/v1/auth/login` and `POST /api/v1/auth/refresh-token` return `AuthResponse`:
- `tokenType` (expected `Bearer`)
- `accessToken`
- `refreshToken`
- `expiresIn` (seconds)
- `companyCode`
- `displayName`
- `mustChangePassword`

Backend includes both company claims in access token:
- `companyCode`
- `cid` (legacy alias)

## 3) Required Request Headers

For authenticated API calls:
- `Authorization: Bearer <accessToken>`

Company context headers:
- Preferred: `X-Company-Code: <companyCode>`
- Legacy accepted: `X-Company-Id: <companyCode>`

Hard validation rules:
- If `X-Company-Code` and `X-Company-Id` are both sent and differ, request is rejected (`403`).
- If company header conflicts with token company claim, request is rejected (`403`).
- If token has no company claim, authenticated request is rejected (`403`).
- Unauthenticated requests cannot set company headers.

## 4) Login / Refresh / Switch Flow

1. Login:
- Call `POST /api/v1/auth/login` with `email`, `password`, `companyCode` (+ MFA code/recovery code when required).
- Save returned `accessToken`, `refreshToken`, `companyCode`, and `expiresIn`.

2. Use API:
- Send bearer token on every authenticated request.
- Send `X-Company-Code` matching active token company.

3. Refresh:
- On `401`, call `POST /api/v1/auth/refresh-token` with `{ refreshToken, companyCode }`.
- Replace both tokens from response.

4. Company switch:
- Call `POST /api/v1/multi-company/companies/switch` with target `companyCode`.
- Immediately call `POST /api/v1/auth/refresh-token` with same target company to mint tokens for new tenant context.
- Continue using new tokens and `X-Company-Code`.

5. Logout:
- Call `POST /api/v1/auth/logout` (optional `refreshToken` query param).
- Clear client token state.

## 5) MFA and Password Behavior

- MFA setup/activation/disable are authenticated operations.
- Login can require MFA (`mfaCode` or `recoveryCode`).
- `mustChangePassword=true` in auth response means frontend must force password-change UX before normal app flow.
- Password reset and some account security events revoke active token sessions server-side.

## 6) Idempotency Header Policy

For write endpoints that support idempotency, use:
- `Idempotency-Key: <uuid-v4-or-stable-request-key>`

Legacy header:
- `X-Idempotency-Key` may exist in some routes.
- If both headers are sent with different values, backend rejects request.

Frontend rule:
- Prefer only `Idempotency-Key`.
- If backward compatibility requires both headers, values must match exactly.

## 7) Error Handling Contract (Frontend)

- `401`: token invalid/expired -> refresh flow.
- `403`: company context mismatch, tenant access denial, or role/permission denial.
- `400`/`422`: validation/data contract errors -> show field-level and request-level errors.
- Auth endpoints may return plain auth DTO (`AuthResponse`) while many business endpoints return `ApiResponse<T>` wrapper; frontend clients must handle both shapes.

## 8) Storage and Session Safety

Recommended client behavior:
- Keep access token in memory-first state.
- Persist refresh token only in the minimum-risk storage supported by your frontend architecture.
- Never log tokens or place tokens in URL query strings.
- Clear all token/user state on logout and on unrecoverable refresh failure.
