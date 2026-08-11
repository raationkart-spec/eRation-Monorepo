"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Pencil,
  CreditCard,
  HelpCircle,
  Settings,
  Star,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/store";
import { EmptyState } from "@/components/misc";
import { Skel } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function AccountPage() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const updateName = useAuth((s) => s.updateName);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (!hydrated)
    return (
      <div className="space-y-4">
        <Skel className="h-7 w-32" />
        <Skel className="h-28 w-full rounded-2xl" />
        <Skel className="h-64 w-full rounded-2xl" />
      </div>
    );

  if (!user) {
    return (
      <EmptyState
        emoji="👤"
        title="Sign in to your account"
        subtitle="Manage orders, addresses and more"
        ctaLabel="Sign in"
        ctaHref="/login"
      />
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "QC";

  return (
    <div className="content-in space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Account</h1>

      {/* Profile Card matching Stitch */}
      <section className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-orange-500 bg-orange-100 font-extrabold text-orange-700 text-xl shadow-inner">
          {user.image ? (
            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user.name}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500"
              />
              <button
                onClick={() => {
                  if (name.trim()) updateName(name.trim());
                  setEditing(false);
                }}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-slate-900">{user.name}</h2>
              <button
                onClick={() => {
                  setName(user.name);
                  setEditing(true);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <Pencil size={15} />
              </button>
            </div>
          )}
          {user.email && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
              <Mail size={13} className="text-slate-400" /> {user.email}
            </p>
          )}
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700 border border-emerald-200/60">
            <Star size={11} className="fill-emerald-600 text-emerald-600" /> VIP Member
          </div>
        </div>
      </section>

      {/* Menu List Card matching Stitch */}
      <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm divide-y divide-slate-100">
        <MenuItem
          href="/orders"
          icon={<Package size={20} />}
          label="My Orders"
        />
        <MenuItem
          href="/account/addresses"
          icon={<MapPin size={20} />}
          label="Saved Addresses"
        />
        <MenuItem
          href="/orders"
          icon={<HelpCircle size={20} />}
          label="Refunds & Help"
        />
        <MenuItem
          href="/account"
          icon={<CreditCard size={20} />}
          label="Manage Payments"
        />
        <MenuItem
          href="/account"
          icon={<Settings size={20} />}
          label="Settings"
        />
      </section>

      {/* Logout Button in soft red */}
      <div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/80 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95 shadow-2xs"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <p className="text-center text-2xs font-semibold text-slate-400">
        QuickCart Instant Grocery Platform · v1.0
      </p>
    </div>
  );
}

function MenuItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 transition hover:bg-slate-50 active:bg-slate-100"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-orange-100 group-hover:text-orange-600">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
