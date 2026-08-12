"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BANNERS,
  CATEGORIES,
  DEFAULT_CONFIG,
  PRODUCTS,
  SERVICEABLE_PINCODES,
} from "./data";
import type {
  Address,
  Banner,
  CartItem,
  Category,
  Coupon,
  Order,
  OrderStatus,
  Product,
  User,
} from "./types";

// ─────────────────────────────────────────────────────────────
// AUTH — fake login. Any 6-digit OTP works; Google is one-tap.
// ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  loginWithEmail: (email: string) => void;
  loginWithGoogle: () => void;
  loginAsAdmin: (email: string) => void;
  logout: () => void;
  updateName: (name: string) => void;
  setEmail: (email: string) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      loginWithEmail: (email) =>
        set({
          user: {
            id: "u_" + Date.now(),
            name: email.split("@")[0],
            email,
            role: "CUSTOMER",
          },
        }),
      loginWithGoogle: () =>
        set({
          user: {
            id: "u_google_demo",
            name: "Demo Shopper",
            email: "demo.shopper@gmail.com",
            phone: "+91 90000 00000",
            role: "CUSTOMER",
            image: "",
          },
        }),
      loginAsAdmin: (email) =>
        set({
          user: {
            id: "admin_demo",
            name: "Store Admin",
            email,
            role: "ADMIN",
          },
        }),
      logout: () => set({ user: null }),
      updateName: (name) =>
        set((s) => (s.user ? { user: { ...s.user, name } } : s)),
      setEmail: (email) =>
        set((s) => (s.user ? { user: { ...s.user, email } } : s)),
    }),
    { name: "qc-auth" }
  )
);

// ─────────────────────────────────────────────────────────────
// CATALOG — mutable copies so admin edits reflect on storefront.
// ─────────────────────────────────────────────────────────────
interface CatalogState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  config: typeof DEFAULT_CONFIG;
  pincodes: string[];
  coupons: Coupon[];
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, changeQty: number) => void;
  upsertCategory: (c: Category) => void;
  upsertBanner: (b: Banner) => void;
  deleteBanner: (id: string) => void;
  upsertCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;
  setConfig: (c: Partial<typeof DEFAULT_CONFIG>) => void;
  addPincodes: (codes: string[]) => void;
  removePincode: (code: string) => void;
  resetCatalog: () => void;
}

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "c_welcome20",
    code: "WELCOME20",
    description: "20% off on your first order above ₹299",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderValue: 29900,
    maxDiscount: 10000,
    usedCount: 14,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "c_flat50",
    code: "QUICK50",
    description: "Flat ₹50 off on orders above ₹499",
    discountType: "FLAT",
    discountValue: 5000,
    minOrderValue: 49900,
    usedCount: 28,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const useCatalog = create<CatalogState>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      categories: CATEGORIES,
      banners: BANNERS,
      config: DEFAULT_CONFIG,
      pincodes: SERVICEABLE_PINCODES,
      coupons: INITIAL_COUPONS,
      upsertProduct: (p) =>
        set((s) => {
          const exists = s.products.some((x) => x.id === p.id);
          return {
            products: exists
              ? s.products.map((x) => (x.id === p.id ? p : x))
              : [...s.products, p],
          };
        }),
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.map((x) =>
            x.id === id ? { ...x, isActive: false } : x
          ),
        })),
      adjustStock: (id, changeQty) =>
        set((s) => ({
          products: s.products.map((x) =>
            x.id === id
              ? { ...x, stockQty: Math.max(0, x.stockQty + changeQty) }
              : x
          ),
        })),
      upsertCategory: (c) =>
        set((s) => {
          const exists = s.categories.some((x) => x.id === c.id);
          return {
            categories: exists
              ? s.categories.map((x) => (x.id === c.id ? c : x))
              : [...s.categories, c],
          };
        }),
      upsertBanner: (b) =>
        set((s) => {
          const exists = s.banners.some((x) => x.id === b.id);
          return {
            banners: exists
              ? s.banners.map((x) => (x.id === b.id ? b : x))
              : [...s.banners, b],
          };
        }),
      deleteBanner: (id) =>
        set((s) => ({ banners: s.banners.filter((x) => x.id !== id) })),
      upsertCoupon: (c) =>
        set((s) => {
          const exists = (s.coupons || []).some((x) => x.id === c.id);
          return {
            coupons: exists
              ? s.coupons.map((x) => (x.id === c.id ? c : x))
              : [...(s.coupons || []), c],
          };
        }),
      deleteCoupon: (id) =>
        set((s) => ({ coupons: (s.coupons || []).filter((x) => x.id !== id) })),
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      addPincodes: (codes) =>
        set((s) => ({
          pincodes: Array.from(new Set([...s.pincodes, ...codes])),
        })),
      removePincode: (code) =>
        set((s) => ({ pincodes: s.pincodes.filter((x) => x !== code) })),
      resetCatalog: () =>
        set({
          products: PRODUCTS,
          categories: CATEGORIES,
          banners: BANNERS,
          config: DEFAULT_CONFIG,
          pincodes: SERVICEABLE_PINCODES,
          coupons: INITIAL_COUPONS,
        }),
    }),
    { name: "qc-catalog", version: 4 }
  )
);

// ─────────────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  setQty: (productId: string, quantity: number) => void;
  add: (productId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setQty: (productId, quantity) =>
        set((s) => {
          if (quantity <= 0)
            return { items: s.items.filter((i) => i.productId !== productId) };
          const exists = s.items.some((i) => i.productId === productId);
          return {
            items: exists
              ? s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                )
              : [...s.items, { productId, quantity }],
          };
        }),
      add: (productId) =>
        set((s) => {
          const item = s.items.find((i) => i.productId === productId);
          if (item)
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: Math.min(20, i.quantity + 1) }
                  : i
              ),
            };
          return { items: [...s.items, { productId, quantity: 1 }] };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "qc-cart" }
  )
);

// ─────────────────────────────────────────────────────────────
// SHOP — addresses + orders
// ─────────────────────────────────────────────────────────────
interface ShopState {
  addresses: Address[];
  orders: Order[];
  addAddress: (a: Omit<Address, "id">) => Address;
  updateAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  cancelOrder: (id: string) => void;
}

const seedAddress: Address = {
  id: "addr_demo",
  label: "Home",
  name: "Demo Shopper",
  phone: "9000000000",
  line1: "142, Hill Cart Road",
  line2: "Pradhan Nagar",
  landmark: "Near Air View Complex",
  city: "Siliguri",
  state: "West Bengal",
  pincode: "734001",
  isDefault: true,
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      addresses: [],
      orders: [],
      addAddress: (a) => {
        const addr: Address = { ...a, id: "addr_" + Date.now() };
        set((s) => ({
          addresses: addr.isDefault
            ? [
                ...s.addresses.map((x) => ({ ...x, isDefault: false })),
                addr,
              ]
            : [...s.addresses, addr],
        }));
        return addr;
      },
      updateAddress: (a) =>
        set((s) => ({
          addresses: s.addresses.map((x) => (x.id === a.id ? a : x)),
        })),
      deleteAddress: (id) =>
        set((s) => ({ addresses: s.addresses.filter((x) => x.id !== id) })),
      setDefaultAddress: (id) =>
        set((s) => ({
          addresses: s.addresses.map((x) => ({
            ...x,
            isDefault: x.id === id,
          })),
        })),
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      updateOrderStatus: (id, status, note) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  deliveredAt:
                    status === "DELIVERED"
                      ? new Date().toISOString()
                      : o.deliveredAt,
                  paymentStatus:
                    status === "DELIVERED" ? "COLLECTED" : o.paymentStatus,
                  statusHistory: [
                    ...o.statusHistory,
                    { status, note, at: new Date().toISOString() },
                  ],
                }
              : o
          ),
        })),
      cancelOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && o.status === "PLACED"
              ? {
                  ...o,
                  status: "CANCELLED",
                  statusHistory: [
                    ...o.statusHistory,
                    {
                      status: "CANCELLED",
                      note: "Cancelled by customer",
                      at: new Date().toISOString(),
                    },
                  ],
                }
              : o
          ),
        })),
    }),
    { name: "qc-shop" }
  )
);

export { makeOrderNumber } from "./orderNumber";

// ─────────────────────────────────────────────────────────────
// LOCATION — Pincode auto-detection & location management
// ─────────────────────────────────────────────────────────────
interface LocationState {
  pincode: string;
  city: string;
  isDetecting: boolean;
  setPincode: (pincode: string, city?: string) => void;
  detectLocation: () => Promise<{ pincode: string; city: string } | null>;
}

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      pincode: "734001",
      city: "Siliguri",
      isDetecting: false,
      setPincode: (pincode, city = "Siliguri Area") => set({ pincode, city }),
      detectLocation: async () => {
        set({ isDetecting: true });
        return new Promise((resolve) => {
          if (typeof window === "undefined" || !navigator.geolocation) {
            set({ isDetecting: false });
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                );
                const data = await res.json();
                const postcode = data.address?.postcode?.replace(/\s/g, "");
                const city =
                  data.address?.city ||
                  data.address?.town ||
                  data.address?.suburb ||
                  data.address?.state ||
                  "Siliguri";
                const finalPin = postcode && /^\d{6}$/.test(postcode) ? postcode : "734001";
                set({ pincode: finalPin, city, isDetecting: false });
                resolve({ pincode: finalPin, city });
              } catch {
                set({ pincode: "734001", city: "Siliguri", isDetecting: false });
                resolve({ pincode: "734001", city: "Siliguri" });
              }
            },
            () => {
              set({ isDetecting: false });
              resolve(null);
            },
            { timeout: 8000 }
          );
        });
      },
    }),
    { name: "qc-location" }
  )
);

