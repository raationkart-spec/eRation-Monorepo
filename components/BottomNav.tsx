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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-white shadow-nav"
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
              className="flex flex-1 flex-col items-center gap-0.5 py-2"
            >
              <Icon
                size={22}
                className={active ? "text-brand-dark" : "text-ink-subtle"}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={clsx(
                  "text-2xs font-medium",
                  active ? "text-brand-dark" : "text-ink-subtle"
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
