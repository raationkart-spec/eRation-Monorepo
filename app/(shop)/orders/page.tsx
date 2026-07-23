"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuth, useShop } from "@/lib/store";
import { EmptyState, OrderStatusBadge } from "@/components/misc";
import { formatDate, formatMoney } from "@/lib/format";
import { ListSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function OrdersPage() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const orders = useShop((s) => s.orders);

  if (!hydrated) return <ListSkeleton rows={4} />;

  if (!user) {
    return (
      <EmptyState
        emoji="🔐"
        title="Sign in to see your orders"
        ctaLabel="Sign in"
        ctaHref="/login?returnTo=/orders"
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        emoji="📦"
        title="No orders yet"
        subtitle="Start shopping to place your first order!"
        ctaLabel="Browse products"
        ctaHref="/"
      />
    );
  }

  return (
    <div className="content-in">
      <h1 className="mb-3 text-2xl font-bold">My Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => {
          const count = o.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block rounded-lg border border-surface-border bg-white p-3 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted">
                  #{o.orderNumber}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                {o.items.slice(0, 4).map((it, idx) => (
                  <span
                    key={idx}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted text-xl"
                  >
                    {it.emoji}
                  </span>
                ))}
                {o.items.length > 4 && (
                  <span className="text-xs text-ink-subtle">
                    +{o.items.length - 4} more
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{formatMoney(o.total)}</p>
                  <p className="text-2xs text-ink-subtle">
                    {count} items · {formatDate(o.createdAt)}
                  </p>
                </div>
                <span className="flex items-center text-sm font-semibold text-brand-dark">
                  View <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
