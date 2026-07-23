"use client";
import Link from "next/link";
import { useCatalog } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { Skel } from "@/components/skeletons";

export default function CategoriesPage() {
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);

  if (!hydrated)
    return (
      <div>
        <Skel className="h-7 w-48" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skel key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );

  const active = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="content-in">
      <h1 className="mb-3 text-2xl font-bold">Shop by category</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {active.map((c) => {
          const count = products.filter(
            (p) => p.categorySlug === c.slug && p.isActive
          ).length;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-white p-4 shadow-card transition active:scale-[0.98]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-4xl">
                {c.emoji}
              </span>
              <span className="text-center text-sm font-semibold text-ink">
                {c.name}
              </span>
              <span className="text-2xs text-ink-subtle">{count} items</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
