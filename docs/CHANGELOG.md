# QuickCart — Changelog

All notable changes to the QuickCart monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — POS Bulk Inventory Import, Barcodes & Full-Stack Hardening

### Added
- **Vercel dependency resolution**: Pinned Vitest to `4.1.11`, compatible with the repository's `@types/node` 20.x range, so clean Vercel `npm install` no longer fails on Vitest 5 peer requirements.
- **Product create/edit media**: Admin product forms now persist optional unique item codes and matching barcode metadata, explicitly clear barcode fields when the code is removed, and support up to 10 product images with primary-image selection, reordering, preview, removal, and legacy `imageUrl` compatibility. The additive `imageUrls` migration artifact is documented but not applied automatically.
- **Prisma Schema & Neon Database Migration**: Added `itemCode String? @unique`, `barcode String?`, and `barcodeSymbology String?` to `Product` model. Created `InventoryImport` model with `ImportStatus` enum (`COMMITTED`, `ROLLED_BACK`, `FAILED`) and pre-import JSON snapshot audit storage. Pushed safely to Neon Postgres via Prisma.
- **Core Ingestion & Barcode Engine**:
  - `lib/inventory/types.ts`: Defined `NormalizedPOSRow`, `ImportSummary`, `ImportPreviewResponse`, `ProductSnapshot`, `SymbologyType`.
  - `lib/inventory/validator.ts`: Decimal-to-paise conversion (`rupeeToPaise`) with `Number.EPSILON` rounding (e.g. `72.36` -> `7236`), signed stock integer preservation (`parseSignedStock`), slug generator, and pack unit extractor (`extractUnitFromName`).
  - `lib/inventory/barcode.ts`: Universal Code 128 ASCII validator, GS1 EAN-13 Modulo-10 checksum calculator, and symbology resolver (`resolveBarcodeSymbology`, `resolveSymbology`).
  - `lib/inventory/parser.ts`: Server-side SheetJS parser strictly targeting `Export Items` worksheet, aliasing `Default M` -> MRP, preserving leading zeros (e.g. `00491823`), SHA-256 file hashing, duplicate-in-sheet conflict detection, and deterministic database matching.
- **REST API Endpoints**:
  - `POST /api/admin/inventory/import/preview`: 10MB limit dry-run parser returning real-time counters (To Create, To Update, Skipped, Shortages, Missing Codes, Errors) and SHA-256 idempotency check.
  - `POST /api/admin/inventory/import/commit`: Atomic `$transaction` batch upsert generating pre-import snapshot logs and `InventoryImport` audit records.
  - `POST /api/admin/inventory/import/[id]/rollback`: Atomic rollback endpoint reverting prices, stock quantities, and item codes to snapshot state.
  - `GET /api/products/barcode/[code]`: Read-only barcode and itemCode lookup endpoint returning active product cards.
  - `POST /api/admin/products/bulk`: Hardened with `itemCode`, signed stock support, and audit logs.
- **Web Admin UI**:
  - `components/admin/inventory/BarcodeRenderer.tsx`: Code 128 / EAN-13 live SVG renderer with SVG download and 2" x 1" thermal label printing.
  - `components/admin/inventory/ImportWizardModal.tsx`: 4-step modern import wizard with file upload, dry-run metrics counter, shortage warnings, and atomic commit confirmation.
  - `app/admin/products/page.tsx`: Added Shortage counter card, filter by `Shortage (Stock < 0)`, itemCode badges, and purple dark-store shortage badges.
  - `components/admin/ProductForm.tsx` & `app/admin/products/[id]/page.tsx`: Added `itemCode`, `barcodeSymbology`, live SVG barcode preview, and signed stock adjustments without 0-floor clamping.
  - `app/admin/orders/[orderId]/page.tsx`: Added "Print Picking Slip" thermal slip generator with item barcodes and pick checkboxes.
- **Mobile Expo Barcode Scanner**:
  - `expo-camera` (~16.0.18) installed and configured in `Mobile-app/app.json` with camera permissions.
  - `Mobile-app/app/scanner.tsx`: Native `CameraView` barcode scanner with viewfinder reticle, torch toggle, haptic vibration, and read-only action modal (Add to Cart / View Details). Strictly read-only: never auto-mutates inventory or carts upon camera detection.
- **Automated Test Suite & Modern ESLint**: Installed `vitest` and created comprehensive tests in `tests/unit/barcode-engine.test.ts`, `tests/unit/currency-stock.test.ts`, `tests/unit/excel-parser.test.ts`, `tests/integration/inventory-import.test.ts`, and `tests/integration/api-auth.test.ts` (5 suites, 54 tests passing). Configured modern non-interactive ESLint flat config (`eslint.config.mjs`) for Next.js 15.

### Fixed & Hardened (Security & Parity)
- **Customer Barcode Lookup & Contract Sanitization**: `GET /api/products/barcode/[code]` refactored to safely allow authenticated customers (`CUSTOMER`) to look up items by barcode or itemCode while strictly sanitizing output. Customers receive only safe storefront fields (`id`, `name`, `slug`, `price`, `mrp`, `image`, `unit`, `availability`, `isAvailable`). Dark-store shortages (`stockQty < 0`), exact warehouse inventory counts, POS codes, internal category objects, and audit timestamps are strictly withheld. Admins continue to receive rich warehouse data. Inactive products return `404 Not Found` to customers. Enforced 60 req/min rate limiting per authenticated user.
- **Mobile Scanner Authentication & Shortage Guard**: `Mobile-app/app/scanner.tsx` updated to require customer authentication with an intuitive sign-in screen, consume authenticated customer fields, and guard shortage badges so that dark-store warehouse shortages are never displayed to customers.
- **Database Migration Artifact & Safety Documentation**: Created reviewable additive SQL migration script `prisma/migrations/20260921000000_add_item_code_barcode_inventory_import/migration.sql` generated via `prisma migrate diff`. Documented safe schema deployment procedures, `pg_dump` preflight backups, and `prisma db push` guarantees in `docs/DATA_MODEL.md` and `docs/ADMIN_GUIDE.md`.
- **CI Keystore Security Decoupling**: Updated `.github/workflows/build-apk.yml` and `Mobile-app/scripts/configure-release-signing.js` to dynamically read `ANDROID_RELEASE_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_ALIAS` from GitHub Secrets, ensuring future CI does not require the tracked in-tree file. Documented a High-Severity finding and non-destructive migration path in `docs/SECURITY.md`.
- **Guest Order Cancellation Security Patch**: `app/api/orders/[id]/cancel/route.ts` previously allowed anyone who knew a guest order ID to cancel it (`!order.userId` evaluated to `true`). Fixed to strictly require matching phone (`customerPhone` matching last 10 digits) or user email before granting cancellation authorization.
- **Strict Concurrency Inventory Reservation**: `app/api/orders/route.ts` eliminated dynamic creation of missing products with `stockQty: 999`. Added atomic check `if (product.stockQty < item.quantity) throw new Error(...)` to prevent overselling race conditions.
- **Admin Order Cancellation Parity**: `app/api/admin/orders/[id]/status/route.ts` enhanced to atomically refund redeemed tokens, claw back earned tokens, and decrement coupon usage count when an administrator moves an order to `CANCELLED`, matching customer self-cancellation logic.
- **Mobile Cart Store Integration**: `Mobile-app/app/scanner.tsx` updated to use `useCartStore` with `add(productId, product)` for cart operations.

### Changed
- Updated `docs/SECURITY.md`, `docs/MOBILE_WEB_PARITY.md`, `docs/ADMIN_GUIDE.md`, `docs/DATA_MODEL.md`, and `docs/CHANGELOG.md` to document the revised barcode contract, migration commands, and keystore security migration.
- Expanded integration tests in `tests/integration/api-auth.test.ts` to 58 passing tests, covering anonymous 401, CUSTOMER read-only lookup with sanitized fields, ADMIN rich lookup, invalid code 400, not found 404, inactive item 404, and 429 rate limit abuse guards.

---

## [1.0.0] — 2026-09-19 (Baseline Release)

### Added
- **Mobile Backend Auth Hardening** (`64b3284`): Strengthened backend mobile authentication endpoints for Google Native (`/api/auth/google-native`) and Truecaller (`/api/auth/truecaller`), added coupon validation endpoint, and unified phone-based token sync.
- **Google Play Store Release Pipeline** (`43d0433`): Configured automated Android APK and Play Store AAB generation via GitHub Actions (`.github/workflows/build-apk.yml`), bumping Android `versionCode` to 4.
- **Truecaller One-Tap Auth** (`e1a19af`): Integrated `expo-truecaller` with client ID `vehpunfwibqmwezricdesqmr9eet09qgwrnyzekapgi` and account collision merging.
- **Test Account Setup** (`9e4d5e5`): Added persistent development testing account `test@google.com` with fixed OTP `123456`.
- **Cloudflare R2 Image Pipeline**: S3 SigV4 file upload endpoint (`/api/admin/upload`) with 1-year immutable edge CDN cache headers.
- **NextAuth v5 Implementation**: Web authentication with Google OAuth and Email OTP via Nodemailer SMTP.
- **Prisma Schema & Neon Postgres**: Database schema with models for products, categories, orders, coupons, addresses, and serviceable Siliguri pincodes.

### Fixed
- **Mobile Login Screen Layout** (`a3cf19f`): Made login screen layout fully responsive across varying Android device viewports to eliminate vertical scrollbars and button clipping.
- **Google Sign-In Error Handling** (`149fedd`): Added graceful handling for Google `DEVELOPER_ERROR` and Truecaller pending application reviews.
- **CI Secret Security** (`2c5b011`): Removed hardcoded credentials from CI workflow files, transitioned to GitHub Repository Secrets, and encoded `google-services.json` in base64.
- **Pricing & Floating Cart Mismatch** (`95e9c9b`): Fixed cart total calculation inconsistencies between the floating checkout pill and full cart view.

---

## Standard Change Template for Future Releases

When submitting a pull request that introduces changes or fixes, append an entry using the following template:

```markdown
## [Version / PR Title] — YYYY-MM-DD

### Added
- Describe new features, routes, components, or schema additions.

### Changed
- Describe modifications to existing business logic, interfaces, or workflows.

### Deprecated
- Describe features or endpoints marked for upcoming removal.

### Removed
- Describe eliminated files, endpoints, dependencies, or fields.

### Fixed
- Describe resolved bugs, defects, or calculation errors.

### Security
- Describe vulnerability remediations, auth changes, or secret handling updates.

### Documentation Updated
- List of markdown files in `docs/` updated in this change.
```

---

## Documentation Maintenance Rule

> [!IMPORTANT]
> **Documentation Maintenance Rule**:
> Every pull request or commit that modifies application code, configuration, or environment variables MUST include an update to this `docs/CHANGELOG.md` file and any corresponding documentation files in `docs/`.
