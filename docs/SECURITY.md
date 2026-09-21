# QuickCart — Security Policy, Threat Analysis & Operational Checklist

> **Single Source of Truth**: This document details authentication boundaries, secret management protocols, upload security, authorization vulnerabilities, rate-limiting behavior, and pre-production security checklists.

---

## 1. Authentication Boundaries & Session Management

```mermaid
flowchart TD
    subgraph Web Authentication Boundary
        Browser[Web Browser] -->|HTTP-only JWT Cookie| NextAuthServer[NextAuth.js v5 Handler]
        NextAuthServer -->|auth() Session| WebProtectedRoutes[Web API & Admin Pages]
    end

    subgraph Mobile Authentication Boundary
        MobileDevice[Expo Mobile App] -->|Google ID Token| GoogleEndpoint["/api/auth/google-native"]
        MobileDevice -->|Truecaller Code + PKCE| TruecallerEndpoint["/api/auth/truecaller"]
        MobileDevice -->|Email + 6-digit OTP| OtpEndpoint["/api/auth/verify-otp"]
        GoogleEndpoint --> UserRecord[Prisma User Record]
        TruecallerEndpoint --> UserRecord
        OtpEndpoint --> UserRecord
    end

    subgraph Data Access Boundary
        WebProtectedRoutes --> NeonDB[(Neon PostgreSQL)]
        UserRecord --> NeonDB
    end
```

### Web Surface
- Managed by **NextAuth.js v5 (Auth.js)** with JWT strategy.
- Uses cryptographically signed cookies (`authjs.session-token`).
- Gated by role: `CUSTOMER` vs `ADMIN`.

### Mobile Surface
- Authenticates using native hardware credentials:
  - **Google Sign-In**: Validates ID Token directly against Google's `tokeninfo` endpoint (`https://oauth2.googleapis.com/tokeninfo`). Verifies token audience (`aud`/`azp`) against allowed client IDs and requires `email_verified: true`.
  - **Truecaller**: Performs server-side authorization code exchange using PKCE against `https://oauth-account-noneu.truecaller.com/v1/token`. Fetches user profile from `v1/userinfo` and sanitizes phone numbers into E.164 format.
  - **Email OTP**: 6-digit cryptographic random integer with 10-minute expiration stored in `EmailOtp` table.

---

## 2. Environment Variables & Secret Management

### Strict Variable Classification

| Variable Name | Exposure | Required Environment | Description / Security Note |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Server Only** | Dev, Staging, Prod | Neon PostgreSQL pooled connection string with SSL (`sslmode=require`). **Never commit.** |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | **Server Only** | Dev, Staging, Prod | 256-bit random entropy used to encrypt/sign session JWTs. Must be set in production. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | **Server Only** | Dev, Staging, Prod | Google OAuth 2.0 Web Client credentials. |
| `APP_EMAIL` / `APP_PASSWORD` | **Server Only** | Dev, Staging, Prod | Gmail SMTP credentials for sending transactional OTP emails. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | **Server Only** | Dev, Staging, Prod | Master credentials for admin portal authorization. Must use strong non-default values in production. |
| `CLOUDFLARE_R2_ACCOUNT_ID` | **Server Only** | Dev, Staging, Prod | Cloudflare account identifier for R2 storage. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | **Server Only** | Dev, Staging, Prod | S3-compatible API token access key. |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | **Server Only** | Dev, Staging, Prod | S3-compatible API token secret key. **Never commit.** |
| `CLOUDFLARE_R2_BUCKET_NAME` | **Server Only** | Dev, Staging, Prod | Bucket name (`groceryitems`). |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public / Server | Dev, Staging, Prod | Public CDN endpoint (`https://pub-xxxxxx.r2.dev`). |
| `EXPO_PUBLIC_API_URL` | **Public (Mobile)** | Mobile Build | Base URL for backend API (`https://quickcart-nu-nine.vercel.app`). |
| `NEXT_PUBLIC_FIREBASE_*` | **Public (Web)** | Dev, Staging, Prod | Public Firebase web configuration (read-only client SDK). |

### Rules for Handling Secrets
1. **Never commit real values**: Use `.env.example` with descriptive placeholders (e.g. `your-database-url`).
2. **CI/CD Hygiene**: Mobile build secrets (e.g. `GOOGLE_SERVICES_JSON_B64`, `RELEASE_KEYSTORE_PASSWORD`) are injected via encrypted GitHub Repository Secrets.
3. **No Private Keys in VCS**: Keystores (`release.keystore`) and Google services files are base64-encoded in GitHub Secrets and restored in-memory during build steps.

---

## 3. Upload Validation & Asset Security (`/api/admin/upload`)

The file upload endpoint is protected by `role === "ADMIN"` checks and enforces:
- **MIME Type Allowlist**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`.
- **Extension Allowlist**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`.
- **File Size Cap**: Maximum 5 MB (`5 * 1024 * 1024` bytes).
- **Key Path Sanitization**: Strips path traversal characters (`..`, `/`), forces lowercase alphanumeric characters and hyphens, appends `Date.now()` timestamp.

### ⚠️ Known Upload Risks & Mitigation Path
- **SVG Cross-Site Scripting (XSS)**: `image/svg+xml` files can contain embedded `<script>` tags or malicious event handlers (`onload`).
  *Current Mitigation*: Served from a separate Cloudflare R2 domain (`*.r2.dev`) isolating cookies from the application domain.
  *Required Hardening*: Add SVG sanitization (e.g. `DOMPurify` / `is-svg`) before upload or strip SVG from allowed customer/admin avatar types.
- **Vercel Ephemeral Fallback**: When Cloudflare R2 credentials are not set, uploads fall back to `/public/uploads/`. On Vercel serverless environments, local filesystem writes are ephemeral and discarded upon container termination.

---

## 4. Authorization Vulnerabilities & Threat Analysis

### ✅ Resolved Finding 1: Guest Order Cancellation Bypass (PATCHED)
In `app/api/orders/[id]/cancel/route.ts`:
Previously: `!order.userId` evaluated to `true`, allowing anyone who knew a guest order ID to cancel it.
**Patch Applied**:
```typescript
let isOwner = false;
if ((session?.user as any)?.role === "ADMIN") {
  isOwner = true;
} else if (session?.user?.id && order.userId && order.userId === session.user.id) {
  isOwner = true;
} else {
  // Guest or tokenless verification: strictly require matching phone or user email
  const cleanPhone = phoneParam ? phoneParam.replace(/\D/g, "").slice(-10) : "";
  const orderPhone = order.customerPhone ? order.customerPhone.replace(/\D/g, "").slice(-10) : "";
  const matchesPhone = Boolean(cleanPhone && orderPhone && cleanPhone === orderPhone);
  const matchesEmail = Boolean(
    emailParam &&
    order.user?.email &&
    order.user.email.toLowerCase() === emailParam
  );
  if (matchesPhone || matchesEmail) {
    isOwner = true;
  }
}

if (!isOwner) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

### 🟡 Warning Finding 2: Unauthenticated Order Queries by Email/Phone
In `GET /api/orders`:
```typescript
} else if (emailParam || phoneParam) {
  const orConditions: any[] = [];
  if (emailParam) { ... }
  if (phoneParam) { ... }
  whereClause = { OR: orConditions };
}
```
**Vulnerability**: Anyone who knows a customer's phone number or email address can query `GET /api/orders?phone=9800012345` and view their complete order history, physical delivery addresses, and purchasing behavior without authentication.
**Remediation**: Mobile requests should authenticate via signed JWT bearer tokens rather than unauthenticated query strings.

### ✅ Resolved Finding 3: Dynamic Product Creation in Order Placement (PATCHED)
In `POST /api/orders`:
Previously: Missing products were dynamically inserted with arbitrary price and `stockQty: 999`.
**Patch Applied**:
- Removed dynamic creation of unlisted products. If a product does not exist in the active catalog, the transaction throws a 400 Bad Request error.
- Strict atomic inventory reservation:
```typescript
if (product.stockQty < item.quantity) {
  throw new Error(
    `Insufficient stock for "${product.name}". Available: ${Math.max(0, product.stockQty)}, requested: ${item.quantity}`
  );
}
await tx.product.update({
  where: { id: product.id },
  data: { stockQty: { decrement: item.quantity } },
});
```

### 🟡 Warning Finding 4: Persistent Test Account
In `POST /api/auth/send-otp` and `lib/auth.ts`:
```typescript
if (cleanEmail === "test@google.com") {
  // Sets fixed OTP "123456" with expiration date 2099-12-31
}
```
**Vulnerability**: `test@google.com` can be logged into by anyone at any time with OTP `123456`.
**Remediation**: Guard this bypass strictly with `process.env.NODE_ENV !== "production"` or remove before general public release.

### 🔴 High-Severity Finding 5: Production Keystore Committed to Repository (`Mobile-app/release-keystore.b64`)
- **Finding**: The base64-encoded Android release signing keystore (`Mobile-app/release-keystore.b64`) is tracked in version control and was previously checked out and read directly by GitHub Actions CI.
- **Severity**: **CRITICAL / HIGH**. Anyone with repository read access possesses the private signing key used to authenticate release APKs and Google Play AAB bundles.
- **Irreversibility Warning**:
  > [!CAUTION]
  > **Do NOT delete or rotate this key automatically!**
  > If this app has already been uploaded or published to Google Play, rotating or destroying this signing key without Google Play App Signing key upgrade permissions will permanently prevent publishing updates to existing app installs.
- **Migration Path to GitHub Secrets**:
  1. **Step 1 (Add GitHub Secret)**: The repository owner must copy the base64 content of the release keystore and add it to **GitHub Repository Settings → Secrets and variables → Actions** as `ANDROID_RELEASE_KEYSTORE_B64`.
  2. **Step 2 (Add Credentials Secrets)**: Add `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_ALIAS` secrets in GitHub Secrets.
  3. **Step 3 (CI Decoupling - Completed)**: The workflow `.github/workflows/build-apk.yml` and `scripts/configure-release-signing.js` have been updated to prioritize `secrets.ANDROID_RELEASE_KEYSTORE_B64`. Future CI runs will consume the secret directly and do not require the file.
  4. **Step 4 (Untrack from Git)**: Once the secret is verified in CI, safely remove the file from git tracking without deleting local developer backups:
     ```bash
     git rm --cached Mobile-app/release-keystore.b64
     echo "release-keystore.b64" >> Mobile-app/.gitignore
     git commit -m "security: remove release keystore from git tracking"
     ```
  5. **Step 5 (History Purge / Key Upgrade)**: If the repository was ever public, consider requesting a Key Upgrade via Google Play Console Support, or purge the commit history using `git-filter-repo` if private.

---

## 5. Barcode & Inventory Endpoint Authorization Model

| Endpoint | Method | Anonymous | Role: CUSTOMER | Role: ADMIN | Rate Limit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/products/barcode/[code]` | `GET` | **401 Unauthorized** | **200 OK (Sanitized Storefront Fields Only)** | **200 OK (Rich Internal Warehouse View)** | 60 req / min |
| `/api/admin/inventory/import/preview` | `POST` | **401 Unauthorized** | **403 Forbidden** | **200 OK (Dry-run preview)** | - |
| `/api/admin/inventory/import/commit` | `POST` | **401 Unauthorized** | **403 Forbidden** | **200 OK (Interactive upsert)** | - |
| `/api/admin/inventory/import/[id]/rollback` | `POST` | **401 Unauthorized** | **403 Forbidden** | **200 OK (Snapshot revert)** | - |
| `/api/admin/orders/[id]/status` | `POST` | **401 Unauthorized** | **403 Forbidden** | **200 OK (State transition)** | - |

### Barcode Sanitization Policy (Customer vs Admin)
1. **Storefront Customer Response**:
   - Strictly limited to safe storefront fields: `id`, `name`, `slug`, `price`, `mrp`, `image`/`imageUrl`, `emoji`, `unit`, `availability` (`IN_STOCK` / `OUT_OF_STOCK`), `isAvailable`.
   - **Strictly Withheld**: `stockQty` (clamped and omitted to prevent leaking dark-store shortages or physical stock counts), `itemCode` (POS identifier), `barcode` / `barcodeSymbology`, `category` internal object, `createdAt` / `updatedAt` timestamps.
   - **Inactive Catalog Isolation**: If `isActive === false`, customers receive `404 Not Found`.
2. **Warehouse Admin Response**:
   - Receives complete database entity including `stockQty` (signed integer showing shortages e.g. -4), `category`, `itemCode`, `barcode`, `barcodeSymbology`, and audit metadata.
3. **Abuse Mitigation**:
   - `rateLimit(`barcode-lookup:${userId}`, 60, 60000)` enforces a hard cap of 60 requests per minute per authenticated user to prevent barcode enumeration, price scraping, or denial-of-service. Returns `429 Too Many Requests`.

---

## 6. Rate Limiting Behavior

In `lib/rateLimit.ts`:
- **Implementation**: Uses an in-memory JavaScript `Map<string, { count, resetAt }>`.
- **Enforced Limits**:
  - `send-otp`: 5 requests per 15 minutes per email.
  - `login-otp`: 10 attempts per 15 minutes per email.
  - `admin-login`: 5 attempts per 15 minutes per email.
  - `barcode-lookup`: 60 requests per minute per authenticated user.
- **Serverless Limitation**: In Vercel serverless environments, each incoming request may run in a separate container/isolate. The in-memory map is not shared across lambda instances and resets on cold starts.
- **Planned Hardening**: Migrate to a shared Redis/Upstash distributed sliding-window rate limiter.

---

## 7. Pre-Production Operational Security Checklist

- [ ] **Migrate Android Release Keystore**: Populate `ANDROID_RELEASE_KEYSTORE_B64` in GitHub Secrets and untrack `Mobile-app/release-keystore.b64`.
- [ ] **Rotate Master Admin Password**: Replace default `admin123` with a cryptographically strong 32+ character passphrase in production environment variables.
- [ ] **Generate Random NextAuth Secret**: Run `openssl rand -base64 32` and set `NEXTAUTH_SECRET` in Vercel.
- [ ] **Disable Test Account Bypass**: Ensure fixed test accounts (`test@google.com` / `123456`) are disabled in production builds.
- [ ] **Patch Guest Cancellation Guard**: Require phone/email confirmation on guest order cancellations.
- [ ] **Protect Order History**: Require signed auth headers or OTP verification before returning order history on mobile.
- [ ] **Audit Cloudflare R2 Credentials**: Restrict R2 API token permissions to PutObject and GetObject on the `groceryitems` bucket only.
- [ ] **Sanitize Uploaded SVGs**: Add SVG sanitation or disallow SVG uploads in user-facing forms.
- [ ] **Migrate Rate Limiting to Redis**: Deploy Upstash Redis rate limiting on all `/api/auth/*` and `/api/products/barcode/*` routes.
- [ ] **Verify Database SSL**: Confirm `DATABASE_URL` contains `sslmode=require` to prevent cleartext database wire traffic.

---

## 7. Documentation Maintenance Rule

> [!IMPORTANT]
> **Documentation Maintenance Rule**:
> Any security audit, dependency CVE remediation, authentication handler update, or variable rule change must update this document and be logged in `docs/CHANGELOG.md` in the same pull request.
