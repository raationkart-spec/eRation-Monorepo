"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/misc";
import { ProductGridSkeleton, Skel } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);

  if (!hydrated)
    return (
      <div>
        <Skel className="h-6 w-40" />
        <Skel className="mb-3 mt-2 h-4 w-24" />
        <ProductGridSkeleton count={6} />
      </div>
    );

  const results = q
    ? products.filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(q) ||
            p.tags.some((t) => t.includes(q)) ||
            p.brand?.toLowerCase().includes(q))
      )
    : [];

  const popularTags = ["Milk", "Mangoes", "Atta", "Bread", "Paneer", "Organic", "Snacks"];
  const featuredPicks = products.filter((p) => p.isFeatured && p.isActive).slice(0, 6);

  return (
    <div className="content-in pb-24">
      {q ? (
        <>
          <h1 className="mb-1 text-xl font-black text-slate-900">
            Results for &quot;{q}&quot;
          </h1>
          <p className="mb-4 text-2xs font-semibold text-slate-400">
            {results.length} {results.length === 1 ? "product" : "products"} found
          </p>
          {results.length === 0 ? (
            <EmptyState
              emoji="🔎"
              title={`No results for "${q}"`}
              subtitle="Try searching for milk, bread, or mangoes"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2.5 text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Popular Searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <a
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition"
                >
                  🔍 {tag}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-black text-slate-900">Trending Right Now</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featuredPicks.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
