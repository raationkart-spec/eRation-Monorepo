"use client";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductImage } from "@/components/ProductImage";
import { EmptyState } from "@/components/misc";
import { ToastHost } from "@/components/toast";
import { useCart } from "@/lib/store";
import { useCartComputed } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { CartSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function CartPage() {
  const hydrated = useHydrated();
  const setQty = useCart((s) => s.setQty);
  const { lines, itemCount, subtotal, deliveryFee, freeDeliveryAbove, total } =
    useCartComputed();

  if (!hydrated) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white">
        <PageHeader title="My Cart" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add items to get started"
          ctaLabel="Start shopping"
          ctaHref="/"
        />
      </div>
    );
  }

  const remaining = freeDeliveryAbove - subtotal;

  return (
    <div className="content-in mx-auto min-h-screen max-w-2xl bg-surface-muted pb-28">
      <PageHeader title="My Cart" subtitle={`${itemCount} items`} />

      {deliveryFee > 0 && remaining > 0 && (
        <div className="bg-brand-50 px-4 py-2 text-center text-xs font-medium text-brand-dark">
          Add {formatMoney(remaining)} more for FREE delivery 🚚
        </div>
      )}

      <div className="space-y-2 p-3">
        {lines.map((line) => {
          const stockIssue = line.product.stockQty < line.quantity;
          return (
            <div
              key={line.product.id}
              className="rounded-lg border border-surface-border bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <Link href={`/product/${line.product.slug}`}>
                  <ProductImage
                    imageUrl={line.product.imageUrl}
                    emoji={line.product.emoji}
                    alt={line.product.name}
                    className="h-14 w-14 rounded-xl"
                    size="text-3xl"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-ink-subtle">{line.product.unit}</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {formatMoney(line.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-md bg-brand font-bold text-white">
                    <button
                      aria-label="Decrease"
                      onClick={() => setQty(line.product.id, line.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center active:scale-90"
                    >
                      {line.quantity === 1 ? (
                        <Trash2 size={14} />
                      ) : (
                        <Minus size={14} />
                      )}
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      aria-label="Increase"
                      onClick={() => setQty(line.product.id, line.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {stockIssue && (
                <p className="mt-2 rounded bg-red-50 px-2 py-1 text-2xs font-medium text-status-error">
                  Only {line.product.stockQty} left. Please reduce quantity.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-3 rounded-lg border border-surface-border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Bill Details</h2>
        <Row label="Item total" value={formatMoney(subtotal)} />
        <Row
          label="Delivery fee"
          value={deliveryFee === 0 ? "FREE" : formatMoney(deliveryFee)}
          valueClass={deliveryFee === 0 ? "text-status-success" : ""}
        />
        <div className="my-2 border-t border-dashed border-surface-border" />
        <Row label="To pay" value={formatMoney(total)} bold />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl border-t border-surface-border bg-white p-3">
        <Link
          href="/checkout"
          className="btn-primary w-full justify-between px-5 text-lg"
        >
          <span>{formatMoney(total)}</span>
          <span>Proceed to Checkout →</span>
        </Link>
      </div>
      <ToastHost />
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  valueClass = "",
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex justify-between py-0.5 text-sm ${
        bold ? "font-bold text-ink" : "text-ink-muted"
      }`}
    >
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
