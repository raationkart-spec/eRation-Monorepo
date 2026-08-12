"use client";
import { use, useState } from "react";
import { useCatalog } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/misc";
import { CategorySkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import { FilterBar, type SortOption } from "@/components/FilterBar";
import type { Product } from "@/lib/types";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);
  const [sort, setSort] = useState<SortOption>("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [under99, setUnder99] = useState(false);
  const [discountedOnly, setDiscountedOnly] = useState(false);

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
  if (under99) list = list.filter((p) => p.price < 9900);
  if (discountedOnly) list = list.filter((p) => p.mrp > p.price);

  list = [...list].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "discount_desc": {
        const da = a.mrp > 0 ? (a.mrp - a.price) / a.mrp : 0;
        const db = b.mrp > 0 ? (b.mrp - b.price) / b.mrp : 0;
        return db - da;
      }
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

      <FilterBar
        sort={sort}
        onSortChange={setSort}
        inStockOnly={inStockOnly}
        onToggleInStock={() => setInStockOnly((v) => !v)}
        under99={under99}
        onToggleUnder99={() => setUnder99((v) => !v)}
        discountedOnly={discountedOnly}
        onToggleDiscounted={() => setDiscountedOnly((v) => !v)}
      />

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
