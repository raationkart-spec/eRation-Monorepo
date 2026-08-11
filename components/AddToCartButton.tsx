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
          "w-full rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-400 cursor-not-allowed",
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
          "w-full animate-scale-in rounded-xl border border-emerald-300 bg-emerald-50/90 font-extrabold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 active:scale-95 shadow-sm",
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
        "flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 font-bold text-white shadow-sm",
        dims
      )}
    >
      <button
        aria-label="Decrease"
        onClick={() => setQty(product.id, qty - 1)}
        className="flex h-full flex-1 items-center justify-center transition active:scale-75 hover:bg-black/10 rounded-l-xl"
      >
        <Minus size={size === "sm" ? 14 : 16} />
      </button>
      <span className="tabular-nums font-extrabold px-1 text-sm">{qty}</span>
      <button
        aria-label="Increase"
        onClick={() =>
          qty >= product.stockQty
            ? show(`Only ${product.stockQty} in stock`)
            : setQty(product.id, qty + 1)
        }
        className="flex h-full flex-1 items-center justify-center transition active:scale-75 hover:bg-black/10 rounded-r-xl"
      >
        <Plus size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
