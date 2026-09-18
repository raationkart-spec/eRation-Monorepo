import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Product } from "../lib/types";

interface CartState {
  items: CartItem[];
  setQty: (productId: string, quantity: number, product?: Product, overridePrice?: number) => void;
  add: (productId: string, product?: Product, dealId?: string, overridePrice?: number, bundleId?: string) => void;
  clear: () => void;
  pruneInvalidItems: (validProductIds: string[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setQty: (productId, quantity, product, overridePrice) =>
        set((s) => {
          if (quantity <= 0)
            return { items: s.items.filter((i) => i.productId !== productId) };
          const exists = s.items.some((i) => i.productId === productId);
          return {
            items: exists
              ? s.items.map((i) =>
                  i.productId === productId
                    ? {
                        ...i,
                        quantity,
                        product: product ?? i.product,
                        overridePrice: overridePrice ?? i.overridePrice,
                      }
                    : i
                )
              : [...s.items, { productId, quantity, product, overridePrice }],
          };
        }),
      add: (productId, product, dealId, overridePrice, bundleId) =>
        set((s) => {
          const item = s.items.find((i) => i.productId === productId);
          if (item)
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? {
                      ...i,
                      quantity: Math.min(20, i.quantity + 1),
                      product: product ?? i.product,
                      dealId: dealId ?? i.dealId,
                      overridePrice: overridePrice ?? i.overridePrice,
                      bundleId: bundleId ?? i.bundleId,
                    }
                  : i
              ),
            };
          return {
            items: [
              ...s.items,
              { productId, quantity: 1, product, dealId, overridePrice, bundleId },
            ],
          };
        }),
      clear: () => set({ items: [] }),
      pruneInvalidItems: (validProductIds) =>
        set((s) => ({
          items: s.items.filter((i) => validProductIds.includes(i.productId)),
        })),
    }),
    {
      name: "qc-cart-mobile",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return { items: [] };
        }
        return persistedState as CartState;
      },
    }
  )
);
