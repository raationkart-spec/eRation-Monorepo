"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Image as ImageIcon,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { ToastHost } from "@/components/toast";
import { useAuth } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { AdminDashboardSkeleton } from "@/components/skeletons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const isLoginPage = pathname === "/admin/login";
  const isAdmin = user?.role === "ADMIN";

  // Gate: non-admins are sent to the admin login screen.
  useEffect(() => {
    if (!isLoginPage && hydrated && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, hydrated, isAdmin, router]);

  // The login screen renders standalone (no sidebar, no gate).
  if (isLoginPage) return <>{children}</>;

  if (!hydrated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <AdminDashboardSkeleton />
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Sidebar = (
    <nav className="flex h-full w-60 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 text-white">
        <span className="text-xl">🛒</span>
        <span className="text-lg font-bold">QuickCart</span>
        <span className="rounded bg-brand px-1.5 py-0.5 text-2xs font-bold text-white">
          ADMIN
        </span>
      </div>
      <div className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.href, n.exact);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          );
        })}
      </div>
      <div className="m-3 space-y-2">
        <button
          onClick={() => router.push("/")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          <ExternalLink size={16} /> View storefront
        </button>
        <button
          onClick={() => {
            logout();
            router.replace("/admin/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-red-300 hover:bg-slate-800"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:block">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 animate-slide-up">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={22} />
          </button>
          <span className="font-bold">QuickCart Admin</span>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
