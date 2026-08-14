import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Address, Order, OrderStatus } from "../lib/types";

interface ShopState {
  addresses: Address[];
  orders: Order[];
  appliedCoupon: { code: string; discount: number } | null;
  setAppliedCoupon: (coupon: { code: string; discount: number } | null) => void;
  addAddress: (a: Omit<Address, "id">) => Address;
  updateAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  cancelOrder: (id: string) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      addresses: [],
      orders: [],
      appliedCoupon: null,
      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon }),
      addAddress: (a) => {
        const addr: Address = { ...a, id: "addr_" + Date.now() };
        set((s) => ({
          addresses: addr.isDefault
            ? [...s.addresses.map((x) => ({ ...x, isDefault: false })), addr]
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
    {
      name: "qc-shop-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
