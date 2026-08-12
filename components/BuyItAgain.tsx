"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { History, Plus } from "lucide-react";
import { useCart, useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { useToast } from "./toast";
import type { Product } from "@/lib/types";

export function BuyItAgain() {
  const { status } = useSession();
  const products = useCatalog((s) => s.products);
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  const [frequent, setFrequent] = useState<Product[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.orders)) return;
        const countByProduct = new Map<string, number>();
        for (const order of data.orders) {
          for (const item of order.items ?? []) {
            if (!item.productId) continue;
            countByProduct.set(item.productId, (countByProduct.get(item.productId) ?? 0) + item.quantity);
          }
        }
        const ranked = Array.from(countByProduct.entries()).sort((a, b) => b[1] - a[1]);
        const items = ranked
          .map(([productId]) => products.find((p) => p.id === productId))
          .filter((p): p is Product => !!p && p.isActive)
          .slice(0, 10);
        setFrequent(items);
      })
      .catch(() => {});
  }, [status, products]);

  if (status !== "authenticated" || frequent.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-lg font-bold text-slate-900">
        <History size={18} className="text-orange-600" /> Buy it Again
      </h3>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {frequent.map((p) => (
          <div
            key={p.id}
            className="min-w-[112px] shrink-0 snap-start rounded-2xl border border-orange-100 bg-white p-2.5 shadow-sm"
          >
            <Link href={`/product/${p.slug}`} className="relative mb-2 block aspect-square overflow-hidden rounded-xl bg-slate-50 p-1.5">
              <ProductImage imageUrl={p.imageUrl} emoji={p.emoji} alt={p.name} className="h-full w-full" size="text-3xl" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  add(p.id);
                  show(`${p.name} added to cart`);
                }}
                aria-label={`Add ${p.name}`}
                className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white shadow-md transition-transform active:scale-90"
              >
                <Plus size={14} />
              </button>
            </Link>
            <h4 className="line-clamp-1 text-xs font-medium text-slate-900">{p.name}</h4>
            <span className="mt-0.5 block text-sm font-bold text-slate-900">{formatMoney(p.price)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
