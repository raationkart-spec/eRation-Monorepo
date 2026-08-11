"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, LogOut, MapPin, Package, Pencil } from "lucide-react";
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
      <div>
        <Skel className="h-7 w-32" />
        <Skel className="mt-4 h-20 w-full rounded-xl" />
        <Skel className="mt-4 h-40 w-full rounded-xl" />
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
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="content-in">
      <h1 className="mb-4 text-2xl font-bold">Account</h1>

      <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white p-4 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-dark">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user.name}
                className="min-w-0 flex-1 rounded border border-surface-border px-2 py-1 text-sm"
              />
              <button
                onClick={() => {
                  if (name.trim()) updateName(name.trim());
                  setEditing(false);
                }}
                className="text-sm font-semibold text-brand-dark"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <button
                onClick={() => {
                  setName(user.name);
                  setEditing(true);
                }}
              >
                <Pencil size={14} className="text-ink-subtle" />
              </button>
            </div>
          )}
          {user.phone && (
            <p className="text-sm text-ink-muted">{user.phone}</p>
          )}
          {user.email && (
            <p className="truncate text-xs text-ink-subtle">{user.email}</p>
          )}
        </div>
      </div>

      <div className="mt-4 divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border bg-white shadow-card">
        <Item href="/orders" icon={<Package size={20} />} label="My Orders" />
        <Item
          href="/account/addresses"
          icon={<MapPin size={20} />}
          label="My Addresses"
        />
      </div>

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-white py-3 text-sm font-semibold text-status-error shadow-card"
      >
        <LogOut size={18} /> Log out
      </button>

      <p className="mt-6 text-center text-2xs text-ink-subtle">
        QuickCart demo · v1.0
      </p>
    </div>
  );
}

function Item({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-ink-muted">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight size={18} className="text-ink-subtle" />
    </Link>
  );
}
