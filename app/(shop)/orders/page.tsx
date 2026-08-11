"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuth, useShop } from "@/lib/store";
import { EmptyState, OrderStatusBadge } from "@/components/misc";
import { ProductImage } from "@/components/ProductImage";
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
    <div className="content-in pb-28 max-w-2xl mx-auto">
      <h1 className="mb-4 text-2xl font-black text-slate-900 tracking-tight">My Orders</h1>
      <div className="space-y-3.5">
        {orders.map((o) => {
          const count = o.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="group block rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-500">
                  Order #{o.orderNumber}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {o.items.slice(0, 4).map((it, idx) => (
                  <ProductImage
                    key={idx}
                    imageUrl={it.imageUrl}
                    emoji={it.emoji}
                    alt={it.name}
                    className="h-12 w-12 rounded-xl border border-slate-100 shrink-0"
                    size="text-2xl"
                  />
                ))}
                {o.items.length > 4 && (
                  <span className="text-2xs font-extrabold text-slate-400">
                    +{o.items.length - 4} more
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between pt-1">
                <div>
                  <p className="text-base font-black text-slate-900">{formatMoney(o.total)}</p>
                  <p className="text-2xs font-semibold text-slate-400">
                    {count} items · {formatDate(o.createdAt)}
                  </p>
                </div>
                <span className="flex items-center text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                  View Details <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
