"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, ShoppingBag } from "lucide-react";
import clsx from "clsx";
import { useCart } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/categories",
    label: "Categories",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/categories") || p.startsWith("/category"),
  },
  {
    href: "/orders",
    label: "Orders",
    icon: Package,
    match: (p: string) => p.startsWith("/orders"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingBag,
    match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout"),
    isCart: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);

  const cartCount = hydrated ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  // Hide bottom nav on login, verify, checkout & admin flows
  if (
    pathname === "/login" ||
    pathname === "/verify" ||
    pathname === "/checkout" ||
    pathname.startsWith("/admin")
  )
    return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 transform-gpu translate-z-0 glass-nav shadow-[0_-4px_16px_rgba(0,0,0,0.08)] rounded-t-2xl border-t border-slate-200/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
    >
      <div className="mx-auto flex max-w-2xl justify-around items-center pt-2">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1 transition-transform active:scale-95"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={clsx(
                    "transition-colors",
                    active ? "text-orange-600 drop-shadow-xs" : "text-slate-400"
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {t.isCart && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 animate-bump items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "text-2xs font-extrabold transition-colors",
                  active ? "text-orange-600 font-black" : "text-slate-500 font-semibold"
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
