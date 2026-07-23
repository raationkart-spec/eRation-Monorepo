"use client";
import Link from "next/link";
import { ChevronDown, MapPin, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { SearchBar } from "./SearchBar";

export function TopBar() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold tracking-tight text-brand-dark">
              QuickCart
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden items-center gap-1 text-xs text-ink-muted sm:flex">
            <MapPin size={14} className="text-brand-dark" />
            <span className="font-medium text-ink">560001</span>
            <ChevronDown size={14} />
          </button>
          <Link href="/cart" aria-label="Cart" className="relative p-1">
            <ShoppingCart size={24} className="text-ink" />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-brand px-1 text-2xs font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="border-b border-surface-border px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
