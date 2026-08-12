"use client";
import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { useToast } from "./toast";
import type { Bundle } from "@/lib/types";

export function ChefsChoiceBundle() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const show = useToast((s) => s.show);

  useEffect(() => {
    fetch("/api/bundles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.bundles)) setBundles(data.bundles);
      })
      .catch(() => {});
  }, []);

  if (bundles.length === 0) return null;

  const addBundle = (bundle: Bundle) => {
    const originalTotal = bundle.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
    const ratio = originalTotal > 0 ? bundle.price / originalTotal : 1;

    let cumulativeDiscountedPriceSum = 0;
    bundle.items.forEach((item, index) => {
      let discountedUnitPrice = Math.round(item.product.price * ratio);
      if (index === bundle.items.length - 1) {
        const previousTotal = cumulativeDiscountedPriceSum;
        discountedUnitPrice = Math.max(0, Math.floor((bundle.price - previousTotal) / item.quantity));
      }
      cumulativeDiscountedPriceSum += discountedUnitPrice * item.quantity;

      const existingQty = items.find((i) => i.productId === item.productId)?.quantity ?? 0;
      setQty(item.productId, existingQty + item.quantity, discountedUnitPrice);
    });
    show(`${bundle.name} added to cart for ${formatMoney(bundle.price)}! 🍳`);
  };

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-lg font-bold text-slate-900">
        <UtensilsCrossed size={18} className="text-orange-600" /> Chef's Choice
      </h3>
      <div className="space-y-3">
        {bundles.map((bundle) => {
          const originalTotal = bundle.items.reduce(
            (sum, i) => sum + i.product.price * i.quantity,
            0
          );
          const savePercent =
            originalTotal > bundle.price
              ? Math.round(((originalTotal - bundle.price) / originalTotal) * 100)
              : 0;
          return (
            <div
              key={bundle.id}
              className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-4 shadow-[0_8px_24px_-8px_rgba(234,88,12,0.15)]"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-orange-50" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                  <ProductImage
                    imageUrl={bundle.imageUrl ?? bundle.items[0]?.product.imageUrl}
                    emoji={bundle.items[0]?.product.emoji ?? "🍽️"}
                    alt={bundle.name}
                    className="h-full w-full"
                    size="text-4xl"
                  />
                </div>
                <div className="min-w-0">
                  {(bundle.tag || savePercent > 0) && (
                    <span className="mb-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-2xs font-bold text-orange-800">
                      {bundle.tag || `Bundle Save ${savePercent}%`}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-slate-900">{bundle.name}</h4>
                  {bundle.description && (
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{bundle.description}</p>
                  )}
                </div>
              </div>
              <div className="relative z-10 mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="text-base font-black text-orange-600">{formatMoney(bundle.price)}</span>
                  {originalTotal > bundle.price && (
                    <span className="ml-2 text-xs text-slate-400 line-through">
                      {formatMoney(originalTotal)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => addBundle(bundle)}
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                >
                  ADD BUNDLE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
