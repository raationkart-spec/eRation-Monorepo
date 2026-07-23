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
    <div className="content-in">
      <div className="mb-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <span>{category.emoji}</span>
          {category.name}
        </h1>
        <p className="text-sm text-ink-muted">{list.length} products</p>
      </div>

      <div className="sticky top-[104px] z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-surface-border bg-white px-4 py-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-surface-border bg-white px-2.5 py-1.5 text-sm font-medium"
        >
          <option value="popular">Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
        <button
          onClick={() => setInStockOnly((v) => !v)}
          className={`rounded-md border px-2.5 py-1.5 text-sm font-medium ${
            inStockOnly
              ? "border-brand bg-brand-50 text-brand-dark"
              : "border-surface-border text-ink-muted"
          }`}
        >
          In stock
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState emoji="📦" title="No products here yet" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
