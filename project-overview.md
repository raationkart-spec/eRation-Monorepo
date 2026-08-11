# Project Overview — QuickCart (Zepto-style Grocery Commerce App)

QuickCart is a full-featured, demo-ready grocery e-commerce web application built on Next.js 15 (App Router) with React 19 and TypeScript, styled with Tailwind CSS. It replicates the core experience of quick-commerce apps like Zepto/Blinkit — customer-facing storefront and a separate admin portal — currently running on a mock in-browser data layer (Zustand + localStorage) so it can be demoed instantly with no backend, database, or environment setup.

## Storefront Features

- Home page with auto-playing promotional banners, category chips, and featured product sections
- Category browsing with sort and in-stock filtering
- Product detail pages (gallery, price/MRP/discount, stock status, related items)
- Search across product names, tags, and brands
- Cart with quantity steppers, live bill summary, and free-delivery threshold nudges
- Login via phone OTP or one-tap Google (demo auth flow)
- Checkout with address selection, serviceability check, and Cash-on-Delivery
- Order history and detail pages with a live status timeline and self-cancel option
- Account management: profile editing and address book (add/delete/set default)

## Admin Portal

- Separate, role-gated login and dashboard
- Dashboard with today's orders/revenue, pending orders, and low-stock alerts
- Product management (create, edit, hide, stock adjustment, search)
- Category management (create/edit/show-hide)
- Order management with status-driven workflow (state machine) and cancellation
- Banner management for homepage promotions
- Store settings (delivery fee, free-delivery threshold, serviceable pincodes) plus a demo-data reset tool

## Architecture Note

The app is structured so the current mock/demo data layer (Zustand stores) can be swapped for a production backend — Postgres + Prisma, real authentication (Google + OTP), cloud file storage, and transactional email — without changing the UI, types, or user flows, since those are already aligned to that target architecture.
