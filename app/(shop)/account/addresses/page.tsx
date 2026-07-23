"use client";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useShop } from "@/lib/store";
import { EmptyState } from "@/components/misc";
import { ListSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function AddressesPage() {
  const hydrated = useHydrated();
  const addresses = useShop((s) => s.addresses);
  const deleteAddress = useShop((s) => s.deleteAddress);
  const setDefault = useShop((s) => s.setDefaultAddress);

  if (!hydrated) return <ListSkeleton rows={2} />;

  return (
    <div className="content-in">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Link
          href="/account/addresses/new"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark"
        >
          <Plus size={16} /> Add
        </Link>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          emoji="📍"
          title="No addresses saved"
          ctaLabel="Add address"
          ctaHref="/account/addresses/new"
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-surface-border bg-white p-3 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-dark">
                    {a.label ?? "Address"}
                  </span>
                  {a.isDefault && (
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-ink-muted">
                      Default
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteAddress(a.id)}
                  aria-label="Delete"
                  className="text-ink-subtle active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-2 text-sm font-semibold">{a.name}</p>
              <p className="text-xs text-ink-muted">
                {a.line1}, {a.line2 ? a.line2 + ", " : ""}
                {a.landmark ? a.landmark + ", " : ""}
                {a.city}, {a.state} - {a.pincode}
              </p>
              <p className="text-xs text-ink-subtle">{a.phone}</p>
              {!a.isDefault && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="mt-2 text-xs font-semibold text-brand-dark"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
