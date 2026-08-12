"use client";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Tag, TrendingUp, Leaf, Cookie } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

type StoryId = "new" | "deals" | "trending" | "organic" | "snacks";

const STORIES: {
  id: StoryId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: boolean;
}[] = [
  { id: "new", label: "New Arrivals", icon: Sparkles, gradient: true },
  { id: "deals", label: "Best Deals", icon: Tag, gradient: true },
  { id: "trending", label: "Trending", icon: TrendingUp, gradient: true },
  { id: "organic", label: "Organic", icon: Leaf, gradient: false },
  { id: "snacks", label: "Snacks", icon: Cookie, gradient: false },
];

export function QuickStories() {
  const products = useCatalog((s) => s.products);
  const [active, setActive] = useState<StoryId | null>(null);
  const [trending, setTrending] = useState<Product[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  useEffect(() => {
    if (active !== "trending" || trending.length > 0) return;
    setLoadingTrending(true);
    fetch("/api/products/trending")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.products)) setTrending(data.products);
      })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));
  }, [active, trending.length]);

  const results = useMemo<Product[]>(() => {
    const active_ = products.filter((p) => p.isActive);
    switch (active) {
      case "new":
        return [...active_]
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 12);
      case "deals":
        return active_
          .filter((p) => p.mrp > p.price)
          .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
          .slice(0, 12);
      case "trending":
        return trending;
      case "organic":
        return active_.filter((p) => p.tags.includes("organic"));
      case "snacks":
        return active_.filter((p) => p.categorySlug === "snacks-beverages");
      default:
        return [];
    }
  }, [active, products, trending]);

  return (
    <section className="-mt-2">
      <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-1 pt-2">
        {STORIES.map((story) => {
          const Icon = story.icon;
          const isActive = active === story.id;
          return (
            <button
              key={story.id}
              onClick={() => setActive((cur) => (cur === story.id ? null : story.id))}
              className="flex min-w-[72px] flex-col items-center gap-2 group"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full p-[3px] shadow-md transition-transform group-active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-tr from-orange-600 to-amber-500 ring-2 ring-orange-300"
                    : story.gradient
                    ? "bg-gradient-to-tr from-orange-500 to-amber-400"
                    : "bg-slate-200"
                }`}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-white">
                  <Icon size={22} className={isActive ? "text-orange-600" : "text-slate-500"} />
                </div>
              </div>
              <span
                className={`text-2xs font-semibold ${
                  isActive ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {story.label}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-3">
          {loadingTrending && active === "trending" ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-400">Loading trending picks...</p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-400">
              Nothing here yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
