"use client";
import Link from "next/link";
import { ChevronDown, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { SearchBar } from "./SearchBar";

export function TopBar() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  return (
    <header className="glass-header">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-sm">
              <span className="text-xl">🛒</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                QuickCart
              </span>
            </div>
          </Link>
          <div className="hidden items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-2xs font-bold text-orange-600 sm:flex border border-orange-200">
            <Sparkles size={12} className="text-orange-500" /> 10 MINS
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition">
            <MapPin size={13} className="text-orange-500" />
            <span className="font-semibold text-slate-800">560001</span>
            <ChevronDown size={13} />
          </button>
          <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm">
            <ShoppingBag size={20} className="text-slate-800" />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 px-1 text-2xs font-extrabold text-white shadow-sm"
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5">
        <SearchBar />
      </div>
    </header>
  );
}
