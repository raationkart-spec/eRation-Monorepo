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

  return (
    <div className="content-in">
      <h1 className="mb-1 text-xl font-bold">
        {q ? `Results for "${q}"` : "Search"}
      </h1>
      {q && (
        <p className="mb-3 text-sm text-ink-muted">{results.length} products</p>
      )}
      {q && results.length === 0 ? (
        <EmptyState
          emoji="🔎"
          title={`No results for "${q}"`}
          subtitle="Try a different keyword"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
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
