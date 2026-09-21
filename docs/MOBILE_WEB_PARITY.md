# QuickCart — Mobile vs. Web Feature Parity Matrix

> **Single Source of Truth**: This document details functional feature parity, technical divergence, and architectural parity risks between the Next.js Web storefront and the Expo React Native mobile app (`Mobile-app/`).

---

## 1. Feature Parity Matrix

| Feature Area | Next.js Web Storefront | Expo React Native Mobile (`com.semart.app`) | Parity Status | Technical Differences & Risk Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog Browsing** | Supported (`/`, `/categories`) | Supported (`/(tabs)`, `/(tabs)/categories`) | ✅ High Parity | Both render categories, search bar, banner carousel, and product cards with discounts. |
| **Product Search** | Supported (`/search`) | Supported (`/search`) | ✅ High Parity | Both perform client-side keyword search over loaded products. |
| **Product Detail** | Supported (`/product/[slug]`) | Supported (`/product/[slug]`) | ✅ High Parity | Both display image, pricing in paise, pack size/unit, stock badge, and related items. |
| **Cart & Quantities** | Supported (`/cart`) | Supported (`/(tabs)/cart`) | ✅ High Parity | Both support stepper increments, threshold nudges, and item removal. |
| **Bill Breakdown** | Supported | Supported (`components/BillSummary.tsx`) | ✅ Parity Restored | Working-tree fix aligned mobile platform fee to ₹2 (`200` paise) matching web. |
| **Customer Auth** | NextAuth v5 (Google OAuth, Email OTP) | Native Google Sign-In, Truecaller One-Tap, Email OTP | ⚠️ Divergent Architecture | Web uses HTTP-only cookie sessions; Mobile calls specialized backend endpoints (`/api/auth/*`). |
| **Checkout & Address** | Supported (`/checkout`) | Supported (`/checkout`) | ✅ High Parity | Both support address entry, Siliguri pincode validation, and COD payment. |
| **Order History** | Supported (`/orders`) | Supported (`/(tabs)/orders`) | ✅ High Parity | Both list historical customer orders fetched from backend database. |
| **Order Tracking** | Supported (`/orders/[id]`) | Supported (`/order-details/[id]`) | ✅ High Parity | Both render the visual order status progression timeline. |
| **Customer Cancellation** | Supported (API backed) | Supported (API backed via working-tree fix) | ✅ Parity Restored | Mobile uncommitted changes connected self-cancellation to `api.cancelOrder()` with loading state. |
| **Loyalty Coins** | Supported | Supported | ✅ High Parity | Token balance is fetched from `/api/user/tokens` and displayed in profile. |
| **Barcode Scanning** | SVG preview, thermal label print, picking slip (`/admin/orders/[id]`) | Native Expo camera scanner (`/scanner`) triggered from `/search` | ✅ High Parity | Unified Code 128 / EAN-13 symbology. Mobile scans barcodes for storefront lookup; Web renders and prints picking slips. Authenticated customers receive sanitized storefront view (no shortage leakage). |
| **Admin Operations** | Supported (`/admin/*`) | Not Supported | ℹ️ Web Only by Design | The admin operations dashboard is exclusively accessible via the web portal. |
| **Offline / Fallback** | `localStorage` Zustand state | `AsyncStorage` + Hardcoded Mocks (`lib/data.ts`) | ⚠️ Risk Area | When network is unavailable, mobile falls back to static seed data, which may drift from database. |

---

## 2. Key Technical Divergences & Parity Risks

### A. Authentication & Session Architecture
- **Web App**:
  - Leverages **NextAuth.js v5 (Auth.js)**.
  - Authentication state is maintained via cryptographically signed HTTP-only JWT cookies (`authjs.session-token`).
  - Server-side routes automatically resolve the authenticated user via `auth()`.
- **Mobile App**:
  - Leverages native SDKs: `@react-native-google-signin/google-signin` and `expo-truecaller`.
  - Sends verified tokens or OAuth codes to specialized backend handlers:
    - Google ID Token → `POST /api/auth/google-native`
    - Truecaller Auth Code → `POST /api/auth/truecaller`
    - Email OTP → `POST /api/auth/verify-otp`
  - Stores user profile and tokens in `AsyncStorage` under `qc-auth-mobile`.
  - **Parity Risk**: Mobile requests to standard endpoints (e.g. `GET /api/orders`) do not carry NextAuth session cookies. Endpoints must accept identity query params (`?email=...&phone=...`) or custom headers. If query parameters are used without request signing, account spoofing is possible.

### B. Fee Discrepancies & Working-Tree Alignment
- **Historical Inconsistency**: Previously, `Mobile-app/app/(tabs)/cart.tsx`, `checkout.tsx`, and `components/BillSummary.tsx` had a hardcoded platform fee of ₹5 (`500` paise), while the database and web storefront charged ₹2 (`200` paise).
- **Working-Tree Status**: The uncommitted changes in the working tree updated the mobile fee to `200` paise, restoring financial calculation parity across web and mobile.

### C. Order Cancellation Synchronization
- **Historical Inconsistency**: The mobile order details screen previously cancelled orders purely in local Zustand store memory (`cancelOrderInStore(order.id)`) without making a network call to the database.
- **Working-Tree Status**: The uncommitted changes in `Mobile-app/app/order-details/[id].tsx` and `Mobile-app/lib/api.ts` implement server-backed cancellation:
  ```typescript
  const res = await api.cancelOrder(order.id, user?.email, user?.phone);
  if (res.success && res.order) {
    useShopStore.getState().upsertOrder(res.order);
  }
  ```
  This restores stock and loyalty tokens on the server and updates local mobile state via `upsertOrder()`.

### D. Offline Fallback & Mock Data Drift
- In `Mobile-app/lib/api.ts`, if any API request times out (`fetchWithTimeout` 15s) or fails, the client falls back to `Mobile-app/lib/data.ts` (e.g. hardcoded categories, coupons, and config).
- **Parity Risk**: If an admin updates category names, adds new categories, or alters delivery fees in the database, a mobile user on a spotty connection will see stale or different hardcoded data from `data.ts`.

### E. Barcode Scanning Contract & Role-Based Response Filtering
- **Customer Surface (`Mobile-app/app/scanner.tsx`)**:
  - Requires signed-in account (`CUSTOMER` or `ADMIN`). If unauthenticated, mobile renders an in-app "Sign In Required" prompt rather than failing cryptically.
  - Queries `GET /api/products/barcode/[code]` with authentication headers.
  - Returns strictly safe storefront product fields: `id`, `name`, `slug`, `price`, `mrp`, `image`/`imageUrl`, `emoji`, `unit`, `availability` (`IN_STOCK` / `OUT_OF_STOCK`), `isAvailable`.
  - **Zero Warehouse Shortage Leakage**: Customers only see "In Stock" or "Out of Stock". Dark-store negative counts (`stockQty < 0`) and exact physical quantities are completely withheld.
- **Admin Warehouse Surface**:
  - Warehouse pickers and admins logged in as `ADMIN` receive complete internal data (`stockQty`, dark-store shortage badges, `itemCode`, `barcode`, `barcodeSymbology`, and audit metadata).
- **Abuse Prevention**:
  - Rate-limited to 60 requests/minute per authenticated user to eliminate catalog scanning abuse.

---

## 3. Current Implementation vs. Planned Implementation vs. Known Limitations

### Current Implementation
- Full shopping experience (home, search, product detail, cart, checkout, orders) is implemented on both platforms.
- Working-tree updates align pricing (₹2 platform fee) and connect mobile cancellation to the server.
- Mobile builds are automated for Android APK and Google Play AAB via GitHub Actions.

### Planned Implementation
- **Unified Auth Token**: Replace query-based identification with an `Authorization: Bearer <JWT>` header issued by the backend upon login.
- **Dynamic Configuration Sync**: Enforce that the mobile app fetches `/api/config` on launch and caches the result, alerting the user if offline rather than silently falling back to outdated static constants.
- **Push Notifications**: Integrate Expo Push Notifications / Firebase Cloud Messaging (FCM) to notify mobile users when order status changes (`CONFIRMED`, `OUT_FOR_DELIVERY`, `DELIVERED`).

### Known Limitations
- **Query-Param Auth on Mobile**: Endpoints like `GET /api/orders?email=...&phone=...` trust unauthenticated client query parameters to return customer order records.
- **No Push Notification Infrastructure**: Mobile customers must manually refresh the order details screen to check delivery status.

---

## 4. Documentation Maintenance Rule

> [!IMPORTANT]
> **Documentation Maintenance Rule**:
> Any change to mobile app screens, store fees, authentication hooks, or backend endpoints consumed by mobile must be cross-verified against the web implementation, documented in this matrix, and logged in `docs/CHANGELOG.md`.
