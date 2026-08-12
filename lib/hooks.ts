"use client";
import { useCart, useCatalog } from "./store";
import type { Product } from "./types";

export interface CartLine {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  dealId?: string;
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
  const flashDeals = useCatalog((s) => s.flashDeals);

  const now = Date.now();

  const lines: CartLine[] = items
    .map((i): CartLine | null => {
      const product = products.find((p) => p.id === i.productId);
      if (!product) return null;

      const deal = i.dealId
        ? flashDeals.find(
            (d) =>
              d.id === i.dealId &&
              d.productId === i.productId &&
              new Date(d.endsAt).getTime() > now
          )
        : undefined;
      const unitPrice = deal ? deal.salePrice : product.price;

      return {
        product,
        quantity: i.quantity,
        unitPrice,
        lineTotal: unitPrice * i.quantity,
        dealId: deal?.id,
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
