"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/store";
import { useCartComputed } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";

export function FloatingCartBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const { total } = useCartComputed();

  const count = hydrated ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  // Only show on the home screen and category browsing screens
  const isVisiblePage =
    pathname === "/" ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/category");

  if (!hydrated || count === 0 || !isVisiblePage) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-2xl px-4 pointer-events-none">
      <Link
        href="/cart"
        className="pointer-events-auto flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 px-4 py-3 text-white shadow-xl shadow-emerald-950/20 active:scale-98 transition-all duration-200 border border-emerald-500/40 animate-slide-up"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs font-black">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/25 px-1.5 py-0.5 text-2xs font-black tracking-wider uppercase text-white">
                {count} {count === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className="text-xs font-bold text-emerald-100">• 10-Min Delivery</span>
            </div>
            <p className="text-base font-black leading-tight text-white mt-0.5">
              {formatMoney(total)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-800 shadow-md">
          <span>View Cart</span>
          <ArrowRight size={15} />
        </div>
      </Link>
    </div>
  );
}
