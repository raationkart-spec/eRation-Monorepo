"use client";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useToast } from "./toast";
import clsx from "clsx";

export function AddToCartButton({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const show = useToast((s) => s.show);

  const qty = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const outOfStock = product.stockQty <= 0;

  const dims =
    size === "sm" ? "h-8 text-xs min-w-[76px]" : "h-9 text-sm min-w-[92px]";

  if (outOfStock) {
    return (
      <button
        disabled
        className={clsx(
          "w-full rounded-md border border-surface-border bg-surface-muted font-semibold text-ink-subtle",
          dims
        )}
      >
        Out of stock
      </button>
    );
  }

  if (qty === 0) {
    return (
      <button
        onClick={() => {
          add(product.id);
          show(`${product.name} added to cart`);
        }}
        className={clsx(
          "w-full animate-scale-in rounded-md border border-brand bg-brand-50 font-bold text-brand-dark transition active:scale-[0.97]",
          dims
        )}
      >
        ADD
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "flex w-full items-center justify-between rounded-md bg-brand font-bold text-white",
        dims
      )}
    >
      <button
        aria-label="Decrease"
        onClick={() => setQty(product.id, qty - 1)}
        className="flex h-full flex-1 items-center justify-center active:scale-90"
      >
        <Minus size={size === "sm" ? 14 : 16} />
      </button>
      <span className="tabular-nums">{qty}</span>
      <button
        aria-label="Increase"
        onClick={() =>
          qty >= product.stockQty
            ? show(`Only ${product.stockQty} in stock`)
            : setQty(product.id, qty + 1)
        }
        className="flex h-full flex-1 items-center justify-center active:scale-90"
      >
        <Plus size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
