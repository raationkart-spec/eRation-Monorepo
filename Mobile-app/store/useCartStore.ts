import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem } from "../lib/types";

interface CartState {
  items: CartItem[];
  setQty: (productId: string, quantity: number, overridePrice?: number) => void;
  add: (productId: string, dealId?: string, overridePrice?: number, bundleId?: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setQty: (productId, quantity, overridePrice) =>
        set((s) => {
          if (quantity <= 0)
            return { items: s.items.filter((i) => i.productId !== productId) };
          const exists = s.items.some((i) => i.productId === productId);
          return {
            items: exists
              ? s.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity, overridePrice: overridePrice ?? i.overridePrice }
                    : i
                )
              : [...s.items, { productId, quantity, overridePrice }],
          };
        }),
      add: (productId, dealId, overridePrice, bundleId) =>
        set((s) => {
          const item = s.items.find((i) => i.productId === productId);
          if (item)
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? {
                      ...i,
                      quantity: Math.min(20, i.quantity + 1),
                      dealId: dealId ?? i.dealId,
                      overridePrice: overridePrice ?? i.overridePrice,
                      bundleId: bundleId ?? i.bundleId,
                    }
                  : i
              ),
            };
          return {
            items: [...s.items, { productId, quantity: 1, dealId, overridePrice, bundleId }],
          };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "qc-cart-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
