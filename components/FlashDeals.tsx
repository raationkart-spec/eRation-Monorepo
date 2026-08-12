"use client";
import { useEffect, useState } from "react";
import { Zap, Clock } from "lucide-react";
import { useCart, useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { useToast } from "./toast";

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(endsAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining <= 0) return "00:00:00";
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function FlashDeals() {
  const flashDeals = useCatalog((s) => s.flashDeals);
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);

  const active = flashDeals.filter((d) => new Date(d.endsAt).getTime() > Date.now());
  const soonestEnd = active.reduce(
    (min, d) => Math.min(min, new Date(d.endsAt).getTime()),
    Infinity
  );
  const countdown = useCountdown(
    Number.isFinite(soonestEnd) ? new Date(soonestEnd).toISOString() : new Date().toISOString()
  );

  if (active.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
          <Zap size={18} className="fill-red-600 text-red-600" /> Flash Deals
        </h3>
        <div className="flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-2xs font-bold text-red-600">
          <Clock size={12} /> {countdown}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {active.map((deal) => {
          const discount = Math.round(
            ((deal.product.price - deal.salePrice) / deal.product.price) * 100
          );
          return (
            <article
              key={deal.id}
              className="relative flex flex-col rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_16px_-6px_rgba(220,38,38,0.08)] transition-shadow hover:shadow-lg"
            >
              {discount > 0 && (
                <span className="absolute right-0 top-0 z-10 rounded-bl-lg rounded-tr-2xl bg-red-600 px-2 py-1 text-2xs font-bold text-white shadow-sm">
                  -{discount}%
                </span>
              )}
              <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-slate-50 p-3">
                <ProductImage
                  imageUrl={deal.product.imageUrl}
                  emoji={deal.product.emoji}
                  alt={deal.product.name}
                  className="h-full w-full"
                  size="text-5xl"
                />
              </div>
              <h4 className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-slate-900">
                {deal.product.name}
              </h4>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <span className="block text-sm font-black text-orange-600">
                    {formatMoney(deal.salePrice)}
                  </span>
                  {deal.product.price > deal.salePrice && (
                    <span className="block text-2xs text-slate-400 line-through">
                      {formatMoney(deal.product.price)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    add(deal.productId, deal.id);
                    show(`${deal.product.name} added to cart`);
                  }}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                >
                  ADD
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
