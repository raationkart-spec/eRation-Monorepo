"use client";
import { use, useState } from "react";
import { useCatalog } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/misc";
import { CategorySkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { Product } from "@/lib/types";

type Sort = "popular" | "price_asc" | "price_desc" | "newest";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);
  const [sort, setSort] = useState<Sort>("popular");
  const [inStockOnly, setInStockOnly] = useState(false);

  if (!hydrated) return <CategorySkeleton />;

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return (
      <EmptyState
        emoji="🔍"
        title="Category not found"
        ctaLabel="Back to home"
        ctaHref="/"
      />
    );
  }

  let list: Product[] = products.filter(
    (p) => p.categorySlug === slug && p.isActive
  );
  if (inStockOnly) list = list.filter((p) => p.stockQty > 0);

  list = [...list].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "newest":
        return b.sortOrder - a.sortOrder;
      default:
        return a.sortOrder - b.sortOrder || b.stockQty - a.stockQty;
    }
  });

  return (
    <div className="content-in max-w-2xl mx-auto pb-28">
      <div className="mb-3 pt-2">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 tracking-tight">
          <span className="select-none">{category.emoji}</span>
          {category.name}
        </h1>
        <p className="text-2xs font-semibold text-slate-400">Fresh items delivered all across Siliguri</p>
      </div>

      {/* Sticky Filter Bar pinned directly under top header (top-14) */}
      <div className="sticky top-14 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-2xs">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 transition"
        >
          <option value="popular">Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>

        <button
          onClick={() => setInStockOnly((v) => !v)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
            inStockOnly
              ? "border-orange-200 bg-orange-50 text-orange-600 shadow-2xs"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          In stock
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState emoji="📦" title="No products here yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
