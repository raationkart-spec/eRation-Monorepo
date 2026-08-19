"use client";
import { useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { Skel } from "@/components/skeletons";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { discountPercent, formatMoney } from "@/lib/format";

export default function CategoriesPage() {
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);

  const activeCats = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [selectedSlug, setSelectedSlug] = useState<string>(
    activeCats[0]?.slug ?? "fruits-vegetables"
  );

  if (!hydrated)
    return (
      <div className="space-y-4 p-4">
        <Skel className="h-7 w-48" />
        <div className="flex gap-4">
          <Skel className="h-80 w-24 rounded-2xl" />
          <Skel className="h-80 flex-1 rounded-2xl" />
        </div>
      </div>
    );

  const currentCategory = activeCats.find((c) => c.slug === selectedSlug) ?? activeCats[0];
  const catProducts = products.filter(
    (p) => p.categorySlug === currentCategory?.slug && p.isActive
  );

  return (
    <div className="fixed inset-x-0 top-16 bottom-16 z-10 flex overflow-hidden bg-slate-50">
      {/* Fixed Independent Sidebar Scroll Container matching Stitch browse_categories.html */}
      <aside className="h-full w-24 shrink-0 overflow-y-auto no-scrollbar border-r border-slate-200/80 bg-white p-2 space-y-2 shadow-xs">
        {activeCats.map((c) => {
          const isSel = (currentCategory?.slug ?? selectedSlug) === c.slug;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedSlug(c.slug)}
              className={`flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all active:scale-95 ${
                isSel
                  ? "bg-orange-500/10 text-orange-600 font-extrabold shadow-2xs border border-orange-200/60"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-50">
                {c.imageUrl ? (
                  <ProductImage
                    imageUrl={c.imageUrl}
                    emoji={c.emoji}
                    alt={c.name}
                    className="h-full w-full"
                  />
                ) : (
                  <span className="text-2xl select-none">{c.emoji}</span>
                )}
              </div>
              <span className="text-center text-2xs font-bold leading-tight line-clamp-2">
                {c.name}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Fixed Independent Main Items Scroll Container matching Stitch */}
      <main className="h-full flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {currentCategory?.name}
            </h2>
            <p className="text-2xs font-semibold text-slate-400">Fresh items delivered in 10 mins</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-extrabold text-slate-500">
            {catProducts.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {catProducts.map((p) => {
            const discount = discountPercent(p.mrp, p.price);
            return (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md transition-all"
              >
                <Link href={`/product/${p.slug}`} className="relative block overflow-hidden rounded-xl bg-slate-50">
                  {discount > 0 && (
                    <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-red-600 px-2 py-0.5 text-2xs font-black text-white shadow-sm">
                      {discount}% OFF
                    </span>
                  )}
                  <ProductImage
                    imageUrl={p.imageUrl}
                    emoji={p.emoji}
                    alt={p.name}
                    className="aspect-square rounded-xl transition-transform duration-300 group-hover:scale-105"
                    size="text-5xl"
                  />
                </Link>

                <div className="mt-2.5 flex flex-1 flex-col justify-between">
                  <div>
                    {p.brand && (
                      <span className="text-2xs font-extrabold uppercase text-slate-400 tracking-wider">
                        {p.brand}
                      </span>
                    )}
                    <Link href={`/product/${p.slug}`}>
                      <h3 className="line-clamp-2 min-h-[32px] text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-2xs font-medium text-slate-400">{p.unit}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900">
                        {formatMoney(p.price)}
                      </span>
                      {discount > 0 && (
                        <span className="block text-2xs text-slate-400 line-through">
                          {formatMoney(p.mrp)}
                        </span>
                      )}
                    </div>
                    <div className="w-20">
                      <AddToCartButton product={p} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
