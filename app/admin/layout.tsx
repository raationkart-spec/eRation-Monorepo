"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
  Shield,
  Zap,
  UtensilsCrossed,
} from "lucide-react";
import clsx from "clsx";
import { ToastHost } from "@/components/toast";
import { useAuth, useCatalog } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { AdminDashboardSkeleton } from "@/components/skeletons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/discounts", label: "Discounts & Coupons", icon: Tag },
  { href: "/admin/flash-deals", label: "Flash Deals", icon: Zap },
  { href: "/admin/bundles", label: "Bundles", icon: UtensilsCrossed },
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
  const config = useCatalog((s) => s.config);
  const isStoreOpen = (config as any).isStoreOpen !== false;

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
    <nav className="flex h-full w-64 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-2.5 px-5 py-5 text-white border-b border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-xl font-black shadow-md">
          ⚡
        </span>
        <div>
          <span className="text-base font-extrabold tracking-tight block leading-none">
            QuickCart
          </span>
          <span className="text-2xs font-bold text-orange-400 tracking-wider">
            ADMIN PORTAL
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1 px-3 py-4">
        <div className="px-3 pb-2 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
          Management
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.href, n.exact);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          );
        })}
      </div>

      <div className="m-3 space-y-2 border-t border-slate-800 pt-3">
        <div className="px-3 py-1 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate">{user?.email || "Admin User"}</span>
          <Shield size={14} className="text-orange-400" />
        </div>
        <button
          onClick={() => {
            logout();
            router.replace("/admin/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-red-400 hover:bg-slate-800/80 transition"
        >
          <LogOut size={15} /> Log out Admin
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      {/* Desktop sidebar */}
      <aside className="hidden md:block shrink-0">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 animate-slide-up">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop & Mobile Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 py-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Menu"
              className="md:hidden text-slate-700 hover:text-slate-900"
            >
              <Menu size={22} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Siliguri Operations</span>
              <span className="text-slate-300">•</span>
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  isStoreOpen ? "text-emerald-600" : "text-red-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isStoreOpen
                      ? "bg-emerald-500 animate-ping"
                      : "bg-red-500"
                  }`}
                />{" "}
                {isStoreOpen
                  ? "Store Live & Accepting Orders"
                  : "⚠️ Store Closed — Not Accepting Orders"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-2xs font-extrabold text-slate-600">
              Desktop Console v2.0
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8 max-w-7xl">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
