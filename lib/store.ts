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
  loginWithPhone: (phone: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  updateName: (name: string) => void;
  setEmail: (email: string) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginWithPhone: (phone) =>
        set({
          user: {
            id: "u_" + phone.replace(/\D/g, ""),
            name: "Guest User",
            phone,
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
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, changeQty: number) => void;
  upsertCategory: (c: Category) => void;
  upsertBanner: (b: Banner) => void;
  deleteBanner: (id: string) => void;
  setConfig: (c: Partial<typeof DEFAULT_CONFIG>) => void;
  addPincodes: (codes: string[]) => void;
  removePincode: (code: string) => void;
  resetCatalog: () => void;
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      categories: CATEGORIES,
      banners: BANNERS,
      config: DEFAULT_CONFIG,
      pincodes: SERVICEABLE_PINCODES,
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
        }),
    }),
    { name: "qc-catalog", version: 3 }
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
  line1: "42, Green Residency",
  line2: "MG Road",
  landmark: "Near Metro Station",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  isDefault: true,
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      addresses: [seedAddress],
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

// ─── Order number generator: QC-YYYYMMDD-NNNN ───
export function makeOrderNumber(seq: number): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `QC-${dateStr}-${String(seq).padStart(4, "0")}`;
}
