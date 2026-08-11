"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, User } from "lucide-react";
import clsx from "clsx";

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
    href: "/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/account"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 glass-nav shadow-lg"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-transform active:scale-90"
            >
              <Icon
                size={22}
                className={active ? "text-orange-600" : "text-slate-400"}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={clsx(
                  "text-2xs font-semibold",
                  active ? "text-orange-600 font-extrabold" : "text-slate-500"
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
