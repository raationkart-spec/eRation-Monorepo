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
    if (status === "authenticated") {
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
          if (items.length > 0) {
            setFrequent(items);
            return;
          }
        })
        .catch(() => {});
    }
  }, [status, products]);

  // Fallback to daily essentials if no order history
  const displayItems =
    frequent.length > 0
      ? frequent
      : products.filter((p) => p.isFeatured || p.categorySlug === "dairy-eggs" || p.categorySlug === "bakery-breads").slice(0, 8);

  if (displayItems.length === 0) return null;

  return (
    <section className="my-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-base sm:text-lg font-black text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <History size={17} />
          </span>
          Buy it Again
        </h3>
        <span className="text-2xs font-extrabold uppercase text-slate-400 tracking-wider">
          Frequent Picks
        </span>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-1">
        {displayItems.map((p) => (
          <div
            key={p.id}
            className="group relative flex w-32 shrink-0 snap-start flex-col justify-between rounded-2xl border border-orange-200/60 bg-white p-2.5 shadow-xs hover:border-orange-400 hover:shadow-md transition-all"
          >
            <Link
              href={`/product/${p.slug}`}
              className="relative mb-2 block aspect-square w-full overflow-hidden rounded-xl bg-orange-50/50 p-2"
            >
              <ProductImage
                imageUrl={p.imageUrl}
                emoji={p.emoji}
                alt={p.name}
                className="h-full w-full object-contain mix-blend-multiply"
                size="text-3xl"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  add(p.id);
                  show(`${p.name} added to cart 🛒`);
                }}
                aria-label={`Add ${p.name}`}
                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white shadow-md transition-all hover:bg-orange-700 active:scale-90"
              >
                <Plus size={16} />
              </button>
            </Link>

            <div className="space-y-0.5">
              <h4 className="line-clamp-1 text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                {p.name}
              </h4>
              <p className="text-2xs font-medium text-slate-400 truncate">{p.unit}</p>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-black text-orange-600">{formatMoney(p.price)}</span>
                {p.mrp > p.price && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatMoney(p.mrp)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
