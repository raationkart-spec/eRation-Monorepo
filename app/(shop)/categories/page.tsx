"use client";
import Link from "next/link";
import { useCatalog } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { Skel } from "@/components/skeletons";
import { ProductImage } from "@/components/ProductImage";

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
            <Skel key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  const active = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="content-in">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900 tracking-tight">Explore Categories</h1>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {active.map((c) => {
          const count = products.filter(
            (p) => p.categorySlug === c.slug && p.isActive
          ).length;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-2xs group-hover:scale-105 transition-transform">
                {c.imageUrl ? (
                  <ProductImage
                    imageUrl={c.imageUrl}
                    emoji={c.emoji}
                    alt={c.name}
                    className="h-full w-full"
                  />
                ) : (
                  <span className="text-4xl select-none">{c.emoji}</span>
                )}
              </div>
              <span className="text-center text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                {c.name}
              </span>
              <span className="text-2xs font-semibold text-slate-400">{count} items</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
