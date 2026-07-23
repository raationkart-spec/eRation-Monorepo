# QuickCart — Zepto-style Grocery App (Demo Build)

A working, **demo-ready** grocery commerce app built from the PRD. It runs with
**zero environment variables and no database** — all data lives in a seeded
in-browser mock store (localStorage), so you can show it to stakeholders
immediately.

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

## What works (demo flows)

### Storefront (`/`)
- **Home** — auto-playing banners, category chips, featured product sections
- **Categories** (`/categories`) and **Category** pages with sort + in-stock filter
- **Product detail** — gallery, price/MRP/discount, stock, add-to-cart, related items
- **Search** (`/search?q=milk`) — searches names, tags, brands
- **Cart** — quantity steppers, live bill, free-delivery threshold nudge
- **Login** — phone OTP (**any 6-digit code works**) or one-tap Google (demo)
- **Checkout** — address select, COD, serviceability check, place order
- **Orders** — history list + detail with a live status timeline; self-cancel
- **Account** — profile, editable name, address book (add / delete / set default)

### Admin (`/admin`)
- **Dashboard** — today's orders/revenue, pending, low-stock alerts, recent orders
- **Products** — list/search, create, edit, hide, live stock adjustment
- **Categories** — create / edit / show-hide
- **Orders** — filter by status, advance status through the order state machine,
  cancel (auto-marks COD collected on delivery)
- **Banners** — create/edit homepage banners with colour + icon
- **Settings** — store info, delivery fee, free-delivery threshold, serviceable
  pincodes, and a **"Reset demo data"** button

### Try this end-to-end demo
1. Add a few products to the cart from the home page.
2. Go to **Cart → Checkout** (log in with any phone + any 6-digit OTP).
3. Place the order (COD). You'll land on the order timeline.
4. Open **/admin → Orders**, advance the order to *Delivered*.
5. Back on the storefront order page, the timeline and payment status update.

> Serviceable pincodes include **560001** (the seeded demo address uses it).

## How the "dummy" mode works

- No Neon/Prisma/Better-Auth/Cloudflare/R2 — those need real credentials.
- Catalog, cart, auth, addresses, orders, and admin edits are Zustand stores
  persisted to `localStorage`. Admin edits reflect on the storefront live.
- Product images are emoji placeholders (no R2/CDN needed).
- Design tokens, screen map, order state machine, money-in-paise, and COD flow
  all follow the PRD.

## Going to production later
The real architecture from the PRD (Turborepo, Neon Postgres + Prisma, Better
Auth with Google + MSG91 OTP, Cloudflare Workers + R2, Resend email) can be
layered in by swapping the Zustand stores for API route handlers backed by the
Prisma schema. The UI, types, and flows are already aligned to that spec.
