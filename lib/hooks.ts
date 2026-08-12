"use client";
import { useCart, useCatalog } from "./store";
import type { Product } from "./types";

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartComputed {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  platformFee: number;
  total: number;
  hasIssues: boolean;
}

export function useCartComputed(): CartComputed {
  const items = useCart((s) => s.items);
  const products = useCatalog((s) => s.products);
  const config = useCatalog((s) => s.config);

  const lines: CartLine[] = items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId);
      if (!product) return null;
      return {
        product,
        quantity: i.quantity,
        lineTotal: product.price * i.quantity,
      };
    })
    .filter((x): x is CartLine => x !== null);

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const freeDeliveryAbove = config.free_delivery_above;
  const deliveryFee =
    subtotal === 0 || subtotal >= freeDeliveryAbove ? 0 : config.delivery_fee;
  const platformFee = subtotal === 0 ? 0 : config.platform_fee ?? 0;
  const total = subtotal + deliveryFee + platformFee;
  const hasIssues = lines.some(
    (l) => !l.product.isActive || l.product.stockQty < l.quantity
  );

  return {
    lines,
    itemCount,
    subtotal,
    deliveryFee,
    freeDeliveryAbove,
    platformFee,
    total,
    hasIssues,
  };
}
